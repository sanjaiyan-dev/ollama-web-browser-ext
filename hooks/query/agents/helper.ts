import { toolsSchema } from "@/entrypoints/sidepanel/routes/agent/functions";
import { experimental_streamedQuery } from "@tanstack/react-query";

export async function* fetchOllamaStream(
	messages: { role: string; content: string }[],
	model: string,
	isToolMode: boolean,
	signal: AbortSignal,
): AsyncIterable<string> {
	"use memo";
	const payload = {
		model,
		messages,
		stream: true,
		...(isToolMode ? { tools: toolsSchema, think: true } : { think: true }),
	};

	const response = await fetch("http://localhost:11434/api/chat", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
		signal,
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
