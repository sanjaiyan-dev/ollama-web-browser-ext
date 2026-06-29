"use memo";

import { useQuery } from "@tanstack/react-query";
import { OLLAMA_BROWSER_EXT_REACTQUERY_KEY } from "./index";
import { useActiveTab } from "../utils";

import { browser } from "#imports";

export interface ExtractedContent {
	title: string;
	text: string;
	html: string;
}

export function isRestrictedUrl(url?: string): boolean {
	if (!url) return true;
	return (
		url.startsWith("chrome://") ||
		url.startsWith("chrome-extension://") ||
		url.startsWith("devtools://") ||
		url.startsWith("edge://") ||
		url.startsWith("about:") ||
		url.includes("chromewebstore.google.com")
	);
}

export async function fetchTabContent(
	tabId: number,
): Promise<ExtractedContent> {
	try {
		const results = await browser.scripting.executeScript({
			target: { tabId },
			func: () => {
				return {
					title: document.title,
					text: document.body?.innerText || "",
					html: document.documentElement.outerHTML.substring(0, 10000),
				};
			},
		});

		if (results?.[0]?.result) {
			return results[0].result as ExtractedContent;
		}
		throw new Error("No content returned from page extraction.");
	} catch (error) {
		console.error("Script injection error:", error);
		throw error;
	}
}

export const useBrowserCurrentActiveTab = () => {
	"use memo";
	const activeTab = useActiveTab();
	return useQuery({
		queryKey: [
			OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
			activeTab?.id,
			activeTab?.url,
		] as const,
		queryFn: async () => {
			if (!activeTab?.id) throw new Error("No active tab identified.");

			if (isRestrictedUrl(activeTab.url)) {
				return {
					title: "Restricted Page",
					text: "Scripts cannot run on secure browser pages or extensions stores.",
					html: "<noscript>Scripts cannot run on secure browser pages or extensions stores.</noscript>",
				};
			}

			return fetchTabContent(activeTab.id);
		},
		enabled: !!activeTab?.id && !!activeTab?.url,
		staleTime: 7 * 60 * 1000,
		gcTime: 12 * 60 * 1000,
	});
};
