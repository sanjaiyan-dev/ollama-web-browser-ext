import { atom, useAtom, useAtomValue } from "jotai";

export const ollamaEndPointAtom = atom("http://localhost:11434");
export const useOllamaEndPointRead = () => {
	return useAtomValue(ollamaEndPointAtom) || "http://localhost:11434";
};
export const useOllamaEndPointState = () => {
	return useAtom(ollamaEndPointAtom);
};

export const ollamaSelectedModelAtom = atom<string | null>(null);
export const ollamaSelectedModelState = () => {
	return useAtom(ollamaSelectedModelAtom);
};
export const ollamaSelectedModelRead = () => {
	return useAtomValue(ollamaSelectedModelAtom);
};
