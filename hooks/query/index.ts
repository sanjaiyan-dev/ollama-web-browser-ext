import { useBrowserCurrentActiveTab } from "./useBrowserActiveTab";
import { useSystemUsage } from "./useCpuUsage";
import { useOllamaListModels } from "./useOllamaModels";
import { browser } from "#imports";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export { useOllamaListModels, useSystemUsage, useBrowserCurrentActiveTab };
export const OLLAMA_BROWSER_EXT_REACTQUERY_KEY =
	"OLLAMA_BROWSER_EXT_REACTQUERY_KEY";

export const chromeStorageAdapter = {
	getItem: async (key: string) => {
		const result = await browser.storage.local.get(key);
		return result[key] ?? null;
	},
	setItem: async (key: string, value: string) => {
		await browser.storage.local.set({ [key]: value });
	},
	removeItem: async (key: string) => {
		await browser.storage.local.remove(key);
	},
};

export const persister = createAsyncStoragePersister({
	storage: chromeStorageAdapter,

	key: "OLLAMA_BROWSER_CACHE",

	throttleTime: 3012,
});
