export interface ToolDefinition {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: {
			type: "object";
			properties: Record<string, any>;
			required: string[];
		};
	};
}

const basicTools = [
	{
		type: "function",
		function: {
			name: "getActiveTabInfo",
			description:
				"Gets the title and URL of the active browser tab. Accepts no parameters.",
			parameters: {
				type: "object",
				properties: {},
				required: [],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "createNewTab",
			description:
				"Opens a completely new browser tab with a specific URL. Use this ONLY when the user explicitly asks for a 'new' tab; otherwise, use browser_navigate.",
			parameters: {
				type: "object",
				properties: {
					url: {
						type: "string",
						description:
							"The destination URL to open. Must start with http:// or https://",
					},
				},
				required: ["url"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "browser_navigate",
			description:
				"Navigates the currently active browser tab to a specified URL. Use this to redirect the existing tab. Do not use to open a new tab.",
			parameters: {
				type: "object",
				properties: {
					url: {
						type: "string",
						description:
							"The target destination URL (e.g., https://digital-tamizh.web.app). Must start with http:// or https://",
					},
				},
				required: ["url"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "click_interactive_element",
			description:
				"Clicks an element on the active page matching text content or a CSS selector fallback. At least one of the parameters must be specified.",
			parameters: {
				type: "object",
				properties: {
					text: {
						type: "string",
						description:
							"The exact or partial text of the button or link to click (e.g., 'Log In' or 'Submit'). Use this as the primary method.",
					},
					selector: {
						type: "string",
						description:
							"Optional CSS selector fallback if text-matching is not suitable or available.",
					},
				},
				required: [],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "get_highlighted_text",
			description:
				"Retrieves the text currently selected/highlighted by the user on the active webpage. Accepts no parameters.",
			parameters: {
				type: "object",
				properties: {},
				required: [],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "web_search",
			description:
				"Searches the web for real-time information and facts. Ideal for answering current event queries.",
			parameters: {
				type: "object",
				properties: {
					query: {
						type: "string",
						description:
							"The concise, keyword-based search query. Do not include conversational filler words.",
					},
				},
				required: ["query"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "read_readable_content",
			description:
				"Extracts clean readable page text, removing navigation, sidebars, headers, and excessive boilerplate tags. Accepts no parameters.",
			parameters: {
				type: "object",
				properties: {},
				required: [],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "export_session_auth",
			description:
				"Retrieves active session cookie strings for a specific domain to allow authenticated API fetching.",
			parameters: {
				type: "object",
				properties: {
					domain: {
						type: "string",
						description:
							"The target domain name (e.g., 'github.com' or 'reddit.com'). Do not include protocol (http/https) or 'www.' prefix.",
					},
				},
				required: ["domain"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "organize_tabs",
			description:
				"Groups specific color-coded tab groups and closes unrelated tabs.",
			parameters: {
				type: "object",
				properties: {
					group_name: {
						type: "string",
						description: "The display title of the new tab group.",
					},
					urls_to_group: {
						type: "array",
						description:
							"An array of exact URL strings belonging to the group.",
						items: {
							type: "string",
						},
					},
					color: {
						type: "string",
						description: "The visual color indicator of the tab group.",
						enum: [
							"grey",
							"blue",
							"red",
							"yellow",
							"green",
							"pink",
							"purple",
							"cyan",
							"orange",
						],
					},
				},
				required: ["group_name", "urls_to_group"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "get_system_metrics",
			description:
				"Queries the browser for host hardware specs, current CPU load, and available memory. Accepts no parameters.",
			parameters: {
				type: "object",
				properties: {},
				required: [],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "create_monitoring_alarm",
			description:
				"Schedules a background alarm to check a specific webpage periodically.",
			parameters: {
				type: "object",
				properties: {
					alarm_name: {
						type: "string",
						description:
							"A unique, recognizable key or label for the background alarm.",
					},
					url: {
						type: "string",
						description: "The exact target URL of the webpage to monitor.",
					},
					interval_minutes: {
						type: "integer",
						description:
							"The execution frequency in minutes. Must be a whole integer.",
					},
					selector: {
						type: "string",
						description:
							"The specific DOM selector targeting the price or metric container to watch (e.g., '#price-tag').",
					},
				},
				required: ["alarm_name", "url", "interval_minutes"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "get_user_profile",
			description:
				"Retrieves the stored autofill details of the user (e.g., name, email, phone, city, address) to know what data to use when filling out forms. Accepts no parameters.",
			parameters: {
				type: "object",
				properties: {},
				required: [],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "fill_form_fields",
			description:
				"Fills multiple input fields, textareas, or dropdowns on the active webpage with specified values simultaneously.",
			parameters: {
				type: "object",
				properties: {
					fields: {
						type: "array",
						description: "An array of fields to fill.",
						items: {
							type: "object",
							properties: {
								selector: {
									type: "string",
									description:
										"Optional CSS selector for the target input element (e.g., '#email', 'input[name=\"first_name\"]').",
								},
								label: {
									type: "string",
									description:
										"Optional visual label, name attribute, placeholder, or aria-label to locate the input.",
								},
								value: {
									type: "string",
									description:
										"The text or option value to fill into the targeted element.",
								},
							},
							required: ["value"],
						},
					},
				},
				required: ["fields"],
			},
		},
	},
] as const; // This closes the basicTools array

const googleTools = [] satisfies ToolDefinition[];

export const toolsSchema = [...basicTools, ...googleTools] as const;
