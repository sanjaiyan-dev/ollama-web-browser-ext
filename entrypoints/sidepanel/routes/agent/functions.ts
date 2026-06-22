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

const basicTools: ToolDefinition[] = [
	{
		type: "function",
		function: {
			name: "getActiveTabInfo",
			description: "Gets the title and URL of the active browser tab.",
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
			description: "Opens a new browser tab with a specific URL.",
			parameters: {
				type: "object",
				properties: {
					url: {
						type: "string",
						description:
							"The destination URL starting with http:// or https://",
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
			description: "Navigates the current browser tab to a specified URL.",
			parameters: {
				type: "object",
				properties: {
					url: {
						type: "string",
						description:
							"The target destination URL (e.g., https://digital-tamizh.web.app).",
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
				"Clicks an element on the active page matching text content or a CSS selector fallback.",
			parameters: {
				type: "object",
				properties: {
					text: {
						type: "string",
						description:
							"The exact or partial text of the button or link to click (e.g., 'Log In' or 'Submit').",
					},
					selector: {
						type: "string",
						description:
							"Optional CSS selector to use if text-matching is not suitable.",
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
				"Retrieves the text currently selected/highlighted by the user on the active webpage.",
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
				"Searches the web for real-time information and facts without needing external API keys.",
			parameters: {
				type: "object",
				properties: {
					query: { type: "string", description: "The keyword search query." },
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
				"Extracts clean readable page text, removing navigation, sidebars, headers, and excessive boilerplate tags.",
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
							"The target domain (e.g., '.github.com' or 'reddit.com').",
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
				"Groups specific color-coded tab groups, and closes unrelated tabs.",
			parameters: {
				type: "object",
				properties: {
					group_name: {
						type: "string",
						description: "The title of the tab group",
					},
					urls_to_group: {
						type: "array",
						items: "string",
					},
					color: {
						type: "string",
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
				"Queries the browser for the host hardware specs, current CPU load, and available memory.",
			parameters: {
				type: "object",
				properties: {
					type: "object",
					properties: {},
				},
				required: [],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "create_monitoring_alarm",
			description:
				"Schedules a background alarm to check a webpage periodically.",
			parameters: {
				type: "object",
				properties: {
					alarm_name: {
						type: "string",
					},
					url: {
						type: "string",
					},
					interval_minutes: {
						type: "number",
					},
					selector: {
						type: "string",
						description: "The DOM selector containing the price or metrics",
					},
				},
				required: ["alarm_name", "url", "interval_minutes"],
			},
		},
	},
] as const;

const googleTools = [] satisfies ToolDefinition[];

export const toolsSchema = [...basicTools, ...googleTools] as const;
