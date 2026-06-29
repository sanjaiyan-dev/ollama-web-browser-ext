import {
	useRef,
	useState,
	useActionState,
	startTransition,
	useDeferredValue,
	type ReactNode,
	type MouseEventHandler,
} from "react";
import { useFormStatus } from "react-dom";
import { motion, useSpring, AnimatePresence } from "framer-motion";
import { LegendList } from "@legendapp/list/react";
import {
	Sparkles,
	Wrench,
	Bot,
	Send,
	Loader2,
	Info,
	Brain,
	BrainCircuit,
	Globe,
} from "lucide-react";
import { useOllamaSelectedModelRead } from "@/hooks/store";
import "./styles/Chat.css";
import { useOllamaChatStream } from "@/hooks/query/agents/useOllamaChat";
import ReactMarkdown from "react-markdown";
import { useBrowserCurrentActiveTab } from "@/hooks/query/useBrowserActiveTab";

interface ChatMagneticBtnProps {
	children: ReactNode;
	onClick?: MouseEventHandler<HTMLButtonElement>;
	type?: "button" | "submit" | "reset";
	className: string;
	disabled: boolean;
}
const MagneticButton = ({
	children,
	onClick,
	type = "button",
	className = "",
	disabled = false,
}: ChatMagneticBtnProps) => {
	const ref = useRef<HTMLButtonElement>(null);

	const xSpring = useSpring(0, { stiffness: 180, damping: 12, mass: 0.5 });
	const ySpring = useSpring(0, { stiffness: 180, damping: 12, mass: 0.5 });

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!ref.current || disabled) return;
		const rect = ref.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		xSpring.set((e.clientX - centerX) * 0.35);
		ySpring.set((e.clientY - centerY) * 0.35);
	};

	const handleMouseLeave = () => {
		xSpring.set(0);
		ySpring.set(0);
	};

	return (
		<motion.button
			type={type}
			ref={ref}
			onClick={onClick}
			disabled={disabled}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			whileTap={!disabled ? { scale: 0.95 } : undefined}
			className={`relative rounded-full flex items-center justify-center transition-all ease-[cubic-bezier(0.23,1,0.32,1)] duration-300 ${className}`}
		>
			<motion.div
				style={{ x: xSpring, y: ySpring }}
				className="relative z-10 flex items-center justify-center"
			>
				{children}
			</motion.div>
		</motion.button>
	);
};

const AuroraButton = ({ children, pending }: any) => (
	<MagneticButton
		type="submit"
		disabled={pending}
		className="w-10 h-10 bg-white/5 border border-white/20 hover:bg-white/10 relative overflow-hidden group cursor-pointer"
	>
		<div className="absolute inset-0 bg-linear-to-tr from-[#00E0FF] via-[#8B5CF6] to-[#FF2E63] opacity-0 group-hover:opacity-50 blur-md transition-opacity duration-500" />
		<div className="relative z-10 text-white">
			{pending ? (
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
				>
					<Loader2 size={16} className="text-[#00E0FF]" />
				</motion.div>
			) : (
				children
			)}
		</div>
	</MagneticButton>
);

const FormSubmitButton = () => {
	const { pending } = useFormStatus();
	return (
		<AuroraButton
			pending={pending}
			className={pending ? "cursor-wait" : "cursor-pointer"}
		>
			<Send size={16} className="ml-0.5" />
		</AuroraButton>
	);
};

const MessageBubble = ({ message }: { message: any }) => {
	"use memo";
	const isAI = message.role === "assistant";
	const isTool = message.role === "tool";

	// Render structural executed tool cards in deep Liquid Glass
	if (isTool) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 15, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				className="flex w-full mb-4 justify-start font-sans"
			>
				<div className="rounded-2xl bg-[rgba(139,92,246,0.1)] border border-[#8B5CF6]/30 backdrop-blur-xl p-3.5 shadow-[0_8px_32px_rgba(139,92,246,0.05)] w-full max-w-[85%]">
					<div className="flex items-center gap-2 mb-2">
						<div className="w-5 h-5 rounded-full bg-[#00E0FF]/10 flex items-center justify-center border border-[#00E0FF]/20">
							<Wrench size={10} className="text-[#00E0FF] animate-pulse" />
						</div>
						<span className="text-[10px] text-[#00E0FF] uppercase tracking-widest font-semibold font-['Plus_Jakarta_Sans',sans-serif]">
							Executed: {message.toolsUsed}
						</span>
					</div>
					<div className="text-[11px] font-mono text-[#94A3B8] bg-black/40 p-2.5 rounded-xl border border-white/5 break-all max-h-32 overflow-y-auto no-scrollbar">
						<ReactMarkdown>{message.content}</ReactMarkdown>
					</div>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 15, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			className={`flex w-full mb-4 ${isAI ? "justify-start" : "justify-end"}`}
		>
			<div
				className={`max-w-[85%] p-4 ${
					isAI
						? "rounded-2xl rounded-tl-sm bg-[rgba(20,20,25,0.6)] border border-[rgba(255,255,255,0.08)] backdrop-blur-xl"
						: "rounded-2xl rounded-tr-sm bg-white/10 border border-white/20 backdrop-blur-md"
				} shadow-[0_8px_32px_rgba(139,92,246,0.08)]`}
			>
				{isAI && message.thinking && (
					<motion.div className="text-[10px] uppercase tracking-widest text-[#00E0FF] mb-2 flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif] font-bold">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
						>
							<Sparkles size={12} />
						</motion.div>
						Synthesizing Space-Time...
					</motion.div>
				)}

				{message.content && (
					<p className="font-sans text-[14px] leading-[1.6] text-[#F8FAFC] whitespace-pre-wrap">
						<ReactMarkdown>{message.content}</ReactMarkdown>
					</p>
				)}

				{isAI && message.toolsUsed && (
					<div className="mt-3 p-3 rounded-lg bg-black/50 border border-white/10 flex flex-col gap-1 backdrop-blur-md">
						<span className="text-[10px] text-[#8B5CF6] uppercase tracking-widest font-semibold font-['Plus_Jakarta_Sans',sans-serif]">
							Requested Actions
						</span>
						<code className="text-[11px] text-[#94A3B8] font-mono break-all max-h-24 overflow-y-auto block no-scrollbar">
							{message.toolsUsed}
						</code>
					</div>
				)}
			</div>
		</motion.div>
	);
};

const ChatInterface = () => {
	const [isToolMode, setIsToolMode] = useState(false);
	const [isThinkingEnabled, setIsThinkingEnabled] = useState(true);
	const formRef = useRef<HTMLFormElement>(null);
	const [isPageContextEnabled, setIsPageContextEnabled] = useState(true);
	const { data: currentPageContext } = useBrowserCurrentActiveTab();

	const {
		messages: freshMessages,
		sendMessage,
		isStreaming,
		activeTool,
	} = useOllamaChatStream({ isToolMode });
	const messages = useDeferredValue(freshMessages);
	const [, submitAction, isPending] = useActionState(
		(prevState: any, formData: FormData) => {
			const text = formData.get("message") as string;
			if (!text || !text.trim()) return prevState;

			formRef.current?.reset();

			startTransition(async () => {
				await sendMessage(text.trim());
			});

			return null;
		},
		null,
	);

	const currenLLMModel = useOllamaSelectedModelRead();

	return (
		<div className="h-screen max-h-screen w-full bg-[#05050A] relative overflow-hidden font-sans text-[#F8FAFC] shadow-2xl flex flex-col border border-white/5 mx-auto ring-0 ring-[#8B5CF6]/20">
			<div className="absolute top-[-20%] left-[-20%] w-75 h-75 bg-[#00E0FF] blur-[120px] opacity-20 aurora-1 rounded-full pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-20%] w-75 h-75 bg-[#8B5CF6] blur-[100px] opacity-20 aurora-2 rounded-full pointer-events-none" />
			<div className="absolute top-[30%] left-[20%] w-62.5 h-62.5 bg-[#FF2E63] blur-[120px] opacity-[0.15] aurora-3 rounded-full pointer-events-none" />

			{/* Main Container */}
			<div className="flex flex-col w-full h-full p-4 relative z-10">
				{/* Header - Glass Panel */}
				<div className="flex items-center justify-between p-3 rounded-2xl bg-[rgba(20,20,25,0.4)] backdrop-blur-lg border border-[rgba(255,255,255,0.08)] mb-4 shadow-[0_8px_32px_rgba(139,92,246,0.05)] bg-transparent">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-full bg-linear-to-tr from-[#00E0FF] to-[#8B5CF6] p-px shadow-[0_0_15px_rgba(0,224,255,0.5)]">
							<div className="w-full h-full rounded-full bg-[#05050A] flex items-center justify-center">
								<Bot size={18} className="text-[#00E0FF]" />
							</div>
						</div>
						<div>
							<h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-[14px] font-bold text-[#F8FAFC] tracking-[-0.02em] leading-tight">
								Ollama Native
							</h1>
							<p className="font-['Plus_Jakarta_Sans',sans-serif] text-[9px] text-[#00E0FF] tracking-widest uppercase font-semibold">
								{currenLLMModel}
							</p>
						</div>
					</div>

					{/* Protocol Config Mode Switch */}
					<div className="flex items-center gap-2 relative group">
						<div className="text-[#64748B] hover:text-[#00E0FF] transition-colors cursor-help p-1 rounded-full hover:bg-white/5">
							<Info size={14} />
						</div>

						{/* Hover Context Glass Panel */}
						<div className="absolute right-0 top-[120%] w-55 p-3 rounded-2xl bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(0,224,255,0.1)] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out z-50 pointer-events-none">
							<div className="flex items-center gap-1.5 text-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[12px] mb-1">
								<Sparkles size={12} className="text-[#ffe100]" /> Protocol Mode
							</div>
							<p className="text-[#94A3B8] text-[11px] leading-normal">
								Toggle between{" "}
								<span className="text-[#00E0FF] font-medium">
									Standard Inference
								</span>{" "}
								(streaming & thinking enabled) and{" "}
								<span className="text-[#FF2E63] font-medium">
									Agentic Access
								</span>{" "}
								for direct function calling.
							</p>
						</div>

						<div
							onClick={() => {
								setIsToolMode((prevMode) => !prevMode);
								setIsThinkingEnabled(true);
							}}
							className="flex items-center p-1 rounded-full bg-[#05050A]/60 border border-white/10 cursor-pointer relative w-20 h-9 shadow-inner"
						>
							<motion.div
								layout
								className="absolute top-1 bottom-1 w-8.5 rounded-full bg-[rgba(255,255,255,0.15)] backdrop-blur-md border border-[rgba(255,255,255,0.2)] shadow-[0_0_10px_rgba(255,255,255,0.1)]"
								animate={{ x: isToolMode ? 38 : 0 }}
								transition={{ type: "spring", stiffness: 400, damping: 25 }}
							/>
							<div className="flex-1 flex justify-center z-10 text-[#00E0FF]">
								<Sparkles
									size={14}
									className={
										!isToolMode ? "opacity-100" : "opacity-40 text-white"
									}
								/>
							</div>
							<div className="flex-1 flex justify-center z-10 text-[#FF2E63]">
								<Wrench
									size={14}
									className={
										isToolMode ? "opacity-100" : "opacity-40 text-white"
									}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="flex-1 min-h-0 w-full relative overflow-hidden">
					<AnimatePresence mode="wait">
						{messages.length === 0 ? (
							<div className="flex items-center justify-center h-full flex-col text-center opacity-50 font-['Plus_Jakarta_Sans',sans-serif]">
								<Bot size={48} className="text-[#8B5CF6] mb-3" />
								<p className="text-sm">Initiate intelligence matrix.</p>
							</div>
						) : (
							<LegendList
								data={messages}
								renderItem={({ item }) => {
									console.log(item);
									return <MessageBubble message={item} />;
								}}
								keyExtractor={(item: any) => item.id}
								maintainScrollAtEnd
								recycleItems
								className="h-full overflow-y-auto no-scrollbar"
								style={{ scrollbarWidth: "none" }}
								ListFooterComponent={<div className="h-20 w-full" />}
							/>
						)}
					</AnimatePresence>

					{/* Tool Running Ambient Card Overlay */}
					<AnimatePresence>
						{activeTool && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 10 }}
								className="absolute bottom-24 left-4 right-4 z-20 flex items-center justify-center pointer-events-none"
							>
								<div className="rounded-full bg-[rgba(20,20,25,0.8)] border border-[#00E0FF]/30 backdrop-blur-2xl px-4 py-2 shadow-[0_8px_32px_rgba(0,224,255,0.15)] flex items-center gap-3">
									<Loader2 size={12} className="text-[#00E0FF] animate-spin" />
									<span className="text-[11px] text-[#F8FAFC] font-medium font-sans">
										Executing local action:{" "}
										<span className="text-[#00E0FF] font-mono">
											{activeTool}
										</span>
									</span>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Floating Bottom Navigation Menu Context */}
				<div
					className={`fixed bottom-5 shrink-0 h-14 left-4 right-4 bg-[rgba(20,20,25,0.45)] backdrop-blur-xl saturate-150 border border-[rgba(255,255,255,0.2)] rounded-full p-1.5 shadow-[0_8px_32px_rgba(139,92,246,0.15)] transition-all [&:hover,&:focus]:inset-shadow-sm ${isStreaming || isPending ? "hover:shadow-fuchsia-300" : "hover:shadow-sky-300"}`}
				>
					<form
						ref={formRef}
						action={submitAction}
						className="flex items-center w-full gap-2 relative z-10"
					>
						<div className="relative group flex items-center justify-center">
							<div className="absolute bottom-[135%] left-0 w-52 p-3 rounded-2xl bg-[rgba(15,15,20,0.92)] backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-999999">
								<div className="flex items-center gap-1.5 text-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[11px] mb-1">
									<Globe size={12} className="text-[#8B5CF6]" /> Webpage Context
								</div>
								<p className="text-[#94A3B8] text-[10px] leading-normal font-sans">
									{currentPageContext ? (
										<>
											Inject the text content of:{" "}
											<span className="text-[#00E0FF] font-medium break-all block mt-1">
												{currentPageContext?.title || "Current Page"}
											</span>
										</>
									) : (
										"Attach the content of the active browser page as background instructions."
									)}
								</p>
							</div>

							<div
								className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 pointer-events-none ${isPageContextEnabled ? "bg-[#8B5CF6]/25 opacity-100" : "bg-transparent opacity-0"}`}
							/>

							{/* Page context toggle button */}
							<button
								type="button"
								disabled={isStreaming || isPending}
								onClick={() => setIsPageContextEnabled((prev) => !prev)}
								className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer relative z-10 ${
									isPageContextEnabled
										? "bg-[rgba(139,92,246,0.1)] border-[#8B5CF6]/40 text-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.2)]"
										: "bg-white/5 border-white/10 text-[#64748B] hover:text-[#94A3B8] hover:bg-white/10"
								}`}
							>
								<Globe
									size={18}
									className={`transition-transform duration-500 ${isPageContextEnabled ? "scale-110 rotate-12" : "scale-100"}`}
								/>
							</button>
						</div>

						{/* Existing Deep Thinking container */}
						<div className="relative group flex items-center justify-center">
							<div className="absolute bottom-[135%] left-0 w-52 p-3 rounded-2xl bg-[rgba(15,15,20,0.92)] backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-999999">
								<div className="flex items-center gap-1.5 text-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[11px] mb-1">
									<Brain size={12} className="text-[#00E0FF]" /> Deep Thinking
								</div>
								<p className="text-[#94A3B8] text-[10px] leading-normal font-sans">
									Activate reasoning configurations.{" "}
									<span className="text-[#8B5CF6] font-semibold">Note:</span>{" "}
									Tool actions default to bypassing manual reasoning overrides.
								</p>
							</div>

							<div
								className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 pointer-events-none ${isThinkingEnabled ? "bg-[#00E0FF]/25 opacity-100" : "bg-transparent opacity-0"}`}
							/>

							{/* Thinking state button toggle */}
							<button
								type="button"
								disabled={isToolMode || isStreaming || isPending}
								onClick={() => {
									if (isToolMode) {
										setIsThinkingEnabled(true);
									} else {
										setIsThinkingEnabled((prevThinkMode) => !prevThinkMode);
									}
								}}
								className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer relative z-10 ${
									isThinkingEnabled
										? "bg-[rgba(0,224,255,0.1)] border-[#00E0FF]/40 text-[#00E0FF] shadow-[0_0_15px_rgba(0,224,255,0.2)]"
										: "bg-white/5 border-white/10 text-[#64748B] hover:text-[#94A3B8] hover:bg-white/10"
								}`}
							>
								<BrainCircuit
									size={18}
									className={`transition-transform duration-500 ${isThinkingEnabled ? "scale-110 animate-pulse" : "scale-100"}`}
								/>
							</button>
						</div>

						<input
							type="text"
							name="message"
							placeholder={
								isToolMode ? "Instruct system logic..." : "Ask Ollama..."
							}
							className="flex-1 bg-transparent border-none outline-none text-[#F8FAFC] placeholder:text-[#64748B] text-[14px] px-2 min-w-0 font-mono"
							autoComplete="off"
							required
							disabled={isStreaming || isPending}
						/>

						<FormSubmitButton />
					</form>
				</div>
			</div>
		</div>
	);
};

export default ChatInterface;
