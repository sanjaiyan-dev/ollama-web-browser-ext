import { useState, useRef, useEffect, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOllamaStream } from "./helper";
import * as browserTools from "@/entrypoints/sidepanel/routes/agent/tools/basicTools";
import { toolsSchema } from "@/entrypoints/sidepanel/routes/agent/functions";
import { useOllamaSelectedModelRead } from "@/hooks/store";
import { useBrowserCurrentActiveTab } from "../useBrowserActiveTab";
import { OLLAMA_BROWSER_EXT_REACTQUERY_KEY } from "..";

export interface Message {
	id: string;
	role: "user" | "assistant" | "tool" | "system";
	content: string;
	thinking?: boolean;
	toolsUsed?: string;
}

interface OllamaApiMessage {
	role: "user" | "assistant" | "tool" | "system";
	content: string;
	tool_calls?: any[];
}

type BrowserToolFn = (...args: any[]) => Promise<any>;

function generateTimestampId(prefix = "msg"): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${crypto?.randomUUID?.()}`;
}

function generateToolResponseId(toolName: string): string {
	return `tool-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${toolName}-${crypto?.randomUUID?.()}`;
}

/**
 * Registry of available browser tools for fast lookups.
 */
const TOOL_REGISTRY: Record<string, BrowserToolFn> = {
	getActiveTabInfo: browserTools.getActiveTabInfo,
	createNewTab: browserTools.createNewTab,
	browser_navigate: browserTools.browser_navigate,
	click_interactive_element: browserTools.click_interactive_element,
	get_highlighted_text: browserTools.get_highlighted_text,
	web_search: browserTools.web_search,
	read_readable_content: browserTools.read_readable_content,
	export_session_auth: browserTools.export_session_auth,
	organize_tabs: browserTools.organize_tabs,
	get_system_metrics: browserTools.get_system_metrics,
	create_monitoring_alarm: browserTools.create_monitoring_alarm,
	get_user_profile: browserTools.get_user_profile,
	fill_form_fields: browserTools.fill_form_fields,
};

/**
 * Execute extension APIs on the client locally based on LLM parameters
 */
async function runLocalTool(name: string, args: unknown): Promise<string> {
	try {
		const tool = TOOL_REGISTRY[name];
		if (!tool) {
			return JSON.stringify({
				success: false,
				error: `The tool function "${name}" is not supported or defined on this client.`,
			});
		}

		const result =
			args !== undefined && args !== null ? await tool(args) : await tool();
		return typeof result === "string" ? result : JSON.stringify(result);
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		return JSON.stringify({ error: errorMessage });
	}
}

const queryKey = [OLLAMA_BROWSER_EXT_REACTQUERY_KEY, "ollama-ai-chat"] as const;

export function useOllamaChatStream({ isToolMode }: { isToolMode: boolean }) {
	const queryClient = useQueryClient();
	const model = useOllamaSelectedModelRead();
	const [activeTool, setActiveTool] = useState<string | null>(null);

	// React 19 Transition automatically tracks stream pending state
	const [isStreaming, startTransition] = useTransition();

	const lastSentUrlRef = useRef<string | null>(null);

	// Guard updates on unmounted or abandoned components
	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Reactive global query cache observer
	const { data: history = [] } = useQuery<Message[]>({
		queryKey: queryKey,
		initialData: [],
		queryFn: () => [],
		staleTime: Infinity,
		gcTime: Infinity,
	});

	useEffect(() => {
		if (history.length === 0) {
			lastSentUrlRef.current = null;
		}
	}, [history.length]);

	/**
	 * Recursive agent loop supporting multi-turn tools reasoning chains
	 */
	const executeAgentTurn = async (
		currentMessages: Message[],
	): Promise<void> => {
		if (!isMountedRef.current) return;

		// Resolved via top-level helper
		const assistantMessageId = generateTimestampId();

		// Add stream placeholder message
		queryClient.setQueryData<Message[]>(queryKey, (old) => [
			...(old || []),
			{
				id: assistantMessageId,
				role: "assistant",
				content: "",
				thinking: true,
			},
		]);

		let accumulatedText = "";
		const detectedToolCalls: any[] = [];

		try {
			const apiMessages: OllamaApiMessage[] = currentMessages.map((m) => {
				const apiMsg: OllamaApiMessage = { role: m.role, content: m.content };
				if (m.toolsUsed && m.role === "assistant") {
					try {
						apiMsg.tool_calls = JSON.parse(m.toolsUsed);
					} catch (e) {
						console.error("Failed to parse tool call payload", e);
					}
				}
				return apiMsg;
			});

			const stream = fetchOllamaStream(
				apiMessages,
				model ?? "gemma:latest",
				isToolMode,
				toolsSchema,
				(toolCalls: any[]) => {
					detectedToolCalls.push(...toolCalls);
				},
			);

			// Manual consumption of async iterator to bypass React Compiler HIR lowerStatement limits
			const iterator = stream[Symbol.asyncIterator]();
			while (true) {
				const { value: chunk, done } = await iterator.next();
				if (done) break;

				if (!isMountedRef.current) return;
				accumulatedText += chunk;

				// O(1) performance optimization targetting the last element of the list
				queryClient.setQueryData<Message[]>(queryKey, (old) => {
					if (!old || old.length === 0) return [];

					const lastIdx = old.length - 1;
					if (old[lastIdx].id === assistantMessageId) {
						const updated = [...old];
						updated[lastIdx] = {
							...updated[lastIdx],
							content: accumulatedText,
							thinking: accumulatedText.length < 15,
						};
						return updated;
					}

					return old.map((msg) =>
						msg.id === assistantMessageId
							? {
									...msg,
									content: accumulatedText,
									thinking: accumulatedText.length < 15,
								}
							: msg,
					);
				});
			}

			// If the model invoked an action turn
			if (detectedToolCalls.length > 0) {
				if (!isMountedRef.current) return;

				queryClient.setQueryData<Message[]>(queryKey, (old) => {
					if (!old || old.length === 0) return [];
					const lastIdx = old.length - 1;
					const payload = {
						content: accumulatedText || "Executing browser tools...",
						thinking: false,
						toolsUsed: JSON.stringify(detectedToolCalls),
					};

					if (old[lastIdx].id === assistantMessageId) {
						const updated = [...old];
						updated[lastIdx] = { ...updated[lastIdx], ...payload };
						return updated;
					}
					return old.map((msg) =>
						msg.id === assistantMessageId ? { ...msg, ...payload } : msg,
					);
				});

				// Clone list to respect React cache immutability
				const nextHistory = [
					...(queryClient.getQueryData<Message[]>(queryKey) || []),
				];

				// Sequence and resolve actions sequentially
				for (const toolCall of detectedToolCalls) {
					if (!isMountedRef.current) return;

					const toolName = toolCall.function.name;
					const toolArgs = toolCall.function.arguments;

					setActiveTool(toolName);

					const toolResult = await runLocalTool(toolName, toolArgs);

					const toolResponseMsg: Message = {
						// Resolved via top-level helper
						id: generateToolResponseId(toolName),
						role: "tool",
						content: toolResult,
						toolsUsed: toolName,
					};

					nextHistory.push(toolResponseMsg);
					queryClient.setQueryData<Message[]>(queryKey, () => [...nextHistory]);
				}

				setActiveTool(null);

				// Recursively start next assistant turn
				await executeAgentTurn(nextHistory);
			} else {
				// Turn complete
				if (!isMountedRef.current) return;

				queryClient.setQueryData<Message[]>(queryKey, (old) => {
					if (!old || old.length === 0) return [];
					const lastIdx = old.length - 1;
					if (old[lastIdx].id === assistantMessageId) {
						const updated = [...old];
						updated[lastIdx] = { ...updated[lastIdx], thinking: false };
						return updated;
					}
					return old.map((msg) =>
						msg.id === assistantMessageId ? { ...msg, thinking: false } : msg,
					);
				});
			}
		} catch (error: unknown) {
			console.error("Agent Turn Failure:", error);
			if (!isMountedRef.current) return;

			const errorString =
				error instanceof Error ? error.message : String(error);
			queryClient.setQueryData<Message[]>(queryKey, (old) => {
				if (!old || old.length === 0) return [];
				const lastIdx = old.length - 1;
				const errorMessage = `Error during system execution: ${errorString}`;
				if (old[lastIdx].id === assistantMessageId) {
					const updated = [...old];
					updated[lastIdx] = {
						...updated[lastIdx],
						content: errorMessage,
						thinking: false,
					};
					return updated;
				}
				return old.map((msg) =>
					msg.id === assistantMessageId
						? {
								...msg,
								content: errorMessage,
								thinking: false,
							}
						: msg,
				);
			});
		}
	};
	const { data: currentPageCtx } = useBrowserCurrentActiveTab();
	const sendMessage = async (
		text: string,
		pageContext?: { url: string; title: string; enabled: boolean },
	): Promise<void> => {
		return new Promise<void>((resolve) => {
			startTransition(async () => {
				const newMessages: Message[] = [];

				if (pageContext?.enabled && pageContext?.url) {
					if (lastSentUrlRef.current !== pageContext.url) {
						try {
							const pageContent = currentPageCtx?.text;
							lastSentUrlRef.current = pageContext.url;

							const systemMsg: Message = {
								id: `system-${generateTimestampId()}`,
								role: "system",
								content:
									`[System Instruction: You are analyzing the active browser page. Use this background information to guide your replies.\nURL: ${pageContext.url}\nTitle: ${pageContext.title}\nContent:\n${pageContent}]`.trim(),
							};
							newMessages.push(systemMsg);
						} catch (err) {
							console.error("Failed to append webpage context:", err);
						}
					}
				}

				const userMsg: Message = {
					id: generateTimestampId(),
					role: "user",
					content: text,
				};
				newMessages.push(userMsg);

				const updatedHistory = [...history, ...newMessages];
				queryClient.setQueryData<Message[]>(queryKey, () => updatedHistory);

				await executeAgentTurn(updatedHistory);
				startTransition(() => {
					resolve();
				});
			});
		});
	};

	return {
		messages: history,
		sendMessage,
		isStreaming,
		activeTool,
	};
}
