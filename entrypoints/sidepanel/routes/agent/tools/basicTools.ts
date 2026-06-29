import axios from "axios";

/**
 * Types mapping strictly to the arguments defined in the Tool Schemas
 */
export type ToolArguments = {
	createNewTab: { url: string };
	browser_navigate: { url: string };
	click_interactive_element: { text?: string; selector?: string };
	web_search: { query: string };
	export_session_auth: { domain: string };
	organize_tabs: {
		group_name: string;
		urls_to_group: string[];
		color?: Browser.tabGroups.Color;
	};
	create_monitoring_alarm: {
		alarm_name: string;
		url: string;
		interval_minutes: number;
		selector: string;
	};
	fill_form_fields: {
		fields: Array<{ selector?: string; label?: string; value: string }>;
	};
};

/**
 * 1. Active Tab Information
 */
export async function getActiveTabInfo(): Promise<{
	title?: string;
	url?: string;
}> {
	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	return { title: tab?.title, url: tab?.url };
}

/**
 * 2. Create New Tab
 */
export async function createNewTab(
	args: ToolArguments["createNewTab"],
): Promise<Browser.tabs.Tab> {
	return await browser.tabs.create({ url: args.url });
}

/**
 * 3. Navigate Browser Current Tab
 */
export async function browser_navigate(
	args: ToolArguments["browser_navigate"],
): Promise<Browser.tabs.Tab | undefined> {
	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	if (!tab || !tab.id) {
		throw new Error("No active tab found to navigate.");
	}
	return await browser.tabs.update(tab.id, { url: args.url });
}

/**
 * 4. Click Interactive Element
 * Walk the DOM to prevent XPath string parsing errors and dispatch custom bubbling MouseEvents.
 */
export async function click_interactive_element(
	args: ToolArguments["click_interactive_element"],
): Promise<{ success: boolean; message: string } | undefined> {
	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	if (!tab || !tab.id) {
		return { success: false, message: "No active tab found." };
	}

	try {
		const [{ result }] = await browser.scripting.executeScript({
			target: { tabId: tab.id },
			args: [args.text ?? null, args.selector ?? null],
			func: (text, selector) => {
				let element: HTMLElement | null = null;

				if (text) {
					const sanitizedText = text.trim().toLowerCase();
					const walker = document.createTreeWalker(
						document.body,
						NodeFilter.SHOW_ELEMENT,
						{
							acceptNode: (node: Node) => {
								const el = node as HTMLElement;
								const tag = el.tagName.toLowerCase();
								if (["script", "style", "noscript"].includes(tag)) {
									return NodeFilter.FILTER_REJECT;
								}
								const valueAttr = el.getAttribute("value") || "";
								const placeholderAttr = el.getAttribute("placeholder") || "";
								const ariaLabel = el.getAttribute("aria-label") || "";
								const elementText = (el.innerText || "").toLowerCase();

								if (
									elementText.includes(sanitizedText) ||
									valueAttr.toLowerCase().includes(sanitizedText) ||
									placeholderAttr.toLowerCase().includes(sanitizedText) ||
									ariaLabel.toLowerCase().includes(sanitizedText)
								) {
									return NodeFilter.FILTER_ACCEPT;
								}
								return NodeFilter.FILTER_SKIP;
							},
						},
					);

					let currentNode = walker.nextNode();

					while (currentNode) {
						element = currentNode as HTMLElement;
						currentNode = walker.nextNode();
					}
				}

				// Fallback Selector match
				if (!element && selector) {
					element = document.querySelector(selector);
				}

				if (element) {
					// Simulate robust programmatic mouse interactions
					const mousedown = new MouseEvent("mousedown", {
						bubbles: true,
						cancelable: true,
					});
					const mouseup = new MouseEvent("mouseup", {
						bubbles: true,
						cancelable: true,
					});
					const click = new MouseEvent("click", {
						bubbles: true,
						cancelable: true,
					});

					element.dispatchEvent(mousedown);
					element.dispatchEvent(mouseup);
					element.dispatchEvent(click);

					return {
						success: true,
						message: `Dispatched full click event flow to targeted target element.`,
					};
				}

				return { success: false, message: "Target DOM element was not found." };
			},
		});
		return result;
	} catch (error: any) {
		return {
			success: false,
			message: `Execution failed: ${error?.message || error}`,
		};
	}
}

/**
 * 5. Get Highlighted Text
 */
export async function get_highlighted_text(): Promise<{ text: string }> {
	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	if (!tab || !tab.id) return { text: "" };

	try {
		const [{ result }] = await browser.scripting.executeScript({
			target: { tabId: tab.id },
			func: () => window.getSelection()?.toString() || "",
		});
		return { text: result || "" };
	} catch {
		return { text: "" };
	}
}

/**
 * 6. Web Search
 * Queries DuckDuckGo HTML version inside the background script to gather snippet results without API keys.
 */
export async function web_search(
	args: ToolArguments["web_search"],
): Promise<Array<{ title: string; url: string; snippet: string }>> {
	try {
		const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(args.query)}`;
		const response = await fetch(searchUrl, {
			headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
		});
		const html = await response.text();

		const results: Array<{ title: string; url: string; snippet: string }> = [];
		const resultRegExp =
			/<a\s+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a\s+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
		let match;
		let count = 0;

		while ((match = resultRegExp.exec(html)) !== null && count < 5) {
			let url = match[1];
			if (url.startsWith("//duckduckgo.com/l/?uddg=")) {
				const searchParams = new URLSearchParams(url.split("?")[1]);
				url = searchParams.get("uddg") || url;
			}
			const title = match[2]
				.trim()
				.replace(/&amp;/g, "&")
				.replace(/&quot;/g, '"');
			const snippet = match[3]
				.trim()
				.replace(/<[^>]*>/g, "")
				.replace(/&amp;/g, "&")
				.replace(/&quot;/g, '"');

			results.push({ title, url, snippet });
			count++;
		}
		return results;
	} catch (error) {
		return [
			{
				title: "Search Error",
				url: "",
				snippet: "Failed to execute background web fetch.",
			},
		];
	}
}

/**
 * 7. Read Readable Content
 * Pulls body text and cleans non-content tags.
 */
export async function read_readable_content(): Promise<{ content: string }> {
	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	if (!tab || !tab.id) throw new Error("No active tab found.");

	try {
		const [{ result }] = await browser.scripting.executeScript({
			target: { tabId: tab.id },
			func: () => {
				const bodyClone = document.body.cloneNode(true) as HTMLElement;
				const selectorsToRemove = [
					"script",
					"style",
					"noscript",
					"iframe",
					"header",
					"footer",
					"nav",
					"aside",
					".nav",
					".footer",
					"#footer",
					".sidebar",
					"#sidebar",
					"form",
					"button",
					"input",
				];
				selectorsToRemove.forEach((selector) => {
					bodyClone.querySelectorAll(selector).forEach((el) => el.remove());
				});

				const rawText = bodyClone.innerText || bodyClone.textContent || "";
				// Normalize spacing to protect LLM context length
				const cleanText = rawText
					.replace(/\s+/g, " ")
					.replace(/\n+/g, "\n")
					.trim();
				return cleanText.substring(0, 10000); // Token truncation ceiling
			},
		});
		return { content: result || "" };
	} catch (error: any) {
		return { content: `Error extracting page body: ${error?.message}` };
	}
}

/**
 * 8. Export Session Cookies
 */
export async function export_session_auth(
	args: ToolArguments["export_session_auth"],
): Promise<{ cookies: string }> {
	const cookies = await browser.cookies.getAll({ domain: args.domain });
	const cookieString = cookies
		.map((cookie) => `${cookie.name}=${cookie.value}`)
		.join("; ");
	return { cookies: cookieString };
}

/**
 * 9. Organize and Group Tabs
 */
export async function organize_tabs(
	args: ToolArguments["organize_tabs"],
): Promise<{ success: boolean; closedCount: number }> {
	const allTabs = await browser.tabs.query({});
	const tabsToGroup: number[] = [];
	const tabsToClose: number[] = [];

	const normalizeUrl = (u: string) => {
		try {
			return new URL(u).hostname;
		} catch {
			return u;
		}
	};

	const targetHosts = args.urls_to_group.map(normalizeUrl);

	for (const tab of allTabs) {
		if (!tab.id) continue;
		const tabHost = normalizeUrl(tab.url || "");
		const isTarget = targetHosts.some((target) => tabHost.includes(target));

		if (isTarget) {
			tabsToGroup.push(tab.id);
		} else if (!tab.pinned) {
			tabsToClose.push(tab.id);
		}
	}

	if (tabsToGroup.length > 0) {
		const groupId = await browser.tabs.group({
			tabIds: tabsToGroup as [number, ...number[]],
		});

		await browser.tabGroups.update(groupId, {
			title: args.group_name,
			color: args.color || "blue",
		});
	}

	if (tabsToClose.length > 0) {
		await browser.tabs.remove(tabsToClose);
	}

	return { success: true, closedCount: tabsToClose.length };
}

/**
 * 10. System Metrics
 */
export async function get_system_metrics(): Promise<{
	cpuModel: string;
	availableMemoryGB: number;
	totalMemoryGB: number;
}> {
	const cpuInfo = await browser.system.cpu.getInfo();
	const memInfo = await browser.system.memory.getInfo();

	const totalMemoryGB =
		Math.round((memInfo.capacity / (1024 * 1024 * 1024)) * 100) / 100;
	const availableMemoryGB =
		Math.round((memInfo.availableCapacity / (1024 * 1024 * 1024)) * 100) / 100;

	return {
		cpuModel: cpuInfo.modelName,
		availableMemoryGB,
		totalMemoryGB,
	};
}

/**
 * 11. Monitoring Alarms
 */
export async function create_monitoring_alarm(
	args: ToolArguments["create_monitoring_alarm"],
): Promise<{ success: boolean }> {
	// Store configurations locally to access when the Alarm fires.
	await browser.storage.local.set({
		[`alarm_config_${args.alarm_name}`]: {
			url: args.url,
			selector: args.selector,
		},
	});

	await browser.alarms.create(args.alarm_name, {
		periodInMinutes: args.interval_minutes,
	});

	return { success: true };
}
/**
 * 12. Get Stored User Autofill Profile
 */
export async function get_user_profile(): Promise<{
	success: boolean;
	profile?: any;
	error?: string;
}> {
	try {
		const result = await browser.storage.sync.get(
			"agent_user_autofill_profile",
		);
		const profile = result["agent_user_autofill_profile"];
		return { success: true, profile: profile || null };
	} catch (err: any) {
		return { success: false, error: err?.message || String(err) };
	}
}

/**
 * 13. Fill Form Fields
 * Dynamically queries active DOM inputs and applies simulated input events
 * to bypass modern reactive framework state-locks.
 */
export async function fill_form_fields(
	args: ToolArguments["fill_form_fields"],
): Promise<{ success: boolean; message: string }> {
	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	if (!tab || !tab.id) {
		return { success: false, message: "No active tab found." };
	}

	// Safeguard: replace undefined properties with null to protect clone serialization
	const sanitizedFields = args.fields.map((field) => ({
		selector: field.selector ?? null,
		label: field.label ?? null,
		value: field.value ?? "",
	}));

	try {
		const [{ result }] = await browser.scripting.executeScript({
			target: { tabId: tab.id },
			args: [sanitizedFields],
			func: (fields) => {
				let filledCount = 0;
				const failures: string[] = [];

				for (const field of fields) {
					let element:
						| HTMLInputElement
						| HTMLTextAreaElement
						| HTMLSelectElement
						| null = null;

					if (field.selector) {
						element = document.querySelector(field.selector);
					}

					if (!element && field.label) {
						const queryText = field.label.trim().toLowerCase();

						const labels = Array.from(document.querySelectorAll("label"));
						for (const label of labels) {
							if (label.innerText.toLowerCase().includes(queryText)) {
								if (label.htmlFor) {
									element = document.getElementById(label.htmlFor) as any;
								} else {
									element = label.querySelector("input, textarea, select");
								}
								if (element) break;
							}
						}

						if (!element) {
							const inputs = Array.from(
								document.querySelectorAll("input, textarea, select"),
							) as Array<
								HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
							>;
							for (const input of inputs) {
								const placeholder = input.getAttribute("placeholder") || "";
								const name = input.getAttribute("name") || "";
								const ariaLabel = input.getAttribute("aria-label") || "";

								if (
									placeholder.toLowerCase().includes(queryText) ||
									name.toLowerCase().includes(queryText) ||
									ariaLabel.toLowerCase().includes(queryText)
								) {
									element = input;
									break;
								}
							}
						}
					}

					if (element) {
						element.value = field.value;
						element.dispatchEvent(new Event("input", { bubbles: true }));
						element.dispatchEvent(new Event("change", { bubbles: true }));
						filledCount++;
					} else {
						failures.push(
							field.label || field.selector || "unidentified field",
						);
					}
				}

				return {
					success: filledCount > 0,
					message: `Successfully filled ${filledCount}/${fields.length} fields.${
						failures.length > 0 ? " Missing: " + failures.join(", ") : ""
					}`,
				};
			},
		});

		return result as { success: boolean; message: string };
	} catch (error: any) {
		return {
			success: false,
			message: `Script injection failed: ${error?.message || error}`,
		};
	}
}
