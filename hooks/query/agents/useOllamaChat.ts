import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOllamaStream } from "./helper";
import * as browserTools from "@/entrypoints/sidepanel/routes/agent/tools/basicTools"; // Local browser extension actions
import { toolsSchema } from "@/entrypoints/sidepanel/routes/agent/functions";
import { useOllamaSelectedModelRead } from "@/hooks/store";

export interface Message {
	id: string;
	role: "user" | "assistant" | "tool";
	content: string;
	thinking?: boolean;
	toolsUsed?: string;
}

/**
 * Execute extension APIs on the client locally based on LLM parameters
 */
async function runLocalTool(name: string, args: any): Promise<string> {
	try {
		let result;
		switch (name) {
			case "getActiveTabInfo":
				result = await browserTools.getActiveTabInfo();
				break;

			case "createNewTab":
				result = await browserTools.createNewTab(
					args as browserTools.ToolArguments["createNewTab"],
				);
				break;

			case "browser_navigate":
				result = await browserTools.browser_navigate(
					args as browserTools.ToolArguments["browser_navigate"],
				);
				break;

			case "click_interactive_element":
				result = await browserTools.click_interactive_element(
					args as browserTools.ToolArguments["click_interactive_element"],
				);
				break;

			case "get_highlighted_text":
				result = await browserTools.get_highlighted_text();
				break;

			case "web_search":
				result = await browserTools.web_search(
					args as browserTools.ToolArguments["web_search"],
				);
				break;

			case "read_readable_content":
				result = await browserTools.read_readable_content();
				break;

			case "export_session_auth":
				result = await browserTools.export_session_auth(
					args as browserTools.ToolArguments["export_session_auth"],
				);
				break;

			case "organize_tabs":
				result = await browserTools.organize_tabs(
					args as browserTools.ToolArguments["organize_tabs"],
				);
				break;

			case "get_system_metrics":
				result = await browserTools.get_system_metrics();
				break;

			case "create_monitoring_alarm":
				result = await browserTools.create_monitoring_alarm(
					args as browserTools.ToolArguments["create_monitoring_alarm"],
				);
				break;

			default:
				return JSON.stringify({
					success: false,
					error: `The tool function "${name}" is not supported or defined on this client.`,
				});
		}

		return typeof result === "string" ? result : JSON.stringify(result);
	} catch (err: any) {
		return JSON.stringify({ error: err?.message || String(err) });
	}
}

export function useOllamaChatStream({ isToolMode }: { isToolMode: boolean }) {
	const queryClient = useQueryClient();
	const model = useOllamaSelectedModelRead();
	const [activeTool, setActiveTool] = useState<string | null>(null);
	const [isStreaming, setIsStreaming] = useState(false);

	// Reactive global query cache observer
	const { data: history = [] } = useQuery<Message[]>({
		queryKey: ["chat-history"],
		initialData: [],
	});

	/**
	 * Recursive agent loop supporting multi-turn tools reasoning chains
	 */
	const executeAgentTurn = async (
		currentMessages: Message[],
	): Promise<void> => {
		const assistantMessageId = Date.now().toString();

		// Add stream placeholder message
		queryClient.setQueryData<Message[]>(["chat-history"], (old) => [
			...(old || []),
			{
				id: assistantMessageId,
				role: "assistant",
				content: "",
				thinking: true,
			},
		]);

		let accumulatedText = "";
		let detectedToolCalls: any[] = [];

		try {
			// Strip metadata properties to comply with Ollama standard role structures
			const apiMessages = currentMessages.map((m) => {
				const apiMsg: any = { role: m.role, content: m.content };
				if (m.toolsUsed && m.role === "assistant") {
					try {
						apiMsg.tool_calls = JSON.parse(m.toolsUsed);
					} catch {}
				}
				return apiMsg;
			});

			// Capture tool calls from the stream using the optional 5th parameter callback
			const stream = fetchOllamaStream(
				apiMessages,
				model ?? "gemma:latest",
				isToolMode,
				toolsSchema, // Custom schema list
				(toolCalls: any[]) => {
					detectedToolCalls.push(...toolCalls);
				},
			);

			for await (const chunk of stream) {
				accumulatedText += chunk;

				// Feed back standard output chunks into the UI immediately
				queryClient.setQueryData<Message[]>(["chat-history"], (old) => {
					return (old || []).map((msg) =>
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
				queryClient.setQueryData<Message[]>(["chat-history"], (old) => {
					return (old || []).map((msg) =>
						msg.id === assistantMessageId
							? {
									...msg,
									content: accumulatedText || "Executing browser tools...",
									thinking: false,
									toolsUsed: JSON.stringify(detectedToolCalls),
								}
							: msg,
					);
				});

				const nextHistory =
					queryClient.getQueryData<Message[]>(["chat-history"]) || [];

				// Sequence and resolve actions sequentially
				for (const toolCall of detectedToolCalls) {
					const toolName = toolCall.function.name;
					const toolArgs = toolCall.function.arguments;

					setActiveTool(toolName);

					const toolResult = await runLocalTool(toolName, toolArgs);

					const toolResponseMsg: Message = {
						id: `tool-${Date.now()}-${Math.random()}`,
						role: "tool",
						content: toolResult,
						toolsUsed: toolName,
					};

					nextHistory.push(toolResponseMsg);
					queryClient.setQueryData<Message[]>(["chat-history"], () => [
						...nextHistory,
					]);
				}

				setActiveTool(null);

				// Recursively start next assistant turn with populated parameters
				await executeAgentTurn(nextHistory);
			} else {
				// Turn complete
				queryClient.setQueryData<Message[]>(["chat-history"], (old) => {
					return (old || []).map((msg) =>
						msg.id === assistantMessageId ? { ...msg, thinking: false } : msg,
					);
				});
			}
		} catch (error: any) {
			console.error("Agent Turn Failure:", error);
			queryClient.setQueryData<Message[]>(["chat-history"], (old) => {
				return (old || []).map((msg) =>
					msg.id === assistantMessageId
						? {
								...msg,
								content: `Error during system execution: ${error?.message || error}`,
								thinking: false,
							}
						: msg,
				);
			});
		}
	};

	const sendMessage = async (text: string): Promise<void> => {
		setIsStreaming(true);

		const userMsg: Message = {
			id: Date.now().toString(),
			role: "user",
			content: text,
		};

		const updatedHistory = [...history, userMsg];
		queryClient.setQueryData<Message[]>(["chat-history"], () => updatedHistory);

		await executeAgentTurn(updatedHistory);
		setIsStreaming(false);
	};

	return {
		messages: history,
		sendMessage,
		isStreaming,
		activeTool,
	};
}
