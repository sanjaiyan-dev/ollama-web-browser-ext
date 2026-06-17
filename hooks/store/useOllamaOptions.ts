import { useAtom, useAtomValue } from "jotai";
import { atomWxtStorage } from ".";

export const ollamaEndPointAtom = atomWxtStorage(
	"local:ollamaEndPointAtom",
	"http://localhost:11434",
);
export const useOllamaEndPointRead = () => {
	return useAtomValue(ollamaEndPointAtom) || "http://localhost:11434";
};
export const useOllamaEndPointState = () => {
	return useAtom(ollamaEndPointAtom);
};

export const ollamaSelectedModelAtom = atomWxtStorage<string | null>(
	"local:ollamaSelectedModelAtom",
	null,
);
export const ollamaSelectedModelState = () => {
	return useAtom(ollamaSelectedModelAtom);
};
export const ollamaSelectedModelRead = () => {
	return useAtomValue(ollamaSelectedModelAtom);
};
