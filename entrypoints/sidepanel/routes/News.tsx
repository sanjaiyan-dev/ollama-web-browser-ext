import {
	useNewsInternationalFeeds,
	type NewsItem,
} from "@/hooks/query/useNewsInformations";
import {
	AnimatePresence,
	motion,
	useMotionValue,
	useSpring,
} from "framer-motion";
import React, {
	useDeferredValue,
	useMemo,
	useRef,
	useState,
	useEffect,
	startTransition,
} from "react";
import { LegendList } from "@legendapp/list/react";
import { useFuse } from "react-fusejs";
import "./styles/News.css";
import { Summary } from "lucide-react";
import { useOllamaSelectedModelRead } from "@/hooks/store";
import ReactMarkdown from "react-markdown";
import { useOllamaNewsAgent } from "@/hooks/query/useOllamaNewsAgent";

// --- CUSTOM OLLAMA REACT-QUERY HOOK ---
export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

interface OllamaGeneratePayload {
	prompt: string;
	system?: string;
}

interface TypewriterOptions {
	speedMs?: number;
}

export function useSmoothTypewriter(
	targetText: string,
	options: TypewriterOptions = {},
) {
	const { speedMs = 15 } = options;
	const [displayedText, setDisplayedText] = useState("");
	const indexRef = useRef(0);
	const requestRef = useRef<number | null>(null);
	const lastUpdateTimeRef = useRef(0);

	useEffect(() => {
		if (!targetText) {
			setDisplayedText("");
			indexRef.current = 0;
			lastUpdateTimeRef.current = 0;
			if (requestRef.current) {
				cancelAnimationFrame(requestRef.current);
				requestRef.current = null;
			}
		}
	}, [targetText]);

	useEffect(() => {
		if (!targetText) return;

		const animate = (timestamp: number) => {
			if (!lastUpdateTimeRef.current) {
				lastUpdateTimeRef.current = timestamp;
			}

			const elapsed = timestamp - lastUpdateTimeRef.current;

			if (elapsed >= speedMs) {
				const remainingChars = targetText.length - indexRef.current;

				if (remainingChars > 0) {
					const step = Math.max(
						1,
						Math.min(remainingChars, Math.ceil(remainingChars / 12)),
					);
					indexRef.current += step;
					startTransition(() => {
						setDisplayedText(targetText.slice(0, indexRef.current));
					});
					lastUpdateTimeRef.current = timestamp;
				}
			}

			if (indexRef.current < targetText.length) {
				requestRef.current = requestAnimationFrame(animate);
			} else {
				requestRef.current = null;
			}
		};

		if (indexRef.current < targetText.length && !requestRef.current) {
			requestRef.current = requestAnimationFrame(animate);
		}

		return () => {
			if (requestRef.current) {
				cancelAnimationFrame(requestRef.current);
				requestRef.current = null;
			}
		};
	}, [targetText, speedMs]);

	return displayedText;
}

// --- MAGNETIC PHYSICS WRAPPER ---
interface MagneticWrapperProps {
	children: React.ReactNode;
	className?: string;
}

export function MagneticWrapper({
	children,
	className = "",
}: MagneticWrapperProps) {
	const ref = useRef<HTMLDivElement>(null);

	const x = useMotionValue(0);
	const y = useMotionValue(0);

	const springConfig = { stiffness: 180, damping: 12 };
	const springX = useSpring(x, springConfig);
	const springY = useSpring(y, springConfig);

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		const deltaX = e.clientX - centerX;
		const deltaY = e.clientY - centerY;

		x.set(deltaX * 0.35);
		y.set(deltaY * 0.35);
	};

	const handleMouseLeave = () => {
		x.set(0);
		y.set(0);
	};

	return (
		<div
			ref={ref}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			className={`relative cursor-pointer select-none ${className}`}
		>
			<motion.div style={{ x: springX, y: springY }} whileTap={{ scale: 0.95 }}>
				{children}
			</motion.div>
		</div>
	);
}

// --- APPLE / SIRI INTELLIGENCE GLOW BORDER ---
interface AppleGlowBorderProps {
	children: React.ReactNode;
	isActive: boolean;
	className?: string;
}

export function AppleGlowBorder({
	children,
	isActive,
	className = "",
}: AppleGlowBorderProps) {
	return (
		<div
			className={`relative rounded-full p-px transition-all duration-300 ${className}`}
		>
			<AnimatePresence>
				{isActive && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.65 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 -z-10 rounded-full bg-[conic-gradient(from_0deg,#00E0FF_0%,#8B5CF6_35%,#FF2E63_70%,#00E0FF_100%)] blur-sm"
							style={{ animation: "rotate-glow 5s linear infinite" }}
						/>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 -z-10 rounded-full bg-[conic-gradient(from_0deg,#00E0FF_0%,#8B5CF6_35%,#FF2E63_70%,#00E0FF_100%)]"
							style={{ animation: "rotate-glow 4s linear infinite" }}
						/>
					</>
				)}
			</AnimatePresence>
			<div className="relative w-full rounded-full bg-[#101015]/90 backdrop-blur-xl">
				{children}
			</div>
		</div>
	);
}

// --- NEWS CARD COMPONENT ---
const NewsCard = ({
	item,
	isExpanded,
	onToggleExpand,
	onAnalyze,
}: {
	item: NewsItem;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onAnalyze: () => void;
}) => {
	const itemDate = new Date(item.pubDate);
	const formattedDate = itemDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	const sourceColorClass =
		item.source === "Google News"
			? "bg-[#00E0FF]/10 text-[#00E0FF] border-[#00E0FF]/20"
			: item.source === "Yahoo News"
				? "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20"
				: "bg-[#FF2E63]/10 text-[#FF2E63] border-[#FF2E63]/20";

	return (
		<motion.article
			layout="position"
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/6 hover:shadow-[0_8px_32px_rgba(139,92,246,0.06)]"
		>
			<div className="flex items-center justify-between mb-2">
				<span
					className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase ${sourceColorClass}`}
				>
					{item.source}
				</span>
				<span className="text-[10px] text-slate-400 font-mono">
					{formattedDate}
				</span>
			</div>

			<h2 className="text-[13px] font-semibold text-slate-100 group-hover:text-white transition-colors leading-snug">
				{item.title}
			</h2>

			<div className="flex items-center justify-between mt-3.5 pt-2 border-t border-white/[0.04]">
				<div className="flex items-center gap-3">
					<a
						href={item.link}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
					>
						<span>Read</span>
						<svg
							className="h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
					</a>

					<button
						onClick={onAnalyze}
						className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8B5CF6] hover:text-[#a78bfa] transition-colors cursor-pointer underline decoration-dotted"
					>
						<span className="relative flex h-1.5 w-1.5 mr-0.5">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#8B5CF6]"></span>
						</span>
						<span>Analyze</span>
					</button>
				</div>

				{item.descHTML && (
					<button
						onClick={onToggleExpand}
						className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
					>
						<span>{isExpanded ? "Hide" : "Preview"}</span>
						<motion.svg
							animate={{ rotate: isExpanded ? 180 : 0 }}
							className="h-3.5 w-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M19 9l-7 7-7-7"
							/>
						</motion.svg>
					</button>
				)}
			</div>

			{item.descHTML && (
				<motion.div
					initial={false}
					animate={{
						height: isExpanded ? "auto" : 0,
						opacity: isExpanded ? 1 : 0,
					}}
					transition={{ duration: 0.25, ease: "easeInOut" }}
					className="overflow-hidden"
				>
					<div
						className="mt-3 border-t border-white/5 pt-3 text-xs text-slate-300 leading-relaxed font-sans select-text desc-html-container"
						dangerouslySetInnerHTML={{ __html: item.descHTML }}
					/>
				</motion.div>
			)}
		</motion.article>
	);
};

// --- CHAT SHEET / BOTTOM DRAWER FOR SINGLE OR BULK SUMMARIES ---
interface OllamaChatDrawerProps {
	newsItems: NewsItem[]; // Can be single item or whole feed
	mode: "single" | "bulk";
	onClose: () => void;
}

function OllamaChatDrawer({ newsItems, mode, onClose }: OllamaChatDrawerProps) {
	const {
		mutate: askOllama,
		isPending,
		isStreaming,
		streamedText,
	} = useOllamaNewsAgent();
	const [freshMsg, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [apiError, setApiError] = useState<string | null>(null);
	const threadEndRef = useRef<HTMLDivElement>(null);
	const messages = useDeferredValue(freshMsg);

	const animatedStreamedText = useSmoothTypewriter(streamedText, {
		speedMs: 12,
	});

	const displayMessages = useMemo(() => {
		const isCurrentlyStreaming = isStreaming && streamedText;
		if (isCurrentlyStreaming) {
			return [
				...messages,
				{ role: "assistant" as const, content: animatedStreamedText || "..." },
			];
		}
		if (isPending && !streamedText) {
			return [...messages, { role: "assistant" as const, content: "..." }];
		}
		return messages;
	}, [messages, isStreaming, streamedText, animatedStreamedText, isPending]);

	useEffect(() => {
		if (newsItems.length > 0) {
			setMessages([]);
			setApiError(null);

			const systemPrompt =
				"You are a professional local news intelligence agent. Formulate dense, objective summaries.";
			let prompt = "";

			if (mode === "single" && newsItems.length === 1) {
				const item = newsItems[0];
				prompt =
					`Generate a concise 3-sentence summary of this news article. Use bullet points for key implications if relevant.
Title: ${item.title}
Source: ${item.source}
Context: ${item.descHTML || ""}`.trim();
			} else {
				// Bulk synthesis across the compiled feed (limiting to avoid token overload)
				const truncatedList = newsItems.slice(0, 6);
				const formattedArticles = truncatedList
					.map(
						(item, idx) =>
							`[Article #${idx + 1}] Source: ${item.source}\nTitle: ${item.title}\nContext: ${item.descHTML ? item.descHTML.replace(/<[^>]*>/g, "").substring(0, 200) : "No context"}`,
					)
					.join("\n\n");

				prompt =
					`You are analyzing a live stream of news updates. Synthesize the following news articles into a single, cohesive brief. 
Identify the top 3 overarching narratives or key trends in the news right now. Organize them using concise bullet points under thematic headers.

Articles to analyze:
${formattedArticles}`.trim();
			}

			askOllama(
				{ prompt, system: systemPrompt },
				{
					onSuccess: (summary) => {
						setMessages([{ role: "assistant", content: summary }]);
					},
					onError: (err) => {
						setApiError(err.message);
					},
				},
			);
		}
	}, [newsItems, mode, askOllama]);

	// Auto-scroll runs on computed text changes
	useEffect(() => {
		threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [displayMessages]);

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isPending) return;

		const userMsg: ChatMessage = { role: "user", content: input };
		const updatedHistory = [...messages, userMsg];
		setMessages(updatedHistory);
		setInput("");
		setApiError(null);

		const formattedHistory = updatedHistory
			.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
			.join("\n");

		// Provide full context based on mode for follow-up conversation flow
		const contextualScope =
			mode === "single"
				? `Article Context: ${newsItems[0]?.title} - ${newsItems[0]?.descHTML || ""}`
				: `Analyzed Stream Context: ${newsItems.map((item) => item.title).join(", ")}`;

		const chatPrompt = `Scope of conversation:
${contextualScope}

Conversation logs:
${formattedHistory}

Assistant: Respond to the last User query directly, incorporating intelligence context when useful.
Today's date and time is ${new Date().toString()}
`.trim();

		askOllama(
			{ prompt: chatPrompt },
			{
				onSuccess: (reply) => {
					setMessages((prev) => [
						...prev,
						{ role: "assistant", content: reply },
					]);
				},
				onError: (err) => {
					setApiError(err.message);
				},
			},
		);
	};

	return (
		<motion.div
			initial={{ y: "100%" }}
			animate={{ y: 0 }}
			exit={{ y: "100%" }}
			transition={{ type: "spring", stiffness: 220, damping: 22 }}
			className="absolute bottom-0 left-0 right-0 h-[85%] z-40 flex flex-col rounded-t-3xl border-t border-white/15 bg-[#05050A]/95 backdrop-blur-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.8)] overflow-hidden m-3"
		>
			<div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
				<div className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-2/3 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent opacity-50" />
				<div className="absolute -top-12 left-1/3 h-32 w-32 rounded-full bg-[#8B5CF6]/10 blur-2xl" />
			</div>

			<header className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.01] px-5 py-3 shrink-0">
				<div className="flex-1 pr-4">
					<span className="font-mono text-[9px] uppercase tracking-widest text-[#94A3B8] font-bold block">
						{mode === "single"
							? "Single Update Briefing"
							: "Consolidated Stream Synthesis"}
					</span>
					<h3 className="text-xs font-semibold text-white truncate max-w-[280px]">
						{mode === "single"
							? newsItems[0]?.title
							: `Synthesizing ${newsItems.length} active stream items`}
					</h3>
				</div>

				<MagneticWrapper>
					<button
						onClick={onClose}
						className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</MagneticWrapper>
			</header>

			{isPending && (
				<div className="h-0.5 w-full bg-white/[0.02] relative overflow-hidden shrink-0">
					<motion.div
						initial={{ left: "-100%" }}
						animate={{ left: "100%" }}
						transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
						className="absolute h-full w-1/3 bg-gradient-to-r from-[#00E0FF] via-[#8B5CF6] to-[#FF2E63]"
					/>
				</div>
			)}

			<div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 glass-scrollbar">
				{displayMessages.length === 0 && !apiError && (
					<div className="h-full flex flex-col items-center justify-center text-center space-y-2">
						<span className="relative flex h-3 w-3">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E0FF] opacity-75"></span>
							<span className="relative inline-flex rounded-full h-3 w-3 bg-[#00E0FF]"></span>
						</span>
						<p className="text-xs font-mono text-slate-400">
							{mode === "single"
								? "Initiating single update summary..."
								: "Analyzing and compiling active news stream..."}
						</p>
					</div>
				)}

				{apiError && (
					<div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs text-rose-200">
						<p className="font-semibold mb-1">Local Model Error</p>
						<p className="text-slate-400 leading-normal">{apiError}</p>
					</div>
				)}

				<LegendList
					data={displayMessages}
					renderItem={({ item }) => {
						const msg = item;
						const isUser = msg.role === "user";
						return (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								className={`flex ${isUser ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border ${
										isUser
											? "bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-white"
											: "bg-white/3 border-white/8 text-slate-200"
									}`}
								>
									<ReactMarkdown>{msg.content}</ReactMarkdown>
								</div>
							</motion.div>
						);
					}}
					keyExtractor={(item, idx) => idx + item.role}
					maintainScrollAtEnd
					showsVerticalScrollIndicator={true}
					recycleItems
					className="h-full overflow-y-auto no-scrollbar"
					style={{ scrollbarWidth: "none" }}
					ItemSeparatorComponent={() => <div className="min-h-3 p-3" />}
					ListFooterComponent={<div className="h-7 w-full" />}
				/>

				<div ref={threadEndRef} />
			</div>

			<form
				onSubmit={handleSendMessage}
				className="p-4 border-t border-white/[0.08] bg-[#05050A] shrink-0"
			>
				<AppleGlowBorder isActive={input.length > 0}>
					<div className="flex h-10 w-full items-center px-3.5 gap-2.5">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={
								isPending ? "Generating..." : "Ask regarding updates..."
							}
							disabled={isPending}
							className="w-full bg-transparent text-[13px] text-white outline-none placeholder-slate-500 font-mono disabled:opacity-50"
						/>
						<MagneticWrapper>
							<button
								type="submit"
								disabled={!input.trim() || isPending}
								className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black hover:bg-slate-200 transition-colors disabled:opacity-30 cursor-pointer"
							>
								<svg
									className="h-3.5 w-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={3}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M14 5l7 7m0 0l-7 7m7-7H3"
									/>
								</svg>
							</button>
						</MagneticWrapper>
					</div>
				</AppleGlowBorder>
			</form>
		</motion.div>
	);
}

// --- NEWS DASHBOARD MAIN CONTAINER ---
export default function NewsDashboard() {
	const queryResults = useNewsInternationalFeeds();

	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
	const [activeSource, setActiveSource] = useState<
		"all" | "Google News" | "Yahoo News" | "BBC News"
	>("all");
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

	const [chatMode, setChatMode] = useState<"single" | "bulk">("single");
	const [activeChatItems, setActiveChatItems] = useState<NewsItem[]>([]);

	const [googleQuery, yahooQuery, bbcQuery] = queryResults;

	const handleRefetchAll = async () => {
		await Promise.all([
			googleQuery.refetch(),
			yahooQuery.refetch(),
			bbcQuery.refetch(),
		]);
	};

	const uniqueItems = useMemo(() => {
		const rawGoogle = (googleQuery.data || []).map((item) => ({
			...item,
			source: "Google News",
		}));

		const rawYahoo = (yahooQuery.data || []).map((item) => ({
			...item,
			source: "Yahoo News",
		}));

		const rawBbc = (bbcQuery.data || []).map((item) => ({
			...item,
			source: "BBC News",
		}));
		const unified = [...rawGoogle, ...rawYahoo, ...rawBbc];

		const uniqueMap = new Map<string, NewsItem>();
		unified.forEach((item) => {
			const key = item.id || item.link;
			if (!uniqueMap.has(key)) {
				uniqueMap.set(key, item);
			}
		});

		return Array.from(uniqueMap.values());
	}, [googleQuery.data, yahooQuery.data, bbcQuery.data]);

	const filteredAndSortedBase = useMemo(() => {
		let list = [...uniqueItems];

		if (activeSource !== "all") {
			list = list.filter((item) =>
				item.source
					.trim()
					.toLowerCase()
					.includes(activeSource.trim().toLowerCase()),
			);
		}

		list.sort((a, b) => {
			const dateA = new Date(a.pubDate).getTime();
			const dateB = new Date(b.pubDate).getTime();
			return sortBy === "newest" ? dateB - dateA : dateA - dateB;
		});

		return list;
	}, [uniqueItems, activeSource, sortBy]);

	const { results: freshFeed } = useFuse({
		items: filteredAndSortedBase,
		searchQuery: searchTerm,
		keys: ["title", "source"],
		deferSearchQuery: true,
		matchAllOnEmptyQuery: true,
		threshold: 0.3,
	});

	const finalFeed = useDeferredValue(freshFeed);

	const finalFeedItems = useMemo(() => {
		return (finalFeed || []).map((f) => f.item);
	}, [finalFeed]);

	const isLoading =
		googleQuery.isFetching || yahooQuery.isFetching || bbcQuery.isFetching;
	const isInitialLoading =
		googleQuery.isLoading && yahooQuery.isLoading && bbcQuery.isLoading;
	const isError = googleQuery.isError && yahooQuery.isError && bbcQuery.isError;

	const handleSummarizeEntireFeed = () => {
		if (finalFeedItems.length === 0) return;
		setChatMode("bulk");
		setActiveChatItems(finalFeedItems);
	};

	const handleSummarizeSingleCard = (item: NewsItem) => {
		setChatMode("single");
		setActiveChatItems([item]);
	};

	const ollamaLLMActive = useOllamaSelectedModelRead();

	return (
		<div className="relative mx-auto flex flex-col overflow-hidden border border-white/10 bg-[#05050A] text-[#F8FAFC] shadow-2xl font-sans h-150">
			{/* Ambient Aurora Meshes */}
			<div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
				<div
					className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-[#00E0FF]/15 blur-[75px]"
					style={{ animation: "pulse-mesh 12s ease-in-out infinite" }}
				/>
				<div
					className="absolute -right-10 top-37.5 h-48 w-48 rounded-full bg-[#8B5CF6]/15 blur-[80px]"
					style={{ animation: "float-mesh 10s ease-in-out infinite" }}
				/>
				<div
					className="absolute -bottom-10 -right-2.5 h-52 w-52 rounded-full bg-[#FF2E63]/10 blur-[90px]"
					style={{ animation: "pulse-mesh 15s ease-in-out infinite" }}
				/>
			</div>

			<header className="flex items-center justify-between border-b border-white/8 bg-white/2 px-5 py-4 backdrop-blur-md z-10">
				<div>
					<div className="flex items-center gap-1.5">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
						</span>
						<span className="font-mono text-[9px] uppercase tracking-widest text-[#94A3B8] font-bold">
							Ollama Agent UI
						</span>
					</div>
					<h1 className="text-lg font-bold tracking-tight text-white leading-tight font-jakarta mt-0.5">
						Intelligence Stream
					</h1>
				</div>

				<MagneticWrapper>
					<button
						onClick={handleRefetchAll}
						disabled={isLoading}
						className="flex h-9 w-9 hover:shadow-sm hover:shadow-amber-400 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-[#F8FAFC] backdrop-blur-md transition-all hover:bg-white/[0.1] hover:border-white/30 disabled:opacity-50 cursor-pointer"
						title="Refetch feeds"
					>
						<svg
							className={`h-4.5 w-4.5 text-slate-300 ${isLoading ? "animate-spin text-cyan-400" : ""}`}
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2}
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
							/>
						</svg>
					</button>
				</MagneticWrapper>
			</header>

			<div className="shrink-0 flex flex-col gap-3 p-4 border-b border-white/6 bg-[#05050A]/90 backdrop-blur-md sticky top-0 z-20">
				<AppleGlowBorder isActive={isSearchFocused}>
					<div className="flex h-10 w-full items-center px-3.5 gap-2.5">
						<svg
							className={`h-4 w-4 transition-colors duration-300 ${isSearchFocused ? "text-[#00E0FF]" : "text-slate-400"}`}
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<input
							type="text"
							inputMode="search"
							placeholder="Search intelligence updates..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onFocus={() => setIsSearchFocused(true)}
							onBlur={() => setIsSearchFocused(false)}
							className="w-full bg-transparent text-[13px] text-white outline-none placeholder-slate-400 font-mono"
						/>
						{searchTerm && (
							<button
								onClick={() => setSearchTerm("")}
								className="text-slate-400 hover:text-white cursor-pointer"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2.5}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						)}
					</div>
				</AppleGlowBorder>

				<div className="flex items-center justify-between text-xs text-slate-400">
					<div className="flex gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.05]">
						{(["all", "Google News", "Yahoo News", "BBC News"] as const).map(
							(source) => {
								const label = source === "all" ? "All" : source.split(" ")[0];
								const isSelected = activeSource === source;
								return (
									<button
										key={source}
										onClick={() => setActiveSource(source)}
										className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-200 cursor-pointer ${
											isSelected
												? "bg-white/[0.08] text-white shadow-sm border-white/[0.04] border"
												: "hover:text-slate-200 hover:bg-white/[0.02]"
										}`}
									>
										{label}
									</button>
								);
							},
						)}
					</div>

					<button
						onClick={() =>
							setSortBy((prev) => (prev === "newest" ? "oldest" : "newest"))
						}
						className="flex items-center gap-1 rounded-lg border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white px-2 py-1 transition-all cursor-pointer"
					>
						<span>{sortBy === "newest" ? "Newest" : "Oldest"}</span>
						<svg
							className="h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Main Stream Area */}
			<div
				className="flex-1 min-h-0 relative px-4 py-1"
				style={{ height: "calc(600px - 210px)", minHeight: 0 }}
			>
				<AnimatePresence mode="popLayout">
					{isInitialLoading && (
						<div className="space-y-3 mt-2">
							{[1, 2, 3].map((n) => (
								<div
									key={n}
									className="animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 h-24"
								>
									<div className="h-3 w-1/3 rounded bg-white/10 mb-3" />
									<div className="h-4 w-5/6 rounded bg-white/10 mb-2" />
									<div className="h-3 w-1/2 rounded bg-white/10" />
								</div>
							))}
						</div>
					)}

					{isError && !isInitialLoading && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-center text-slate-300 mt-2"
						>
							<p className="text-sm font-semibold text-rose-200">
								Unable to load feeds
							</p>
							<button
								onClick={handleRefetchAll}
								className="mt-3 inline-flex items-center rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/[0.12] cursor-pointer"
							>
								Retry Stream
							</button>
						</motion.div>
					)}

					{!isInitialLoading && finalFeed?.length === 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center py-10 text-slate-400"
						>
							<p className="text-sm font-semibold">No results match filters</p>
						</motion.div>
					)}

					{!isInitialLoading && finalFeed?.length > 0 && (
						<LegendList
							data={finalFeed}
							keyExtractor={({ item }) =>
								`${item.id ?? item.link}-${expandedItemId === (item.id ?? item.link) ? "expanded" : "collapsed"}`
							}
							style={{ height: "100%" }}
							extraData={expandedItemId}
							className="glass-scrollbar"
							contentContainerClassName="pb-[80px] pt-2"
							recycleItems={true}
							ItemSeparatorComponent={() => <div className="min-h-3 p-3" />}
							renderItem={({ item: news }) => {
								const item = news.item;
								const idKey = item.id || item.link;
								return (
									<NewsCard
										item={item}
										isExpanded={expandedItemId === idKey}
										onToggleExpand={() =>
											setExpandedItemId(expandedItemId === idKey ? null : idKey)
										}
										onAnalyze={() => handleSummarizeSingleCard(item)}
									/>
								);
							}}
						/>
					)}
				</AnimatePresence>
			</div>

			{/* Floating Bottom Nav Container with "Synthesize Stream" AI trigger */}
			<div className="fixed bottom-4 left-4 right-4 h-12 z-10">
				<div className="flex h-full items-center justify-between rounded-full border border-white/15 bg-white/[0.05] px-3.5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
					<div className="flex items-center gap-2">
						<span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-400 ring-4 ring-emerald-500/25 animate-pulse" />
						<span className="text-[11px] font-semibold text-slate-300">
							Ollama Feed Agent:{" "}
							<span className="text-white font-mono text-[10px] uppercase">
								{ollamaLLMActive}
							</span>
						</span>
					</div>

					{/* Siri/Glow styled feed synthesis trigger */}
					{finalFeedItems.length > 0 && (
						<button
							onClick={handleSummarizeEntireFeed}
							className="relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white bg-white/6 border border-white/10 hover:bg-white/12 duration-300 cursor-pointer overflow-hidden shadow-[0_0_12px_rgba(139,92,246,0.15)] hover:inset-shadow hover:shadow-amber-400 transition-all"
						>
							{/* Soft internal hover light glow */}
							<div className="absolute inset-0 bg-linear-to-r from-[#00E0FF]/10 via-[#8B5CF6]/10 to-[#FF2E63]/10 opacity-60 pointer-events-none" />
							<Summary size={14} color="#00E0FF" />
							<span>
								Summarize {finalFeedItems?.length} Stream
								{finalFeedItems?.length > 1 ? "s" : ""}
							</span>
						</button>
					)}
				</div>
			</div>

			{/* Translucent Backdrop Blur layer */}
			<AnimatePresence>
				{activeChatItems.length > 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setActiveChatItems([])}
						className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 pointer-events-auto"
					/>
				)}
			</AnimatePresence>

			{/* Unified Chat Drawer */}
			<AnimatePresence>
				{activeChatItems.length > 0 && (
					<OllamaChatDrawer
						newsItems={activeChatItems}
						mode={chatMode}
						onClose={() => setActiveChatItems([])}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
