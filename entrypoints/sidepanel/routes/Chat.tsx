import React, {
	useRef,
	useState,
	useOptimistic,
	useActionState,
	startTransition,
} from "react";
import { useFormStatus } from "react-dom";
import {
	QueryClient,
	useQueryClient,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
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
} from "lucide-react";
import { useOllamaSelectedModelRead } from "@/hooks/store";
import "./styles/Chat.css";
import { useOllamaChatStream } from "@/hooks/query/agents/useOllamaChat";

export interface ToolDefinition {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: {
			type: "object";
			properties: Record<string, any>;
			required: string[];
		};
	};
}

const basicTools: ToolDefinition[] = [
	{
		type: "function",
		function: {
			name: "getActiveTabInfo",
			description: "Gets the title and URL of the active browser tab.",
			parameters: { type: "object", properties: {}, required: [] },
		},
	},
	{
		type: "function",
		function: {
			name: "get_system_metrics",
			description: "Queries the browser for the host hardware specs.",
			parameters: { type: "object", properties: {}, required: [] },
		},
	},
	{
		type: "function",
		function: {
			name: "create_monitoring_alarm",
			description:
				"Schedules a background alarm to check a webpage periodically.",
			parameters: {
				type: "object",
				properties: {
					alarm_name: { type: "string" },
					url: { type: "string" },
					interval_minutes: { type: "number" },
				},
				required: ["alarm_name", "url", "interval_minutes"],
			},
		},
	},
];

const experimentalStream_query = ({ queryKey, queryFn }: any) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: queryKey,
		mutationFn: (vars: any) => queryFn(vars, queryClient),
	});
};

const MagneticButton = ({
	children,
	onClick,
	type = "button",
	className = "",
	disabled = false,
}: any) => {
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
		{/* Aurora Ambient Core */}
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
		<AuroraButton pending={pending}>
			<Send size={16} className="ml-0.5" />
		</AuroraButton>
	);
};

const MessageBubble = React.memo(({ message }: { message: any }) => {
	const isAI = message.role === "assistant";

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
				<p className="font-sans text-[14px] leading-[1.6] text-[#F8FAFC]">
					{message.content}
				</p>

				{isAI && message.toolsUsed && (
					<div className="mt-3 p-3 rounded-lg bg-black/50 border border-white/10 flex flex-col gap-1 backdrop-blur-md">
						<span className="text-[10px] text-[#8B5CF6] uppercase tracking-widest font-semibold font-['Plus_Jakarta_Sans',sans-serif]">
							Tool Invoked
						</span>
						<code className="text-[11px] text-[#94A3B8] font-mono">
							{message.toolsUsed}
						</code>
					</div>
				)}
			</div>
		</motion.div>
	);
});

const ChatInterface = () => {
	const queryClient = useQueryClient();
	const [isToolMode, setIsToolMode] = useState(false);
	const [isThinkingEnabled, setIsThinkingEnabled] = useState(true);
	const formRef = useRef<HTMLFormElement>(null);

	const cachedMessages =
		useQuery({ queryKey: ["chat-history"], queryFn: () => [] }).data || [];

	const [optimisticMessages, addOptimisticMessage] = useOptimistic(
		cachedMessages,
		(state: any[], newMessage: any) => [...state, newMessage],
	);

	const streamMutation = experimentalStream_query({
		queryKey: ["chat-stream-mutation"],
		queryFn: async (vars: any, client: QueryClient) => {
			const responseId = Date.now().toString();
			let partialContent = "";

			// Initialize AI placeholder message
			client.setQueryData(["chat-history"], (old: any) => [
				...(old || []),
				{
					id: responseId,
					role: "assistant",
					content: "",
					thinking: vars.config.thinking,
				},
			]);

			const mockWords = vars.isToolMode
				? [
						"Initializing",
						" tool sequence:",
						" `getActiveTabInfo`...",
						" Execution complete.",
						" The",
						" active",
						" tab",
						" is",
						" React 19 Docs.",
					]
				: [
						"Analyzing",
						" context.",
						" My",
						" thinking",
						" process",
						" concludes",
						" that",
						" Liquid",
						" Glass",
						" is",
						" beautiful.",
					];

			// Simulate streaming chunks
			for (let i = 0; i < mockWords.length; i++) {
				await new Promise((r) => setTimeout(r, 120));
				partialContent += mockWords[i];

				client.setQueryData(["chat-history"], (old: any) => {
					const clone = [...(old || [])];
					const target = clone.find((m) => m.id === responseId);
					if (target) {
						target.content = partialContent;
						if (vars.isToolMode && partialContent.includes("tool sequence"))
							target.toolsUsed = "getActiveTabInfo()";
						if (i === Math.floor(mockWords.length / 2)) target.thinking = false;
					}
					return clone;
				});
			}
			return partialContent;
		},
	});

	const [, submitAction, isPending] = useActionState(
		(prevState: any, formData: FormData) => {
			const text = formData.get("message") as string;
			if (!text || !text.trim()) return prevState;

			formRef.current?.reset();

			const newMsg = {
				id: Date.now().toString(),
				role: "user",
				content: text.trim(),
			};
			addOptimisticMessage(newMsg);

			queryClient.setQueryData(["chat-history"], (old: any) => [
				...(old || []),
				newMsg,
			]);

			const configPayload = {
				message: text,
				mode: isToolMode ? "function_calling" : "chat",
				...(!isToolMode
					? { stream: true, thinking: true }
					: { tools: basicTools }),
			};

			console.log("🚀 Emitting AI Payload: ", configPayload);

			startTransition(async () => {
				await streamMutation.mutateAsync({
					message: text,
					isToolMode,
					config: configPayload,
				});
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

			{/* Main Canvas Container */}
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
							<h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-[15px] font-bold text-[#F8FAFC] tracking-[-0.02em] leading-tight">
								Ollama Native
							</h1>
							<p className="font-['Plus_Jakarta_Sans',sans-serif] text-[10px] text-[#00E0FF] tracking-widest uppercase font-semibold">
								{currenLLMModel}
							</p>
						</div>
					</div>

					{/* Mode Switch (Just Chat vs Function Calling) */}
					<div className="flex items-center gap-2 relative group">
						<div className="text-[#64748B] hover:text-[#00E0FF] transition-colors cursor-help p-1 rounded-full hover:bg-white/5">
							<Info size={14} />
						</div>

						{/* Liquid Glass Popover */}
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
						{optimisticMessages.length === 0 ? (
							<div className="flex items-center justify-center h-full flex-col text-center opacity-50 font-['Plus_Jakarta_Sans',sans-serif]">
								<Bot size={48} className="text-[#8B5CF6] mb-4" />
								<p className="text-sm">Initiate intelligence matrix.</p>
							</div>
						) : (
							<LegendList
								data={optimisticMessages}
								renderItem={({ item }) => <MessageBubble message={item} />}
								keyExtractor={(item: any) => item.id}
								maintainScrollAtEnd
								recycleItems
								className="h-full overflow-y-auto no-scrollbar"
								style={{ scrollbarWidth: "none" }}
								ListFooterComponent={<div className="h-22.5 w-full" />}
							/>
						)}
					</AnimatePresence>
				</div>

				<div
					className={`fixed bottom-7 shrink-0 h-15 left-4 right-4 bg-[rgba(20,20,25,0.45)] backdrop-blur-xl saturate-150 border border-[rgba(255,255,255,0.2)] rounded-full p-2 shadow-[0_8px_32px_rgba(139,92,246,0.15)] transition-all [&:hover,&:focus]:inset-shadow-sm ${isPending ? "hover:shadow-fuchsia-300" : "hover:shadow-sky-300"}`}
				>
					<form
						ref={formRef}
						action={submitAction}
						className="flex items-center w-full gap-2 relative z-10 "
					>
						<div className="relative group flex items-center justify-center">
							{/* Tooltip (Controlled natively via Tailwind hover/transitions) */}
							<div className="absolute bottom-[135%] left-0 w-56 p-3 rounded-2xl bg-[rgba(15,15,20,0.92)] backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_15px_rgba(139,92,246,0.1)] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-50">
								<div className="flex items-center gap-1.5 text-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[12px] mb-1">
									<Brain size={12} className="text-[#00E0FF]" /> Deep Thinking
								</div>
								<p className="text-[#94A3B8] text-[10.5px] leading-normal font-sans">
									Activate reasoning-trace generation.{" "}
									<span className="text-[#8B5CF6] font-semibold">Note:</span>{" "}
									Tool-calls bypass manual overrides and are enabled by default.
								</p>
							</div>

							{/* Neon Ambient Halo behind switch */}
							<div
								className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 pointer-events-none ${isThinkingEnabled ? "bg-[#00E0FF]/25 opacity-100" : "bg-transparent opacity-0"}`}
							/>

							{/* Toggle Switch */}
							<button
								type="button"
								disabled={isToolMode}
								onClick={() => {
									if (isToolMode) {
										setIsThinkingEnabled(true);
									} else {
										setIsThinkingEnabled((prevThinkMode) => !prevThinkMode);
									}
								}}
								className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer relative z-10 ${
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
								isToolMode
									? "Instruct system logic..."
									: "Ask Ollama locally..."
							}
							className="flex-1 bg-transparent border-none outline-none text-[#F8FAFC] placeholder:text-[#64748B] text-[14px] px-2 min-w-0 font-mono placeholder:font-mono"
							autoComplete="off"
							required
							disabled={isPending}
						/>

						<FormSubmitButton />
					</form>
				</div>
			</div>
		</div>
	);
};

export default ChatInterface;
