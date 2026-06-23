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
import React, { useDeferredValue, useMemo, useRef, useState } from "react";
import { LegendList } from "@legendapp/list/react";
import { useFuse } from "react-fusejs";
import "./styles/News.css";

interface MagneticWrapperProps {
	children: React.ReactNode;
	className?: string;
}

export function MagneticWrapper({
	children,
	className = "",
}: MagneticWrapperProps) {
	const ref = useRef<HTMLDivElement>(null);

	// Motion values tracking cursor offset
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	// Framer Motion Spring settings (Stiffness: 180, Damping: 12)
	const springConfig = { stiffness: 180, damping: 12 };
	const springX = useSpring(x, springConfig);
	const springY = useSpring(y, springConfig);

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!ref.current) return;
		const rect = ref.current.getBoundingClientRect();

		// Geometric Center of the trigger button
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		// Delta relative to cursor coordinates
		const deltaX = e.clientX - centerX;
		const deltaY = e.clientY - centerY;

		// Translation constancy limit: 35% of total distance
		x.set(deltaX * 0.35);
		y.set(deltaY * 0.35);
	};

	const handleMouseLeave = () => {
		// Return smoothly to origin coordinate
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
			<motion.div
				style={{ x: springX, y: springY }}
				whileTap={{ scale: 0.95 }} // Tactile immediate micro-interaction
			>
				{children}
			</motion.div>
		</div>
	);
}

// Apple Intelligence Active Glow Border Component
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
			className={`relative rounded-full p-[1px] transition-all duration-300 ${className}`}
		>
			{/* Siri / Apple Intelligence Liquid Spectrum Ring (Cyan, Purple, Pink) */}
			<AnimatePresence>
				{isActive && (
					<>
						{/* Outer Soft Ambient Blur */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.65 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 -z-10 rounded-full bg-[conic-gradient(from_0deg,#00E0FF_0%,#8B5CF6_35%,#FF2E63_70%,#00E0FF_100%)] blur-sm"
							style={{ animation: "rotate-glow 5s linear infinite" }}
						/>
						{/* Crisp Inner High-contrast Stroke */}
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

const NewsCard = ({
	item,
	isExpanded,
	onToggleExpand,
}: {
	item: NewsItem;
	isExpanded: boolean;
	onToggleExpand: () => void;
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
			{/* Meta details */}
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

			{/* Article Header Content */}
			<h2 className="text-[13px] font-semibold text-slate-100 group-hover:text-white transition-colors leading-snug">
				{item.title}
			</h2>

			{/* Micro-Interaction / Detail Reveal */}
			<div className="flex items-center justify-between mt-3.5 pt-2 border-t border-white/[0.04]">
				<a
					href={item.link}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
				>
					<span>Read Original</span>
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

				{item.descHTML && (
					<button
						onClick={onToggleExpand}
						className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
					>
						<span>{isExpanded ? "Hide Preview" : "View Preview"}</span>
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

			{/* HTML Description Drawer */}
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

export default function NewsDashboard() {
	const queryResults = useNewsInternationalFeeds();

	// UI states
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
	const [activeSource, setActiveSource] = useState<
		"all" | "Google News" | "Yahoo News" | "BBC News"
	>("all");
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

	// Extract individual queries
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

	// 3. Apply Fuzzy searching using the useFuse hook
	const { results: freshFeed } = useFuse({
		items: filteredAndSortedBase,
		searchQuery: searchTerm,
		keys: ["title", "source"],
		deferSearchQuery: true,
		matchAllOnEmptyQuery: true,
		threshold: 0.3,
	});

	const finalFeed = useDeferredValue(freshFeed);

	// Loading and error states safely managed across multi-queries
	const isLoading =
		googleQuery.isFetching || yahooQuery.isFetching || bbcQuery.isFetching;
	const isInitialLoading =
		googleQuery.isLoading && yahooQuery.isLoading && bbcQuery.isLoading;
	const isError = googleQuery.isError && yahooQuery.isError && bbcQuery.isError;

	return (
		<div className="relative mx-auto flex flex-col overflow-hidden border border-white/10 bg-[#05050A] text-[#F8FAFC] shadow-2xl font-sans">
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

			<header className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-5 py-4 backdrop-blur-md z-10">
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

				{/* Refetch Node built using Magnetic Spring Physics */}
				<MagneticWrapper>
					<button
						onClick={handleRefetchAll}
						disabled={isLoading}
						className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-[#F8FAFC] backdrop-blur-md transition-all hover:bg-white/[0.1] hover:border-white/30 disabled:opacity-50"
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
				{/* Search Input enclosed inside an Apple Intelligence Animated Glow */}
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
							className="w-full bg-transparent text-[13px] text-white outline-none placeholder-slate-400 font-mono placeholder:font-mono"
						/>
						{searchTerm && (
							<button
								onClick={() => setSearchTerm("")}
								className="text-slate-400 hover:text-white"
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

				{/* Filters and Sorting Sub-Bar */}
				<div className="flex items-center justify-between text-xs text-slate-400">
					{/* Source Tabs */}
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

					{/* Sort Order Action Switch */}
					<button
						onClick={() =>
							setSortBy((prev) => (prev === "newest" ? "oldest" : "newest"))
						}
						className="flex items-center gap-1 rounded-lg border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white px-2 py-1 transition-all"
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

			<div
				className="flex-1 min-h-0 relative px-4 py-1"
				style={{ height: "calc(600px - 210px)", minHeight: 0 }}
			>
				<AnimatePresence mode="popLayout">
					{/* Initial Loading Skeletons */}
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

					{/* Unified Error Container */}
					{isError && !isInitialLoading && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-center text-slate-300 mt-2"
						>
							<svg
								className="mx-auto h-8 w-8 text-rose-400/80 mb-2"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<p className="text-sm font-semibold text-rose-200">
								Unable to load feeds
							</p>
							<p className="text-xs text-slate-400 mt-1">
								Please verify internet connectivity and retry.
							</p>
							<button
								onClick={handleRefetchAll}
								className="mt-3 inline-flex items-center rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/[0.12]"
							>
								Retry Stream
							</button>
						</motion.div>
					)}

					{/* Empty Search Results State */}
					{!isInitialLoading && finalFeed?.length === 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center py-10 text-slate-400"
						>
							<svg
								className="mx-auto h-10 w-10 text-slate-500 mb-2"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
								/>
							</svg>
							<p className="text-sm font-semibold">No results match filters</p>
							<p className="text-xs text-slate-500 mt-1">
								Refine your search input or source switches.
							</p>
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
								return (
									<NewsCard
										item={item}
										isExpanded={expandedItemId === item.id}
										onToggleExpand={() =>
											setExpandedItemId(
												expandedItemId === item.id ? null : item.id,
											)
										}
									/>
								);
							}}
						/>
					)}
				</AnimatePresence>
			</div>

			{/* 5. Apple Liquid Floating Bottom Action Bar (Simulating the 80px bottom nav offset) */}
			<div className="fixed bottom-4 left-4 right-4 h-12 z-10">
				<div className="flex h-full items-center justify-between rounded-full border border-white/15 bg-white/[0.05] px-4 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
					<div className="flex items-center gap-2">
						<span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-400 ring-4 ring-orange-500/25 animate-pulse" />
						<span className="text-[11px] font-semibold text-slate-300">
							Ollama Feed Agent: <span className="text-white">Active</span>
						</span>
					</div>

					<span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">
						{finalFeed?.length} Stream items
					</span>
				</div>
			</div>
		</div>
	);
}
