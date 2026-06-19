import { useMutation } from "@tanstack/react-query";
import { OLLAMA_BROWSER_EXT_REACTQUERY_KEY } from "../query";

const useOllamaQuickAnswer = () => {
	return useMutation({
		mutationKey: [OLLAMA_BROWSER_EXT_REACTQUERY_KEY, "useOllamaQuickAnswer"],
	});
};
