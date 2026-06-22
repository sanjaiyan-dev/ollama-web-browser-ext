import { storage } from "#imports";
import { atomWithStorage } from "jotai/utils";

import {
	useOllamaEndPointRead,
	useOllamaEndPointState,
	useOllamaSelectedModelState,
	useOllamaSelectedModelRead,
	useOllamaQuickQuestionState,
	useOllamaQuickQuestionRead,
	ollamaQuickQuestionAtom,
} from "./useOllamaOptions";
import {
	ollamaEndPointAtom,
	ollamaSelectedModelAtom,
} from "./useOllamaOptions";

export {
	useOllamaEndPointRead,
	useOllamaEndPointState,
	useOllamaSelectedModelState,
	useOllamaSelectedModelRead,
	useOllamaQuickQuestionState,
	useOllamaQuickQuestionRead,
};

export { ollamaEndPointAtom, ollamaSelectedModelAtom, ollamaQuickQuestionAtom };

type ValidWxtKey =
	| `local:${string}`
	| `session:${string}`
	| `sync:${string}`
	| `managed:${string}`;

export function atomWxtStorage<T>(key: string, initialValue: T) {
	const getValidKey = (key: string): ValidWxtKey => {
		if (!/^(local|session|sync|managed):/.test(key)) {
			console.warn(
				`[WXT Storage Adapter] Key "${key}" is missing a storage area prefix. Defaulting to "local:${key}".`,
			);
			return `local:${key}` as ValidWxtKey;
		}
		return key as ValidWxtKey;
	};

	const validKey = getValidKey(key);

	const customStorage = {
		getItem: async (key: string, initialValue: T): Promise<T> => {
			return await storage.getItem<T>(key as ValidWxtKey, {
				fallback: initialValue,
			});
		},
		setItem: async (key: string, newValue: T): Promise<void> => {
			await storage.setItem<T>(key as ValidWxtKey, newValue);
		},
		removeItem: async (key: string): Promise<void> => {
			await storage.removeItem(key as ValidWxtKey);
		},

		subscribe: (key: string, callback: (value: T) => void, initialValue: T) => {
			return storage.watch<T>(key as ValidWxtKey, (newValue) => {
				callback(newValue ?? initialValue);
			});
		},
	};

	return atomWithStorage<T>(validKey, initialValue, customStorage, {
		getOnInit: true,
	});
}
