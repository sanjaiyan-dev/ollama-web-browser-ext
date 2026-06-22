import { atom, useAtom, useAtomValue } from "jotai";
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
export const useOllamaSelectedModelState = () => {
	return useAtom(ollamaSelectedModelAtom);
};
export const useOllamaSelectedModelRead = () => {
	return useAtomValue(ollamaSelectedModelAtom);
};

export const ollamaQuickQuestionAtom = atom<string>("");
export const useOllamaQuickQuestionState = () => {
	return useAtom(ollamaQuickQuestionAtom);
};
export const useOllamaQuickQuestionRead = () => {
	return useAtomValue(ollamaQuickQuestionAtom);
};
