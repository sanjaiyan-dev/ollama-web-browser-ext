import { useQuery } from "@tanstack/react-query";
import {
	OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
	useBrowserCurrentActiveTab,
} from "../query";
import { useOllamaSelectedModelRead, useOllamaEndPointRead } from "../store";
import { useDeferredValue } from "react";
import axios from "axios";
import { useLocation } from "react-router";
import { useActiveTab } from "../utils";

export const useOllamaQuickAnswer = ({
	question,
	thinking = false,
	trigger,
}: {
	question: string;
	thinking: boolean;
	trigger: boolean;
}) => {
	const ollamaEndPoint = useOllamaEndPointRead();
	const ollamaModelName = useOllamaSelectedModelRead();

	const { pathname } = useLocation();
	const activeTab = useActiveTab();
	const currentTabURL = activeTab?.url;
	const { data: pageContext } = useBrowserCurrentActiveTab();

	const deferredQuestion = useDeferredValue(question?.trim());

	const docTitle = pageContext?.title || activeTab?.url || "Unknown Page";
	const docText = pageContext?.text || "";

	const truncatedText = docText.substring(0, 4500);
	const fullPrompt = `
<ROLE>
Advanced Technical Browser Assistant. 
Output: DIRECT MARKDOWN ONLY. 
Constraints: No preamble, no conversational filler, no "Based on the text."
</ROLE>

<CONTEXT>
TITLE: "${docTitle}"
URL: ${activeTab?.url || "N/A"}
CONTENT: "${docText}"
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
	return useQuery({
		queryKey: [
			OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
			"useOllamaQuickAnswer",
			ollamaEndPoint,
			deferredQuestion,
			ollamaModelName,
			currentTabURL,
			pathname,
		] as const,
		queryFn: async ({ signal }) => {
			if (!deferredQuestion.trim())
				throw new Error("Empty question string provided.");
			if (!ollamaModelName) throw new Error("No model selected.");
			try {
				const response = await axios.post(
					`${ollamaEndPoint}/api/generate`,
					{
						model: ollamaModelName || "gemma4:latest",
						stream: false,
						think: thinking,
						prompt: fullPrompt,
					},
					{
						headers: {
							"Content-Type": "application/json",
						},
						signal,
					},
				);

				return response.data.response as string;
			} catch (error: any) {
				if (axios.isAxiosError(error)) {
					const status = error.response?.status;
					const statusText = error.response?.statusText || error.message;
					throw new Error(
						`HTTP Error ${status || "Connection"}: ${statusText}`,
					);
				}
				throw error;
			}
		},
		enabled:
			!!deferredQuestion && !!ollamaModelName && trigger && !!ollamaEndPoint,
		staleTime: 1000 * 60 * 21,
		gcTime: 1000 * 60 * 30,
		retry: 1,
	});
};
