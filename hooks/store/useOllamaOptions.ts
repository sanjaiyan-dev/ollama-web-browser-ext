import { atom, useAtomValue } from "jotai";

export const ollamaEndPointAtom = atom("http://localhost:11434");
export const useOllamaEndPointRead = () => {
	return useAtomValue(ollamaEndPointAtom) || "http://localhost:11434";
};
