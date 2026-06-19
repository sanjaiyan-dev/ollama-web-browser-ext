import { useState, useEffect, useRef, startTransition, lazy } from "react";
import {
	motion,
	AnimatePresence,
	useMotionValue,
	useSpring,
} from "framer-motion";
import {
	MessageCircle,
	Cpu,
	Sparkles,
	ArrowUp,
	X,
	BrainCircuit,
	Newspaper,
} from "lucide-react";
import "./Navigation.css";
import { Link } from "react-router";

import { useOllamaQuickQuestionState } from "@/hooks/store";

const OllamaQuickQuestionPopover = lazy(() => import("./QuickQuestionPopOver"));

interface MagneticButtonProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
}

function MagneticButton({
	children,
	className = "",
	onClick,
}: MagneticButtonProps) {
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const mouseX = useSpring(x, { stiffness: 180, damping: 12 });
	const mouseY = useSpring(y, { stiffness: 180, damping: 12 });

	function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
		const rect = e.currentTarget.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		x.set((e.clientX - centerX) * 0.35);
		y.set((e.clientY - centerY) * 0.35);
	}

	function handleMouseLeave() {
		x.set(0);
		y.set(0);
	}

	return (
		<motion.button
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			style={{ x: mouseX, y: mouseY }}
			onClick={onClick}
			className={`${className} outline-none cursor-pointer`}
			whileTap={{ scale: 0.92 }}
		>
			{children}
		</motion.button>
	);
}

const navItems = [
	{
		id: "chat",
		icon: MessageCircle,
		color: "#00E0FF",
		glow: "rgba(0, 224, 255, 0.4)",
		to: "/",
	},
	{
		id: "models",
		icon: BrainCircuit,
		color: "#8B5CF6",
		glow: "rgba(139, 92, 246, 0.4)",
		to: "/models-lists",
	},
	{
		id: "sys-usage",
		icon: Cpu,
		color: "#FF2E63",
		glow: "rgba(255, 46, 99, 0.4)",
		to: "sys-usage",
	},
	{
		id: "google",
		icon: Newspaper,
		color: "#FBBC05",
		glow: "rgba(251, 188, 5, 0.4)",
		to: "google",
	},
] as const;

export function BottomNav() {
	const [activeTab, setActiveTab] =
		useState<(typeof navItems)[number]["id"]>("chat");
	const [isExpanded, setIsExpanded] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const [inputValue, setInputValue] = useOllamaQuickQuestionState();

	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const currentTab = navItems.find((t) => t.id === activeTab);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsExpanded(false);
				setIsFocused(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (isExpanded) {
			const timer = setTimeout(() => {
				inputRef.current?.focus();
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [isExpanded]);

	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [popoverQuery, setPopoverQuery] = useState("");

	const handleSendQuery = () => {
		if (!inputValue.trim()) return;
		startTransition(() => {
			setPopoverQuery(inputValue.trim());
		});
		setIsPopoverOpen(true);
		setIsFocused(false);
	};

	return (
		<div
			className={`bg-[#05050A] flex items-center justify-center relative overflow-hidden font-sans`}
		>
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c16_1px,transparent_1px),linear-gradient(to_bottom,#0c0c16_1px,transparent_1px)] bg-size-[40px_40px] opacity-40" />
			<div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-87.5 h-37.5 bg-[#8B5CF6]/15 blur-[100px] rounded-full mix-blend-screen" />
			<div className="absolute bottom-20 left-1/3 w-50 h-25 bg-[#00E0FF]/10 blur-[80px] rounded-full mix-blend-screen" />

			<motion.div
				transition={{
					type: "spring",
					stiffness: 220,
					damping: 24,
				}}
				className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-full  ${isExpanded ? "max-w-115" : "max-w-30"} px-4 z-50 flex justify-center`}
			>
				<motion.div
					ref={containerRef}
					layout
					transition={{
						type: "spring",
						stiffness: 220,
						damping: 24,
					}}
					style={{
						width: isExpanded ? "100%" : "76px",
						height: "76px",
					}}
					className={`
						relative flex items-center 
						bg-[#121218]/70 backdrop-blur-3xl 
						border border-white/10 
						shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)]
						overflow-hidden
						transition-all duration-500
						${isExpanded ? "rounded-[2.5rem] p-3" : "rounded-full p-3 justify-center"}
						${isFocused ? "bg-[#0f0f14]/90 border-white/25 shadow-[0_24px_48px_rgba(139,92,246,0.15)]" : ""}
					`}
				>
					<div
						className="pointer-events-none absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/5 to-transparent z-10"
						style={{ animation: "shine 6s infinite linear" }}
					/>

					<AnimatePresence mode="wait">
						{!isExpanded ? (
							<motion.div
								key="fab-state"
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								transition={{ duration: 0.2 }}
								className="w-full h-full flex items-center justify-center"
							>
								<MagneticButton
									onClick={() => setIsExpanded(true)}
									className="relative flex items-center justify-center w-13 h-13 rounded-full shrink-0"
								>
									<div
										className="absolute inset-0 rounded-full"
										style={{
											background: "rgba(139, 92, 246, 0.12)",
											boxShadow:
												"inset 0 1px 1px rgba(255,255,255,0.08), 0 0 20px rgba(139, 92, 246, 0.3)",
										}}
									/>
									<Sparkles
										className="relative z-10 w-6 h-6 text-[#8B5CF6] animate-pulse"
										style={{
											filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))",
										}}
									/>
								</MagneticButton>
							</motion.div>
						) : (
							<motion.div
								key="expanded-state"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.25, delay: 0.1 }}
								className="flex items-center gap-2 w-full h-full"
							>
								<MagneticButton
									onClick={() => {
										setIsExpanded(false);
										setIsFocused(false);
									}}
									className="relative flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08]"
								>
									<X className="w-4 h-4 text-[#64748B] hover:text-[#94A3B8]" />
								</MagneticButton>

								<div className="flex items-center gap-1 shrink-0">
									{navItems.map((item) => {
										const isActive = activeTab === item.id;
										const Icon = item.icon;

										return (
											<Link key={item.id} to={item.to} prefetch="render">
												<MagneticButton
													key={item.id}
													onClick={() => setActiveTab(item.id)}
													className="relative flex items-center justify-center w-10 h-10 rounded-full shrink-0"
												>
													{isActive && (
														<motion.div
															layoutId="wowActiveIndicator"
															className="absolute inset-0 rounded-full border border-white/10"
															style={{
																background: "rgba(255, 255, 255, 0.08)",
																boxShadow: `inset 0 1px 1px rgba(255,255,255,0.1), 0 0 20px ${item.glow}`,
															}}
															transition={{
																type: "spring",
																bounce: 0.22,
																duration: 0.6,
															}}
														/>
													)}

													<Icon
														strokeWidth={isActive ? 2.5 : 1.5}
														className={`relative z-10 w-5 h-5 transition-all duration-300 
														${
															isActive
																? "scale-110"
																: "text-[#64748B] hover:text-[#94A3B8]"
														}`}
														style={{
															color: isActive ? item.color : undefined,
															filter: isActive
																? `drop-shadow(0 0 8px ${item.glow})`
																: undefined,
														}}
													/>

													{isActive && (
														<motion.div
															layoutId="activeTabDot"
															className="absolute bottom-0.5 w-1 h-1 rounded-full"
															style={{ backgroundColor: item.color }}
															transition={{
																type: "spring",
																bounce: 0.2,
																duration: 0.6,
															}}
														/>
													)}
												</MagneticButton>
											</Link>
										);
									})}
								</div>

								<div className="w-px h-6 bg-white/10 shrink-0 mx-0.5 rounded-full" />

								<motion.div
									layout
									className={`
										relative flex items-center flex-1 h-13 rounded-full overflow-hidden shrink-0 group
										${isFocused ? "bg-black/50" : "bg-black/30 border border-white/5"}
										transition-colors duration-300
									`}
								>
									{isFocused && (
										<div
											className="absolute inset-0 -z-10 rounded-full p-px"
											style={{
												background:
													"linear-gradient(90deg, #00E0FF, #8B5CF6, #FF2E63, #00E0FF)",
												backgroundSize: "200% auto",
												animation: "borderFlow 3s linear infinite",
												WebkitMask:
													"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
												WebkitMaskComposite: "xor",
												maskComposite: "exclude",
											}}
										/>
									)}

									<motion.div
										className="absolute left-3.5 z-10 cursor-pointer"
										whileHover={{ rotate: 90, scale: 1.1 }}
										transition={{ type: "spring", stiffness: 200, damping: 10 }}
									>
										<Sparkles
											className={`w-4 h-4 transition-colors duration-300 ${isFocused ? "text-[#8B5CF6]" : "text-[#64748B]"}`}
										/>
									</motion.div>

									<input
										required
										ref={inputRef}
										type="text"
										value={inputValue}
										onChange={(e) => setInputValue(e.target.value)}
										onFocus={() => setIsFocused(true)}
										onBlur={() => setIsFocused(false)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleSendQuery();
											}
										}}
										placeholder="Ask Ollama..."
										className="w-full h-full bg-transparent text-[#F8FAFC] text-sm font-medium tracking-wide pl-10 pr-12 focus:outline-none placeholder:text-[#64748B] rounded-full"
									/>

									<AnimatePresence>
										{(isFocused || inputValue) && (
											<motion.button
												initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
												animate={{ opacity: 1, scale: 1, rotate: 0 }}
												exit={{ opacity: 0, scale: 0.6, rotate: 90 }}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={handleSendQuery}
												className="absolute right-1.5 w-9 h-9 flex items-center justify-center rounded-full overflow-hidden shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
											>
												<div
													className="absolute inset-0 transition-colors duration-500"
													style={{ backgroundColor: currentTab?.color }}
												/>
												<div className="absolute inset-px bg-[#14141A]/40 rounded-full z-10 border border-white/20" />
												<ArrowUp
													strokeWidth={2.5}
													className="w-4 h-4 text-white z-20"
												/>
											</motion.button>
										)}
									</AnimatePresence>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</motion.div>
			<OllamaQuickQuestionPopover
				isOpen={isPopoverOpen}
				onClose={() => setIsPopoverOpen(false)}
				query={popoverQuery}
			/>
		</div>
	);
}
