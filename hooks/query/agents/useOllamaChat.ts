import { experimental_streamedQuery, useQuery } from "@tanstack/react-query";
import { fetchOllamaStream } from "./helper";
import { queryClient } from "@/entrypoints/sidepanel/main";
import { OLLAMA_BROWSER_EXT_REACTQUERY_KEY } from "..";
import { useOllamaSelectedModelRead } from "@/hooks/store";

export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	thinking?: boolean;
	toolsUsed?: string;
}

export function useOllamaChatStream({ isToolMode }: { isToolMode: boolean }) {
	const [activePromptContext, setActivePromptContext] = useState<
		Message[] | null
	>(null);
	const streamPromiseResolver = useRef<(() => void) | null>(null);
	const model = useOllamaSelectedModelRead();

	const history = queryClient.getQueryData<Message[]>(["chat-history"]);

	const currentStream = useQuery<string>({
		queryKey: [
			OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
			"useOllamaChatStream",
			activePromptContext,
			model,
			isToolMode,
		] as const,
		queryFn: experimental_streamedQuery({
			streamFn: (context) => {
				if (!activePromptContext) return (async function* () {})() as any;
				return fetchOllamaStream(
					activePromptContext.map((m) => ({
						role: m.role,
						content: m.content,
					})),
					model ?? "gemma:latest",
					isToolMode,
					context.signal,
				);
			},

			reducer: (acc: string, chunk: unknown) => acc + chunk,
			initialValue: "",
		}),
		enabled: !!activePromptContext,
	});

	useEffect(() => {
		if (
			activePromptContext &&
			!currentStream.isFetching &&
			currentStream.data
		) {
			const finalReply: Message = {
				id: Date.now().toString(),
				role: "assistant",
				content: currentStream.data,
				thinking: !isToolMode && currentStream.data.length < 50,
			};

			queryClient.setQueryData<Message[]>(["chat-history"], (old) => [
				...(old || []),
				finalReply,
			]);

			// Resolve the sendMessage Promise context
			if (streamPromiseResolver.current) {
				streamPromiseResolver.current();
				streamPromiseResolver.current = null;
			}

			// De-escalate active stream query
			setActivePromptContext(null);
		}
	}, [
		currentStream.isFetching,
		currentStream.data,
		activePromptContext,
		queryClient,
		isToolMode,
	]);

	const sendMessage = (text: string) => {
		return new Promise<void>((resolve) => {
			streamPromiseResolver.current = resolve;

			const newUserMessage: Message = {
				id: Date.now().toString(),
				role: "user",
				content: text,
			};

			const updatedHistory = [...(history ?? []), newUserMessage];
			queryClient.setQueryData<Message[]>(
				["chat-history"],
				() => updatedHistory,
			);
			setActivePromptContext(updatedHistory);
		});
	};

	const displayMessages: Message[] = [...(history ?? [])];
	if (currentStream.isFetching && currentStream.data) {
		displayMessages.push({
			id: "active-stream",
			role: "assistant",
			content: currentStream.data,
			thinking: currentStream.data.length < 15,
		});
	}

	return {
		messages: displayMessages,
		sendMessage,
	};
}
