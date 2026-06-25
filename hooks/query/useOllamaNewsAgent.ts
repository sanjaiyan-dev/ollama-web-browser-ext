import { useState, useRef, useEffect, useDeferredValue } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOllamaEndPointRead, useOllamaSelectedModelRead } from "../store";
import { OLLAMA_BROWSER_EXT_REACTQUERY_KEY, persister } from ".";

interface OllamaGeneratePayload {
	prompt: string;
	system?: string;

	onChunk?: (chunk: string, accumulatedText: string) => void;

	bypassCache?: boolean;
}

const CACHE_DURATION_MS = 7 * 60 * 60 * 1000;

export function useOllamaNewsAgent() {
	const ollamaEndPoint = useOllamaEndPointRead();
	const queryClient = useQueryClient();
	const [streamedFreshText, setStreamedText] = useState<string>("");
	const abortControllerRef = useRef<AbortController | null>(null);

	const ollamaLLMModel = useOllamaSelectedModelRead();

	// Ensure active streams are canceled if the component unmounts
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	useEffect(() => {
		queryClient.setQueryDefaults(
			[OLLAMA_BROWSER_EXT_REACTQUERY_KEY, "useOllamaNewsAgent"],
			{
				gcTime: CACHE_DURATION_MS,

				staleTime: CACHE_DURATION_MS,
			},
		);
	}, [queryClient]);

	const mutation = useMutation<string, Error, OllamaGeneratePayload>({
		mutationKey: [
			OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
			"useOllamaNewsAgent-bulk",
			ollamaEndPoint,
		],
		mutationFn: async ({ prompt, system, onChunk, bypassCache = false }) => {
			setStreamedText("");

			const cacheKey = [
				OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
				"useOllamaNewsAgent",
				ollamaEndPoint,
				system || "",
				prompt,
			] as const;

			if (!bypassCache) {
				// Checks both in-memory cache and automatically pulls from browser.storage.local
				const cachedResponse = queryClient.getQueryData<string>(cacheKey);
				if (cachedResponse) {
					setStreamedText(cachedResponse);
					if (onChunk) {
						onChunk(cachedResponse, cachedResponse);
					}
					return cachedResponse;
				}
			}

			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			const controller = new AbortController();
			abortControllerRef.current = controller;

			const endpoint = `${ollamaEndPoint}/api/generate`;

			let response: Response;
			try {
				response = await fetch(endpoint, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					signal: controller.signal,
					body: JSON.stringify({
						model: ollamaLLMModel ?? "gemma4:latest",
						prompt: prompt,
						system: system,
						stream: true,
					}),
				});
			} catch (err: any) {
				abortControllerRef.current = null;
				if (err.name === "AbortError") {
					return Promise.reject(new Error("Generation was stopped."));
				}
				return Promise.reject(
					new Error(
						"Cannot reach Ollama. Verify Ollama is running locally and CORS is enabled via `OLLAMA_ORIGINS=*`.",
					),
				);
			}

			if (!response.ok) {
				abortControllerRef.current = null;
				const errorText = await response.text();
				return Promise.reject(
					new Error(
						`Ollama error (${response.status}): ${errorText || response.statusText}`,
					),
				);
			}

			if (!response.body) {
				abortControllerRef.current = null;
				return Promise.reject(
					new Error(
						"The response body is empty and cannot be read as a stream.",
					),
				);
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder("utf-8");
			let accumulatedText = "";
			let buffer = "";

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					// Decode the incoming chunk and append it to our local line buffer
					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");

					// Keep the last partial/incomplete JSON segment in the buffer
					buffer = lines.pop() || "";

					for (const line of lines) {
						const trimmedLine = line.trim();
						if (!trimmedLine) continue;

						const parsed = JSON.parse(trimmedLine);
						if (typeof parsed.response === "string") {
							accumulatedText += parsed.response;
							setStreamedText(accumulatedText);
							if (onChunk) {
								onChunk(parsed.response, accumulatedText);
							}
						}
					}
				}

				if (buffer.trim()) {
					try {
						const parsed = JSON.parse(buffer);
						if (typeof parsed.response === "string") {
							accumulatedText += parsed.response;
							setStreamedText(accumulatedText);
							if (onChunk) {
								onChunk(parsed.response, accumulatedText);
							}
						}
					} catch {}
				}

				queryClient.setQueryData(cacheKey, accumulatedText);

				reader.releaseLock();
				abortControllerRef.current = null;
				return accumulatedText;
			} catch (streamErr: any) {
				reader.releaseLock();
				abortControllerRef.current = null;

				if (streamErr.name === "AbortError") {
					return Promise.reject(new Error("Generation was stopped."));
				}
				return Promise.reject(
					new Error(
						streamErr.message && streamErr.message.includes("Ollama error")
							? streamErr.message
							: "An error occurred during streaming.",
					),
				);
			}
		},
	});

	const cancel = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
	};
	const streamedText = useDeferredValue(streamedFreshText);
	return {
		...mutation,
		streamedText,
		cancel,
		isStreaming: !!mutation.isPending && !mutation.isError,
	};
}
