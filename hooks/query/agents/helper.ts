import { toolsSchema } from "@/entrypoints/sidepanel/routes/agent/functions";

export async function* fetchOllamaStream(
	messages: { role: string; content: string; tool_calls?: any }[],
	model: string,
	isToolMode: boolean,
	functionCall: typeof toolsSchema,
	onToolCalls?: (toolCalls: any[]) => void, // Tactical: Capture tool invocations on-the-fly
): AsyncIterable<string> {
	"use memo";
	const payload = {
		model,
		messages,
		stream: true,
		...(isToolMode ? { tools: toolsSchema, think: true } : { think: true }),
		// Prevent strict parameter overwrites by merging the custom tools array if supplied
		...(functionCall && functionCall.length > 0 ? { tools: functionCall } : {}),
	};

	const response = await fetch("http://localhost:11434/api/chat", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(`Ollama stream error: ${response.statusText}`);
	}

	const reader = response.body?.getReader();
	if (!reader) throw new Error("Body reader missing.");

	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (!line.trim()) continue;
				try {
					const parsed = JSON.parse(line);

					// Intercept and bubble up requested tool calls
					if (
						parsed.message?.tool_calls &&
						parsed.message.tool_calls.length > 0
					) {
						if (onToolCalls) {
							onToolCalls(parsed.message.tool_calls);
						}
					}

					const content = parsed.message?.content || "";
					if (content) {
						yield content;
					}
				} catch (e) {
					// Keep parsing adjacent valid lines
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}
