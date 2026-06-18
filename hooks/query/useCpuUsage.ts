import { useQuery } from "@tanstack/react-query";
import { OLLAMA_BROWSER_EXT_REACTQUERY_KEY } from ".";

interface CpuTime {
	idle: number;
	kernel: number;
	total: number;
	user: number;
}

interface ProcessorInfo {
	usage: CpuTime;
}

interface CpuInfo {
	archName: string;
	features: string[];
	modelName: string;
	numOfProcessors: number;
	processors: ProcessorInfo[];
	temperatures?: number[];
}

interface MemoryInfo {
	availableCapacity: number;
	capacity: number;
}

export const useSystemUsage = () => {
	return useQuery({
		queryKey: [OLLAMA_BROWSER_EXT_REACTQUERY_KEY, "useSystemUsage"] as const,
		queryFn: async () => {
			if (
				typeof browser === "undefined" ||
				!browser.system ||
				!browser.system.cpu ||
				!browser.system.memory
			) {
				throw new Error(
					"System API unavailable in current environment. Verify popup manifests are loaded.",
				);
			}

			const getCpuInfo = (): Promise<CpuInfo> =>
				new Promise((resolve) => browser.system.cpu.getInfo(resolve));
			const getMemoryInfo = (): Promise<MemoryInfo> =>
				new Promise((resolve) => browser.system.memory.getInfo(resolve));

			const [cpu, memory] = await Promise.all([getCpuInfo(), getMemoryInfo()]);
			return { cpu, memory, timestamp: Date.now() };
		},
		refetchInterval: 3012,
		retry: false,
		staleTime: Infinity,
	});
};
