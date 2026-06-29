import { motion } from "framer-motion";

export const LoadingUI = ({
	headerTxt = "Calibrating Pipeline Interface",
	headerTxt2 = "Resolving physical silicon vectors...",
	footerTxt = "CONNECTING KERNEL MEMORY DRIVERS",
}) => {
	return (
		<div className="relative min-h-screen w-full  bg-[#05050A] border border-white/10 rounded-sm overflow-hidden p-6 text-[#F8FAFC] flex flex-col justify-between">
			{/* Dynamic Mesh Layer */}
			<div className="absolute top-[20%] right-[-10%] w-45 h-45 rounded-full bg-[#00E0FF] opacity-10 blur-3xl pointer-events-none animate-pulse" />

			<div className="space-y-8 mt-12">
				{/* Holographic CPU Silicon Base */}
				<div className="relative w-28 h-28 mx-auto flex items-center justify-center">
					{/* Pulsing Concentric Outer Rings */}
					<div className="absolute inset-0 border border-dashed border-[#00E0FF]/30 rounded-full animate-spin [animation-duration:15s]" />
					<div className="absolute inset-2 border border-[#8B5CF6]/40 rounded-full animate-ping [animation-duration:3s]" />
					<div className="absolute inset-4 bg-linear-to-tr from-[#00E0FF]/10 to-[#8B5CF6]/10 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center">
						<svg
							className="w-10 h-10 text-[#00E0FF] animate-pulse"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
							/>
						</svg>
					</div>
				</div>

				<div className="text-center space-y-2">
					<h2 className="text-base font-jakarta font-bold text-white tracking-tight animate-pulse">
						{headerTxt}
					</h2>
					<p className="text-xs text-[#94A3B8] font-mono tracking-normal leading-normal">
						{headerTxt2}
					</p>
				</div>

				{/* Core Layout Skeleton Trace Layout */}
				<div className="grid grid-cols-4 gap-2 px-6">
					{[...Array(4)].map((_, i) => (
						<div
							key={i}
							className="h-10 bg-white/2 border border-white/4 rounded-xl animate-pulse cursor-wait"
							style={{ animationDelay: `${i * 150}ms` }}
						/>
					))}
				</div>
			</div>

			<div className="pt-4 border-t border-white/[0.05] text-center">
				<span className="text-[10px] font-mono text-slate-500">
					{footerTxt}
				</span>
			</div>
		</div>
	);
};

export const ErrorUI = ({
	headerDescTxt = "The real-time telemetry pipeline requires runtime binding. Ensure this window resides in a Chrome extension popup configured with permission parameters.",
	copyTextCommand = 'OLLAMA_ORIGINS="*" ollama serve',
	copyTagTxt = "MV3",
	copyHeaderTxt = "Manifest Interface Schema",
	copiedButtonTxt = "Copied Configuration",
	copyButtonTxt = "Copy Permission Manifest",
}) => {
	const [copyState, setCopyState] = useState(false);

	const handleCopyManifest = () => {
		navigator.clipboard.writeText(copyTextCommand);
		setCopyState(true);
		setTimeout(() => setCopyState(false), 2000);
	};

	const copyButtonTxtNode = copyState ? copiedButtonTxt : copyButtonTxt;
	return (
		<div className="relative min-h-screen w-full bg-[#05050A] border border-white/10 overflow-hidden p-6 text-[#F8FAFC] flex flex-col justify-between">
			{/* Dynamic Canvas Background Elements */}
			<div className="absolute top-[-10%] left-[-10%] w-45 h-45 rounded-full bg-[#FF2E63] opacity-20 blur-[64px] pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-10%] w-45 h-45 rounded-full bg-[#8B5CF6] opacity-10 blur-[64px] pointer-events-none" />

			<div className="space-y-6">
				<div className="flex items-center space-x-3">
					<div className="w-2.5 h-2.5 rounded-full bg-[#FF2E63] animate-pulse shadow-[0_0_8px_#FF2E63]" />
					<span className="text-[10px] font-mono tracking-widest text-[#FF2E63] uppercase font-bold">
						Diagnostics Status: Telemetry Offline
					</span>
				</div>

				<div className="space-y-2">
					<h1 className="text-xl font-bold font-jakarta tracking-tight leading-none text-white">
						System Interface Decoupled
					</h1>
					<p className="text-xs text-[#94A3B8] leading-relaxed">
						{headerDescTxt}
					</p>
				</div>

				{/* Interactive Configurations Accordion */}
				<div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3">
					<div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
						<span className="text-[10px] font-mono text-[#94A3B8] uppercase font-bold tracking-wider">
							{copyHeaderTxt}
						</span>
						<div className="flex bg-white/[0.05] p-0.5 rounded-lg border border-white/[0.08]">
							<button
								className={`text-[9px] font-mono px-2 py-1 rounded-md transition-all bg-[#8B5CF6] text-white`}
							>
								{copyTagTxt}
							</button>
						</div>
					</div>

					<pre className="text-[10px] font-mono bg-[#020205] p-3 rounded-lg overflow-x-auto text-slate-300 leading-normal border border-white/[0.04]">
						<span>
							<code className="font-mono">{copyTextCommand}</code>
						</span>
					</pre>

					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={handleCopyManifest}
						className="w-full py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-mono font-medium rounded-xl flex items-center justify-center space-x-2 text-white transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.2)] cursor-copy"
					>
						<svg
							className="w-3.5 h-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							{copyState ? (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.5}
									d="M5 13l4 4L19 7"
								/>
							) : (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
								/>
							)}
						</svg>
						<span>{copyButtonTxtNode}</span>
					</motion.button>
				</div>
			</div>

			<div className="pt-4 border-t border-white/[0.08] text-center">
				<span className="text-[10px] font-mono text-[#64748B] tracking-wider">
					Ollama Web Browser v1.0.0
				</span>
			</div>
		</div>
	);
};
