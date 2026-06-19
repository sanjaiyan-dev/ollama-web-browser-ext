import {
	useState,
	useEffect,
	useRef,
	useDeferredValue,
	useMemo,
	startTransition,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	X,
	Sparkles,
	Copy,
	Check,
	RefreshCw,
	AlertCircle,
	ChevronDown,
} from "lucide-react";
import { useBrowserCurrentActiveTab } from "@/hooks/query";
import { useOllamaListModels } from "@/hooks/query/useOllamaModels";
import { useActiveTab } from "@/hooks/utils";

import { useOllamaSelectedModelState } from "@/hooks/store";
import { OllamaModel } from "../routes/ModelLists";
import { useOllamaQuickAnswer } from "@/hooks/query/useOllamaQuickAnswer";

interface PopoverProps {
	isOpen: boolean;
	onClose: () => void;
	query: string;
}

function parseInline(raw: string) {
	const boldTokens = raw.split(/(\*\*.*?\*\*)/g);
	return boldTokens.map((segment, i) => {
		if (segment.startsWith("**") && segment.endsWith("**")) {
			return (
				<strong key={i} className="font-extrabold text-[#00E0FF]">
					{segment.slice(2, -2)}
				</strong>
			);
		}
		const codeTokens = segment.split(/(`.*?`)/g);
		return codeTokens.map((sub, j) => {
			if (sub.startsWith("`") && sub.endsWith("`")) {
				return (
					<code
						key={j}
						className="px-1.5 py-0.5 rounded bg-white/10 text-[#FF2E63] font-mono text-[11px]"
					>
						{sub.slice(1, -1)}
					</code>
				);
			}
			return sub;
		});
	});
}

export default function OllamaQuickQuestionPopover({
	isOpen,
	onClose,
	query,
}: PopoverProps) {
	"use memo";
	const activeTab = useActiveTab();

	// Active tab page context with destructuring for refetch and fetching state
	const {
		data: pageContext,
		refetch: refetchPageContext,
		isFetching: isFetchingPageContext,
	} = useBrowserCurrentActiveTab();

	// Model selection states
	const { data } = useOllamaListModels();

	const localModels = (data?.data?.models as OllamaModel[]) || [];

	const [selectedModel, setSelectedModel] = useOllamaSelectedModelState();

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	// Dynamic user query tweak input tracking
	const [editedQuery, setEditedQuery] = useState(query);
	const [submittedQuery, setSubmittedQuery] = useState(query);
	const [copied, setCopied] = useState(false);

	// Surface border coordinate coordinates for modern glow mechanics
	const cardRef = useRef<HTMLDivElement>(null);
	const [freshCoord, setMouseCoords] = useState({ x: 0, y: 0 });
	const mouseCoords = useDeferredValue(freshCoord, { x: 0, y: 0 });

	useEffect(() => {
		if (query) {
			setEditedQuery(query);
			setSubmittedQuery(query);
		}
	}, [query]);

	// Execute custom inference query hook
	const {
		data: responseText,
		error,
		isPending,
		isFetching,
		refetch: triggerInference,
	} = useOllamaQuickAnswer({
		question: submittedQuery,
		trigger: isOpen && !!submittedQuery && !!selectedModel,
		thinking: false,
	});

	const isGenerating = isPending || isFetching;

	// Custom refresh trigger for page scrapers
	const handleRefreshPageContent = async () => {
		await refetchPageContext();
		triggerInference();
	};

	const handleQuerySubmit = () => {
		if (editedQuery.trim()) {
			setSubmittedQuery(editedQuery.trim());
		}
	};

	function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		if (!cardRef.current) return;
		const rect = cardRef.current.getBoundingClientRect();
		startTransition(() => {
			setMouseCoords({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
		});
	}

	const handleCopy = () => {
		if (!responseText) return;
		navigator.clipboard.writeText(responseText);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const parsedMarkup = useMemo(() => {
		if (!responseText) return null;
		const segments = responseText.split(/(```[\s\S]*?```)/g);

		return segments.map((chunk, idx) => {
			if (chunk.startsWith("```")) {
				const blockMatch = chunk.match(/```(\w*)\n([\s\S]*?)```/);
				const lang = blockMatch ? blockMatch[1] : "code";
				const body = blockMatch ? blockMatch[2] : chunk.slice(3, -3);

				return (
					<div
						key={idx}
						className="my-3 rounded-xl overflow-hidden border border-white/10 bg-black/50 font-mono text-xs"
					>
						<div className="flex justify-between items-center bg-white/5 px-3 py-1.5 border-b border-white/5">
							<span className="text-[10px] uppercase font-bold text-[#00E0FF] tracking-widest">
								{lang || "code"}
							</span>
							<button
								onClick={() => navigator.clipboard.writeText(body)}
								className="text-[#64748B] hover:text-white transition-colors"
							>
								<Copy className="w-3.5 h-3.5" />
							</button>
						</div>
						<pre className="p-3 overflow-x-auto text-[#94A3B8] leading-relaxed select-text">
							<code>{body.trim()}</code>
						</pre>
					</div>
				);
			}

			return (
				<div key={idx} className="space-y-2.5">
					{chunk.split("\n").map((line, lIdx) => {
						const trimmed = line.trim();
						if (!trimmed) return <div key={lIdx} className="h-2" />;

						if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
							return (
								<li
									key={lIdx}
									className="ml-4 list-disc text-sm text-[#F8FAFC] leading-relaxed select-text"
								>
									{parseInline(trimmed.substring(2))}
								</li>
							);
						}

						if (trimmed.startsWith("### ")) {
							return (
								<h4
									key={lIdx}
									className="text-sm font-bold text-white mt-4 mb-1"
								>
									{parseInline(trimmed.substring(4))}
								</h4>
							);
						}
						if (trimmed.startsWith("## ")) {
							return (
								<h3
									key={lIdx}
									className="text-base font-bold text-white mt-5 mb-2"
								>
									{parseInline(trimmed.substring(3))}
								</h3>
							);
						}
						if (trimmed.startsWith("# ")) {
							return (
								<h2
									key={lIdx}
									className="text-lg font-bold text-[#8B5CF6] mt-6 mb-3"
								>
									{parseInline(trimmed.substring(2))}
								</h2>
							);
						}

						return (
							<p
								key={lIdx}
								className="text-sm text-[#F8FAFC] leading-relaxed font-sans font-normal select-text"
							>
								{parseInline(trimmed)}
							</p>
						);
					})}
				</div>
			);
		});
	}, [responseText]);

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
					{/* Inject style layer inside document element safely */}
					<style
						dangerouslySetInnerHTML={{
							__html: `
            @keyframes appleIntelligenceSpin {
              0% { transform: rotate(0deg) scale(1); filter: hue-rotate(0deg); }
              50% { transform: rotate(180deg) scale(1.15); filter: hue-rotate(180deg); }
              100% { transform: rotate(360deg) scale(1); filter: hue-rotate(360deg); }
            }
            @keyframes applePulseBorder {
              0%, 100% { opacity: 0.55; }
              50% { opacity: 0.95; }
            }
          `,
						}}
					/>

					{/* Glass Overlay Dimmer */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-[#05050A]/70 backdrop-blur-md pointer-events-auto"
					/>

					{/* Wrapper housing the interactive card element */}
					<div className="relative pointer-events-auto w-full max-w-92 h-120">
						{/* Apple Intelligence Glowing Magic Border Mesh (Activates during load/generation) */}
						<AnimatePresence>
							{isGenerating && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									style={{
										animation: "applePulseBorder 3s ease-in-out infinite",
									}}
									className="absolute inset-[-4px] rounded-[28px] overflow-hidden p-[3px] pointer-events-none z-0"
								>
									<div
										style={{
											background:
												"conic-gradient(from 0deg, #8B5CF6 0%, #00E0FF 25%, #FF2E63 50%, #FF8A00 75%, #8B5CF6 100%)",
											filter: "blur(18px)",
											animation: "appleIntelligenceSpin 6s linear infinite",
										}}
										className="absolute inset-[-60%] w-[220%] h-[220%]"
									/>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Main Liquid Glass Popover Box */}
						<motion.div
							ref={cardRef}
							onMouseMove={handleMouseMove}
							initial={{ opacity: 0, scale: 0.95, y: 15 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							transition={{ type: "spring", stiffness: 220, damping: 20 }}
							style={{
								background: `radial-gradient(400px circle at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(255, 255, 255, 0.05), transparent 85%), rgba(18, 18, 24, 0.78)`,
								backdropFilter: "blur(24px)",
							}}
							className="relative w-full h-full rounded-3xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden p-5 z-10"
						>
							{/* Backlight meshes for base environment reflection */}
							<div
								style={{ animation: "floatMesh 12s infinite linear" }}
								className="absolute -top-1/4 -left-1/4 w-[75%] h-[75%] bg-[#00E0FF]/5 blur-[90px] rounded-full mix-blend-screen pointer-events-none"
							/>
							<div
								style={{ animation: "floatMesh 16s infinite linear reverse" }}
								className="absolute -bottom-1/4 -right-1/4 w-[75%] h-[75%] bg-[#8B5CF6]/5 blur-[90px] rounded-full mix-blend-screen pointer-events-none"
							/>

							{/* Header: Web Context with Refetch Content action */}
							<div className="relative flex items-center justify-between border-b border-white/10 pb-3.5 z-10">
								<div className="flex items-center gap-2.5 overflow-hidden">
									<div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/15 shadow-[0_4px_12px_rgba(255,255,255,0.05)] overflow-hidden shrink-0">
										<Sparkles className="w-4.5 h-4.5 text-[#00E0FF] animate-pulse" />
									</div>
									<div className="flex flex-col overflow-hidden text-left">
										<div className="flex items-center gap-1.5">
											<span className="text-[9px] uppercase tracking-widest font-bold text-[#00E0FF]/80">
												Active Tab Context
											</span>
											<button
												onClick={handleRefreshPageContent}
												disabled={isFetchingPageContext || isGenerating}
												className="text-[#64748B] hover:text-[#00E0FF] transition-colors disabled:opacity-40"
												title="Refetch web document context"
											>
												<RefreshCw
													className={`w-3 h-3 ${isFetchingPageContext ? "animate-spin" : ""}`}
												/>
											</button>
										</div>
										<h3 className="text-xs font-semibold text-[#F8FAFC] truncate leading-tight mt-0.5">
											{pageContext?.title ||
												activeTab?.url ||
												"Secure Web Document"}
										</h3>
									</div>
								</div>

								<button
									onClick={onClose}
									className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#64748B] hover:text-[#94A3B8] transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							{/* Scrollable Center Body Area */}
							<div className="flex-1 overflow-y-auto glass-scrollbar py-4 space-y-4 pr-0.5 z-10 text-left">
								{/* Editable Question Field */}
								<div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col gap-1 focus-within:border-white/15 transition-colors">
									<span className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">
										Your Question
									</span>
									<div className="flex items-end gap-2 mt-0.5">
										<textarea
											value={editedQuery}
											onChange={(e) => setEditedQuery(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault();
													handleQuerySubmit();
												}
											}}
											rows={2}
											className="bg-transparent text-xs text-[#F8FAFC] font-medium resize-none focus:outline-none placeholder:text-[#64748B] flex-1 leading-normal"
											placeholder="Tweak or enter your question here..."
										/>
										{editedQuery !== submittedQuery && (
											<button
												onClick={handleQuerySubmit}
												className="h-6 px-2.5 rounded-lg bg-[#00E0FF] hover:bg-[#00c2dd] text-[#05050A] font-bold text-[9px] uppercase tracking-wider transition-colors shrink-0"
											>
												Apply
											</button>
										)}
									</div>
								</div>

								{/* Response Visual Output */}
								<div className="space-y-2">
									<div className="flex items-center justify-between mb-1">
										<span className="text-[9px] text-[#8B5CF6] font-bold uppercase tracking-wider">
											Response Output
										</span>
										{isGenerating && (
											<span className="flex items-center gap-1.5 text-[10px] text-[#00E0FF] font-medium">
												<span className="w-1.5 h-1.5 rounded-full bg-[#00E0FF] animate-pulse" />
												Ollama generating...
											</span>
										)}
									</div>

									{error ? (
										<div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-xs">
											<AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
											<p>
												{(error as Error).message ||
													"An unexpected error occurred."}
											</p>
										</div>
									) : isGenerating ? (
										<div className="space-y-2 animate-pulse mt-2">
											<div className="h-3 w-4/5 bg-white/10 rounded" />
											<div className="h-3 w-11/12 bg-white/10 rounded" />
											<div className="h-3 w-2/3 bg-white/10 rounded" />
										</div>
									) : (
										<div className="text-[#F8FAFC] space-y-2">
											{parsedMarkup || (
												<p className="text-xs text-[#64748B] italic">
													Submit a question to execute analysis.
												</p>
											)}
										</div>
									)}
								</div>
							</div>

							{/* Footer Toolbar Navigation */}
							<div className="relative border-t border-white/10 pt-3.5 z-10 flex items-center justify-between gap-2">
								{/* Local Model dropdown controller */}
								<div className="relative">
									<button
										onClick={() => setIsDropdownOpen(!isDropdownOpen)}
										className="h-8 pl-3 pr-2 rounded-full bg-white/5 border border-white/10 text-xs text-[#94A3B8] hover:bg-white/10 flex items-center gap-1.5 transition-colors"
									>
										<span className="max-w-[80px] truncate uppercase tracking-wider font-semibold text-[10px] text-[#F8FAFC]">
											{selectedModel || "No local models"}
										</span>
										<ChevronDown className="w-3 h-3 text-[#64748B]" />
									</button>

									{isDropdownOpen && localModels?.length > 0 && (
										<>
											<div
												className="fixed inset-0 z-40"
												onClick={() => setIsDropdownOpen(false)}
											/>
											<div className="absolute bottom-10 left-0 w-36 bg-[#121218] border border-white/15 rounded-xl py-1 shadow-2xl z-50 max-h-32 overflow-y-auto glass-scrollbar">
												{localModels?.map?.((item) => (
													<button
														key={item.name}
														onClick={() => {
															setSelectedModel(item.name);
															setIsDropdownOpen(false);
														}}
														className={`w-full text-left px-3 py-1.5 text-xs font-semibold uppercase hover:bg-white/5 transition-colors ${
															selectedModel === item.name
																? "text-[#8B5CF6]"
																: "text-[#94A3B8]"
														}`}
													>
														{item.name}
													</button>
												))}
											</div>
										</>
									)}
								</div>

								{/* Copy & Refresh Operation Controls */}
								<div className="flex gap-2">
									<button
										onClick={handleCopy}
										disabled={!responseText}
										className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#64748B] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
										title="Copy response to clipboard"
									>
										{copied ? (
											<Check className="w-3.5 h-3.5 text-emerald-400" />
										) : (
											<Copy className="w-3.5 h-3.5" />
										)}
									</button>

									<button
										onClick={() => triggerInference()}
										disabled={isGenerating || !submittedQuery}
										className="h-8 px-3.5 rounded-full bg-[#8B5CF6] text-white font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 hover:bg-[#7c4fe3] disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]"
									>
										<RefreshCw
											className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`}
										/>
										Regen
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				</div>
			)}
		</AnimatePresence>
	);
}
