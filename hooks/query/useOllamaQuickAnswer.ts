import { experimental_streamedQuery, useQuery } from "@tanstack/react-query";
import {
	OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
	useBrowserCurrentActiveTab,
} from "../query";
import { useOllamaSelectedModelRead, useOllamaEndPointRead } from "../store";
import { useDeferredValue } from "react";
import { useActiveTab } from "../utils";

interface StreamFuncParams {
	ollamaEndpoint: string;
	ollamaModelName: string;
	thinking?: boolean;
	fullPrompt: string;
	systemInstruction: string;
	signal: AbortSignal;
}

async function* streamAIResponse({
	fullPrompt,
	signal,
	ollamaEndpoint,
	ollamaModelName,
	systemInstruction,
	thinking,
}: StreamFuncParams) {
	const response = await fetch(`${ollamaEndpoint}/api/generate`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: ollamaModelName || "gemma4:latest",
			stream: true,
			think: thinking,
			prompt: fullPrompt,
			system: systemInstruction,
		}),
		signal,
	});

	if (!response.ok) {
		throw new Error(`Ollama request failed: ${response.statusText}`);
	}

	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error("No readable stream body found on response.");
	}

	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();

			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");

			// Save the trailing incomplete line back to the buffer
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.trim()) {
					try {
						const data = JSON.parse(line);
						yield data;
					} catch (e) {
						console.warn("Invalid JSON chunk:", line);
					}
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}

export const useOllamaQuickAnswer = ({
	question,
	thinking = false,
	trigger,
}: {
	question: string;
	thinking?: boolean;
	trigger: boolean;
}) => {
	const ollamaEndPoint = useOllamaEndPointRead();
	const ollamaModelName = useOllamaSelectedModelRead();

	const activeTab = useActiveTab();
	const currentTabURL = activeTab?.url;
	const { data: pageContext } = useBrowserCurrentActiveTab();

	const deferredQuestion = useDeferredValue(question?.trim());

	const docTitle = pageContext?.title || activeTab?.url || "Unknown Page";
	const docText = pageContext?.text || "";

	const truncatedText = docText.substring(0, 4512);
	const fullPrompt = `
<ROLE>
Advanced Technical Browser Assistant. 
Output: DIRECT MARKDOWN ONLY. 
Constraints: No preamble, no conversational filler, no "Based on the text."
</ROLE>

<CONTEXT>
TITLE: "${docTitle}"
URL: ${activeTab?.url || "N/A"}
CONTENT: 
"""
${truncatedText}
"""
</CONTEXT>

<QUERY>
${deferredQuestion}
</QUERY>

<INSTRUCTIONS>
1. Synthesize a premium technical response using the CONTEXT.
2. Structure with bullet points and nested lists.
3. Use Markdown code blocks for technical terms or snippets.
4. If information is missing, state "Data unavailable in current context."
5. OUTPUT ONLY THE RESPONSE.
</INSTRUCTIONS>
`.trim();

	const systemInstruction = `
You are an Advanced Technical Browser Assistant. Your purpose is to synthesize highly technical, accurate responses based strictly on the provided web context.

## Output Constraints:
- Output: DIRECT MARKDOWN ONLY.
- No preamble, no conversational filler, and no intros like "Based on the text provided..."

## Formatting Rules:
1. Structure your answers with bullet points and nested lists.
2. Use Markdown inline code blocks (\`\`) for technical terms, parameters, or short code snippets.
3. Use Markdown multi-line code blocks (\`\`\`lang) for larger blocks of code.
4. OUTPUT ONLY THE FINAL RESPONSE.
`.trim();

	return useQuery({
		queryKey: [
			OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
			"useOllamaQuickAnswer",
			ollamaEndPoint,
			deferredQuestion,
			ollamaModelName,
			currentTabURL,
		] as const,
		queryFn: experimental_streamedQuery({
			streamFn: async ({ signal }) => {
				if (!deferredQuestion.trim())
					throw new Error("Empty question string provided.");
				if (!ollamaModelName) throw new Error("No model selected.");

				return streamAIResponse({
					fullPrompt,
					signal,
					systemInstruction,
					thinking,
					ollamaEndpoint: ollamaEndPoint,
					ollamaModelName,
				});
			},
			reducer: (acc: string, chunk: any) => acc + (chunk?.response || ""),
			initialValue: "",
		}),
		enabled:
			!!deferredQuestion && !!ollamaModelName && trigger && !!ollamaEndPoint,
		staleTime: 1000 * 60 * 21,
		gcTime: 1000 * 60 * 30,
		retry: 1,
	});
};
