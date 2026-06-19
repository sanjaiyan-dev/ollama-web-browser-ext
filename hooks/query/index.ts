import { useBrowserCurrentActiveTab } from "./useBrowserActiveTab";
import { useSystemUsage } from "./useCpuUsage";
import { useOllamaListModels } from "./useOllamaModels";

export { useOllamaListModels, useSystemUsage, useBrowserCurrentActiveTab };
export const OLLAMA_BROWSER_EXT_REACTQUERY_KEY =
	"OLLAMA_BROWSER_EXT_REACTQUERY_KEY";
