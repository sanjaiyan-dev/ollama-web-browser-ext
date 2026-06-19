import { useOllamaListModels } from "@/hooks/query/useOllamaModels";
import {
	useOllamaSelectedModelState,
	useOllamaEndPointRead,
} from "@/hooks/store";
import { startTransition, useState } from "react";
import { useFuse } from "react-fusejs";
import { ErrorUI, LoadingUI } from "../layout/Status";

export interface OllamaModel {
	name: string;
	model: string;
	modified_at: string;
	size: number;
	digest: string;
	details: {
		parent_model: string;
		format: string;
		family: string;
		families: string[];
		parameter_size: string;
		quantization_level: string;
	};
	capabilities: string[];
}

export default function OllamaSidePanel() {
	const { data, isLoading, isError } = useOllamaListModels();
	const endpoint = useOllamaEndPointRead();

	const models = data?.data?.models as OllamaModel[];

	const [search, setSearch] = useState("");
	const [selectedModel, setSelectedModel] = useOllamaSelectedModelState();
	const [activeModel, setActiveModel] = useState<string>(
		selectedModel || models?.[0]?.name,
	);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const selectActiveModel = (modelName: string) => {
		setActiveModel(modelName);
		startTransition(() => {
			setSelectedModel(modelName);
		});
	};
	// Helper: Format bytes to Gigabytes
	const formatSize = (bytes: number) => {
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	};

	// Helper: Format ISO date to a friendly string
	const formatDate = (isoString: string) => {
		const date = new Date(isoString);
		return date.toLocaleDateString("en-GB", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const handleCopy = (name: string, index: number) => {
		navigator.clipboard.writeText(name);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 1500);
	};

	const { results: filteredModels, deferredSearchTerm } = useFuse({
		items: models || [],
		keys: ["name", "model"],
		searchQuery: search,
		threshold: 0.3,
		matchAllOnEmptyQuery: true,
	});

	if (isLoading) {
		return <LoadingUI footerTxt="Fetching Model Info..." />;
	}
	if (isError) {
		return (
			<ErrorUI
				copyTagTxt="terminal"
				copyButtonTxt="Copy Terminal Code"
				copyHeaderTxt="Terminal Code"
			/>
		);
	}

	return (
		<div className="w-full h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30 overflow-hidden">
			{/* Header section */}
			<header className="p-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
					<h1 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">
						Local Models
					</h1>
				</div>
				<span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
					{endpoint}
				</span>
			</header>

			{/* Search Input */}
			<div className="p-3 bg-zinc-950">
				<div className="relative">
					<input
						type="search"
						placeholder="Search models..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all"
					/>
					<svg
						className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
			</div>

			{/* Models List */}
			<div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
				{filteredModels.length === 0 ? (
					<div className="text-center py-8 text-zinc-500 text-xs">
						No matching models found named {deferredSearchTerm}.
					</div>
				) : (
					filteredModels.map((result, idx) => {
						const model = result.item;
						const isActive = activeModel === model.name;
						return (
							<div
								key={model.name}
								onClick={() => selectActiveModel(model.name)}
								className={`group relative rounded-xl p-3.5 border transition-all cursor-pointer ${
									isActive
										? "bg-zinc-900 border-violet-500/60 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.15)]"
										: "bg-zinc-900/40 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/60"
								}`}
							>
								{/* Active Indicator Bar */}
								{isActive && (
									<div className="absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r bg-violet-500" />
								)}

								{/* Card Title & Copy Button */}
								<div className="flex items-start justify-between gap-2 pl-1">
									<div className="flex flex-col min-w-0">
										<span className="text-sm font-medium text-zinc-100 truncate">
											{model.name}
										</span>
										<span className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
											{model.details.family} • {model.details.parameter_size}
										</span>
									</div>

									<button
										onClick={(e) => {
											e.stopPropagation();
											handleCopy(model.name, idx);
											selectActiveModel(model.name);
										}}
										className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
										title="Copy model name"
										type="button"
									>
										{copiedIndex === idx ? (
											<svg
												className="h-3.5 w-3.5 text-emerald-400"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2.5}
													d="M5 13l4 4L19 7"
												/>
											</svg>
										) : (
											<svg
												className="h-3.5 w-3.5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
												/>
											</svg>
										)}
									</button>
								</div>

								{/* Specifications details line */}
								<div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-zinc-900 pt-2.5 pl-1 text-[11px] text-zinc-400">
									<div className="flex flex-col">
										<span className="text-zinc-600 text-[9px] uppercase tracking-wider">
											Size
										</span>
										<span className="font-medium text-zinc-300">
											{formatSize(model.size)}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-zinc-600 text-[9px] uppercase tracking-wider">
											Quantization
										</span>
										<span className="font-mono text-zinc-300">
											{model.details.quantization_level}
										</span>
									</div>
								</div>

								{/* Capabilities Badges */}
								<div className="mt-3 flex flex-wrap gap-1.5 pl-1">
									{model.capabilities.map((cap) => {
										let capClass =
											"bg-zinc-800/50 text-zinc-400 border-zinc-800";
										if (cap === "thinking") {
											capClass =
												"bg-amber-500/10 text-amber-400 border-amber-500/20";
										} else if (cap === "tools") {
											capClass =
												"bg-blue-500/10 text-blue-400 border-blue-500/20";
										} else if (cap === "completion") {
											capClass =
												"bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
										}
										return (
											<span
												key={cap}
												className={`text-[9px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full border ${capClass}`}
											>
												{cap}
											</span>
										);
									})}
								</div>

								{/* Footer metadata */}
								<div className="mt-3 text-[9px] text-zinc-600 text-right pl-1">
									Modified: {formatDate(model.modified_at)}
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
