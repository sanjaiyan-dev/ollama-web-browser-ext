import { storage } from "#imports";

const OLLAMA_DNR_RULE_ID = 11434;

async function syncOllamaCorsRules(endpointUrl: string) {
	try {
		const url = new URL(endpointUrl);
		const domain = url.hostname;
		const port = url.port || "11434";

		const rule: Browser.declarativeNetRequest.Rule = {
			id: OLLAMA_DNR_RULE_ID,
			priority: 1,
			action: {
				type: "modifyHeaders",
				requestHeaders: [
					// Rewrite the extension origin to mimic a direct local call
					{
						header: "Origin",
						operation: "set",
						value: `${url.protocol}//${domain}:${port}`,
					},
				],
				responseHeaders: [
					// Ensure the renderer sees valid CORS allowance
					{
						header: "Access-Control-Allow-Origin",
						operation: "set",
						value: "*",
					},
					{
						header: "Access-Control-Allow-Methods",
						operation: "set",
						value: "GET, POST, PUT, DELETE, OPTIONS",
					},
					{
						header: "Access-Control-Allow-Headers",
						operation: "set",
						value: "*",
					},
				],
			},
			condition: {
				// Intercept calls destined for the local Ollama daemon
				urlFilter: `||${domain}:${port}/*`,
				resourceTypes: ["xmlhttprequest"],
			},
		};

		await browser.declarativeNetRequest.updateDynamicRules({
			removeRuleIds: [OLLAMA_DNR_RULE_ID],
			addRules: [rule],
		});
	} catch (e) {
		console.error("[Ollama CORS Engine] Failed to configure DNR rules:", e);
	}
}
export default defineBackground(() => {
	browser.sidePanel
		.setPanelBehavior({ openPanelOnActionClick: true })
		.catch((error) => console.error("Error setting panel behavior:", error));

	browser.sidePanel
		.setPanelBehavior({
			openPanelOnActionClick: true,
		})
		.catch((error) => console.error("Error setting panel behavior:", error));

	storage.getItem<string>("local:ollamaEndPointAtom").then((saved) => {
		syncOllamaCorsRules(saved || "http://localhost:11434");
	});

	storage.watch<string>("local:ollamaEndPointAtom", (newEndpoint) => {
		if (newEndpoint) syncOllamaCorsRules(newEndpoint);
	});
});
