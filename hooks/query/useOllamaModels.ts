import { useQuery } from "@tanstack/react-query";
import { OLLAMA_BROWSER_EXT_REACTQUERY_KEY } from ".";
import { useOllamaEndPointRead } from "../store";
import axios from "axios";

const useOllamaListModels = () => {
	const ollamaEndPoint = useOllamaEndPointRead();
	return useQuery({
		queryKey: [
			OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
			"useOllamaListModels",
			ollamaEndPoint,
		],
		queryFn: async ({ signal }) => {
			return axios.get(`${ollamaEndPoint}/api/tags`, { signal });
		},
		staleTime: Infinity,
		gcTime: 21 * 60 * 1000,
	});
};

export { useOllamaListModels };
