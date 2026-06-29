import React, {
	useState,
	useEffect,
	useRef,
	startTransition,
	useDeferredValue,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ErrorUI, LoadingUI } from "../layout/Status";
import { useSystemUsage } from "@/hooks/query";
import "./styles/CPUUsage.css";

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

interface ProcessorDelta {
	coreIndex: number;
	userUsage: number; // Calculated live percentage (0-100)
	kernelUsage: number; // Calculated live percentage (0-100)
	idleUsage: number; // Calculated live percentage (0-100)
	totalUsage: number; // Calculated live percentage (0-100)
}

// Technical dictionaries for CPU features
const FLAG_DEFINITIONS: Record<string, string> = {
	mmx: "Multimedia Extensions: Accelerates packed integer operations for graphical and signal processing.",
	sse: "Streaming SIMD Extensions: 128-bit vector registers for floating-point mathematical calculations.",
	sse2: "Double-precision extensions: 64-bit floating-point registers for spatial processing and 3D simulations.",
	sse3: "Asymmetric mathematical calculations, horizontal addition, and multi-thread synchronization locks.",
	ssse3:
		"Supplemental vector structures enabling rapid intra-register operations and data alignments.",
	sse4_1:
		"Advanced spatial search engines and hardware-level memory scanning vectors.",
	sse4_2:
		"Hardware-accelerated pattern recognition and cyclic redundancy checks.",
	avx: "Advanced Vector Extensions: 256-bit wide registers for deep neural processing and volumetric math.",
};

export const MagneticNode: React.FC<{
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	active?: boolean;
}> = ({ children, className = "", onClick, active = false }) => {
	const ref = useRef<HTMLButtonElement>(null);
	const [freshCoords, setCoords] = useState({ x: 0, y: 0 });
	const coords = useDeferredValue(freshCoords);

	// Spring physics parameters set precisely to specifications:
	// Stiffness: 180 | Damping: 12 | Translation ratio: 35% (0.35)
	const springX = coords.x * 0.35;
	const springY = coords.y * 0.35;

	const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		startTransition(() => {
			setCoords({
				x: e.clientX - centerX,
				y: e.clientY - centerY,
			});
		});
	};

	const handleMouseLeave = () => {
		setCoords({ x: 0, y: 0 });
	};

	return (
		<button
			ref={ref}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			onClick={onClick}
			className={`relative flex items-center justify-center cursor-pointer select-none outline-none rounded-full transition-colors duration-200 ${
				active ? "bg-white/[0.08]" : "hover:bg-white/[0.03]"
			} ${className}`}
			style={{ WebkitTapHighlightColor: "transparent" }}
		>
			<motion.div
				animate={{ x: springX, y: springY }}
				transition={{ type: "spring", stiffness: 180, damping: 12 }}
				whileTap={{ scale: 0.92 }}
				className="w-full h-full flex items-center justify-center p-2.5"
			>
				{children}
			</motion.div>
		</button>
	);
};

// ==========================================
// 2. LIQUID GLASS CARD WITH RADIAL BORDER TRACK
// ==========================================

export const InteractiveGlassCard: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className = "" }) => {
	const cardRef = useRef<HTMLDivElement>(null);
	const [freshCoords, setCoords] = useState({ x: 0, y: 0 });
	const coords = useDeferredValue(freshCoords);
	const [isHovered, setIsHovered] = useState(false);

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!cardRef.current) return;
		const rect = cardRef.current.getBoundingClientRect();
		setCoords({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
	};

	return (
		<div
			ref={cardRef}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={`relative overflow-hidden backdrop-blur-md bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${className}`}
		>
			{/* Dynamic Cursor Surface Glow */}
			{isHovered && (
				<div
					className="absolute inset-0 pointer-events-none transition-opacity duration-300"
					style={{
						background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, rgba(255,255,255,0.04), transparent 80%)`,
					}}
				/>
			)}
			{/* Cursor Radial Masked Border Glow */}
			{isHovered && (
				<div
					className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300"
					style={{
						maskImage: `radial-gradient(100px circle at ${coords.x}px ${coords.y}px, black, transparent)`,
						WebkitMaskImage: `radial-gradient(100px circle at ${coords.x}px ${coords.y}px, black, transparent)`,
						border: "1px solid rgba(0, 224, 255, 0.4)",
					}}
				/>
			)}
			<div className="relative z-10">{children}</div>
		</div>
	);
};

export default function TelemetryDashboard() {
	const [activeTab, setActiveTab] = useState<"core" | "registers" | "ram">(
		"core",
	);
	const [selectedCore, setSelectedCore] = useState<number | null>(0);
	const [selectedFlag, setSelectedFlag] = useState<string | null>(null);

	const prevCpuInfoRef = useRef<CpuInfo | null>(null);
	const [coreDeltas, setCoreDeltas] = useState<ProcessorDelta[]>([]);
	const [averageUsage, setAverageUsage] = useState<number>(0);
	const [averageHistory, setAverageHistory] = useState<number[]>([]);

	const { data: freshData, error, isLoading } = useSystemUsage();
	const data = useDeferredValue(freshData);

	useEffect(() => {
		if (data?.cpu) {
			const prev = prevCpuInfoRef.current;
			const current = data.cpu;

			if (prev && prev.processors.length === current.processors.length) {
				const deltas: ProcessorDelta[] = current.processors.map((proc, idx) => {
					const prevProc = prev.processors[idx];
					const prevUsage = prevProc.usage;
					const currUsage = proc.usage;

					const diffUser = currUsage.user - prevUsage.user;
					const diffKernel = currUsage.kernel - prevUsage.kernel;
					const diffIdle = currUsage.idle - prevUsage.idle;
					const diffTotal = currUsage.total - prevUsage.total;

					if (diffTotal > 0) {
						return {
							coreIndex: idx,
							userUsage: (diffUser / diffTotal) * 100,
							kernelUsage: (diffKernel / diffTotal) * 100,
							idleUsage: (diffIdle / diffTotal) * 100,
							totalUsage: ((diffTotal - diffIdle) / diffTotal) * 100,
						};
					}
					return {
						coreIndex: idx,
						userUsage: 0,
						kernelUsage: 0,
						idleUsage: 0,
						totalUsage: 0,
					};
				});

				startTransition(() => {
					setCoreDeltas(deltas);
				});
				const avg =
					deltas.reduce((acc, curr) => acc + curr.totalUsage, 0) /
					deltas.length;
				setAverageUsage(avg);
				startTransition(() => {
					setAverageHistory((prevHist) => {
						const nextHist = [...prevHist, avg];
						return nextHist.slice(-15);
					});
				});
			} else {
				// First initial hardware telemetry query cycle
				const initial = current.processors.map((proc, idx) => {
					const u = proc.usage;
					if (u.total > 0) {
						return {
							coreIndex: idx,
							userUsage: (u.user / u.total) * 100,
							kernelUsage: (u.kernel / u.total) * 100,
							idleUsage: (u.idle / u.total) * 100,
							totalUsage: ((u.total - u.idle) / u.total) * 100,
						};
					}
					return {
						coreIndex: idx,
						userUsage: 0,
						kernelUsage: 0,
						idleUsage: 0,
						totalUsage: 0,
					};
				});
				setCoreDeltas(initial);
			}
			prevCpuInfoRef.current = current;
		}
	}, [data]);

	if (error) {
		return <ErrorUI />;
	}

	if (isLoading) {
		return <LoadingUI />;
	}

	// Real data destructured from verified environment
	const cpuInfo = data?.cpu;
	const memoryInfo = data?.memory;

	// Real-time calculated hardware dimensions
	const totalMemoryGB = memoryInfo
		? (memoryInfo.capacity / 1024 ** 3).toFixed(1)
		: "0";
	const availableMemoryGB = memoryInfo
		? (memoryInfo.availableCapacity / 1024 ** 3).toFixed(1)
		: "0";
	const usedMemoryGB = memoryInfo
		? (
				(memoryInfo.capacity - memoryInfo.availableCapacity) /
				1024 ** 3
			).toFixed(1)
		: "0";
	const memoryPercentUsed = memoryInfo
		? ((memoryInfo.capacity - memoryInfo.availableCapacity) /
				memoryInfo.capacity) *
			100
		: 0;

	return (
		<div className="relative min-h-screen w-full bg-[#05050A] border border-white/10 overflow-hidden p-5 text-[#F8FAFC] flex flex-col justify-between font-sans">
			{/* Dynamic Background Mesh Gradients */}
			<div
				className="absolute top-[5%] left-[5%] w-50 h-50 rounded-full bg-[#00E0FF] pointer-events-none blur-[72px]"
				style={{ animation: "pulseAurora 8s ease-in-out infinite" }}
			/>
			<div
				className="absolute bottom-[10%] right-[10%] w-45 h-45 rounded-full bg-[#8B5CF6] pointer-events-none blur-[80px]"
				style={{ animation: "pulseAurora 12s ease-in-out infinite 2s" }}
			/>

			{/* Header telemetry node info */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E0FF] opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E0FF]"></span>
						</span>
						<span className="text-[10px] font-mono tracking-widest text-[#00E0FF] uppercase font-bold">
							System Active
						</span>
					</div>
					<div className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-mono text-slate-400">
						{cpuInfo?.archName.toUpperCase()} ARCH
					</div>
				</div>

				{/* Selected View Container Panel */}
				<AnimatePresence mode="wait">
					{activeTab === "core" && (
						<motion.div
							key="core"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-4"
						>
							{/* Core physical layout interconnect grid */}
							<InteractiveGlassCard className="space-y-3">
								<div className="flex items-center justify-between">
									<h3 className="text-xs font-jakarta font-bold uppercase tracking-wider text-white">
										Core Interconnect Map
									</h3>
									<span className="text-[10px] font-mono text-[#00E0FF]">
										{cpuInfo?.numOfProcessors} Compute Nodes
									</span>
								</div>

								<div className="grid grid-cols-4 gap-2">
									{coreDeltas.map((core) => {
										const isSelected = selectedCore === core.coreIndex;
										const r = 13;
										const circ = 2 * Math.PI * r;
										const strokeDashoffset =
											circ - (core.totalUsage / 100) * circ;

										return (
											<motion.button
												key={core.coreIndex}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={() => setSelectedCore(core.coreIndex)}
												className={`relative p-2.5 flex flex-col items-center justify-center rounded-xl transition-all duration-300 ${
													isSelected
														? "bg-white/[0.08] border border-white/20 shadow-[0_0_12px_rgba(0,224,255,0.15)]"
														: "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10"
												}`}
											>
												<div className="relative w-10 h-10 flex items-center justify-center">
													<svg className="absolute w-10 h-10 transform -rotate-90">
														<circle
															cx="20"
															cy="20"
															r={r}
															stroke="rgba(255,255,255,0.03)"
															strokeWidth="2.5"
															fill="transparent"
														/>
														<motion.circle
															cx="20"
															cy="20"
															r={r}
															stroke={
																core.totalUsage > 75
																	? "#FF2E63"
																	: core.totalUsage > 40
																		? "#8B5CF6"
																		: "#00E0FF"
															}
															strokeWidth="2.5"
															fill="transparent"
															strokeDasharray={circ}
															animate={{ strokeDashoffset }}
															transition={{
																type: "spring",
																stiffness: 70,
																damping: 15,
															}}
														/>
													</svg>
													<span className="text-[9px] font-mono font-bold text-white/90">
														C{core.coreIndex}
													</span>
												</div>
												<span className="text-[8px] font-mono text-slate-400 mt-1">
													{Math.round(core.totalUsage)}%
												</span>
											</motion.button>
										);
									})}
								</div>
							</InteractiveGlassCard>

							{/* Silicon inspector panel */}
							{selectedCore !== null && coreDeltas[selectedCore] && (
								<InteractiveGlassCard className="space-y-3">
									<div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
										<span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
											Physical Core #{selectedCore} Execution Logic
										</span>
										<span className="text-[10px] font-mono text-[#00E0FF]">
											ACTIVE PIPELINE
										</span>
									</div>

									{/* Dynamic Instruction Pipeline */}
									<div className="py-2.5 px-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex items-center justify-between relative overflow-hidden">
										<div className="flex flex-col items-center flex-1">
											<span className="text-[8px] font-mono uppercase tracking-widest text-[#00E0FF]">
												Fetch
											</span>
											<div className="w-1.5 h-1.5 rounded-full bg-[#00E0FF] shadow-[0_0_6px_#00E0FF] mt-1" />
										</div>
										<div className="flex-1 flex items-center justify-center">
											<svg className="w-full h-1">
												<line
													x1="0"
													y1="2"
													x2="100%"
													y2="2"
													stroke="rgba(0, 224, 255, 0.15)"
													strokeWidth="1"
													strokeDasharray="2 2"
												/>
												<line
													x1="0"
													y1="2"
													x2="100%"
													y2="2"
													stroke="#00E0FF"
													strokeWidth="1.2"
													strokeDasharray="6 14"
													style={{
														animation: `dataFlow ${
															coreDeltas[selectedCore].totalUsage > 80
																? "0.5s"
																: coreDeltas[selectedCore].totalUsage > 40
																	? "1s"
																	: "2s"
														} linear infinite`,
													}}
												/>
											</svg>
										</div>
										<div className="flex flex-col items-center flex-1">
											<span className="text-[8px] font-mono uppercase tracking-widest text-[#8B5CF6]">
												Decode
											</span>
											<div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6] mt-1" />
										</div>
										<div className="flex-1 flex items-center justify-center">
											<svg className="w-full h-1">
												<line
													x1="0"
													y1="2"
													x2="100%"
													y2="2"
													stroke="rgba(139, 92, 246, 0.15)"
													strokeWidth="1"
													strokeDasharray="2 2"
												/>
												<line
													x1="0"
													y1="2"
													x2="100%"
													y2="2"
													stroke="#8B5CF6"
													strokeWidth="1.2"
													strokeDasharray="6 14"
													style={{
														animation: `dataFlow ${
															coreDeltas[selectedCore].totalUsage > 80
																? "0.5s"
																: coreDeltas[selectedCore].totalUsage > 40
																	? "1s"
																	: "2s"
														} linear infinite`,
													}}
												/>
											</svg>
										</div>
										<div className="flex flex-col items-center flex-1">
											<span className="text-[8px] font-mono uppercase tracking-widest text-[#FF2E63]">
												ALU
											</span>
											<div className="w-1.5 h-1.5 rounded-full bg-[#FF2E63] shadow-[0_0_6px_#FF2E63] mt-1" />
										</div>
									</div>

									<div className="grid grid-cols-3 gap-3 pt-1">
										<div className="space-y-0.5">
											<div className="text-[9px] font-mono text-slate-400">
												User Space
											</div>
											<div className="text-xs font-mono font-bold text-white">
												{Math.round(coreDeltas[selectedCore].userUsage)}%
											</div>
											<div className="h-1 bg-white/4 rounded-full overflow-hidden">
												<div
													className="h-full bg-[#00E0FF] rounded-full"
													style={{
														width: `${coreDeltas[selectedCore].userUsage}%`,
													}}
												/>
											</div>
										</div>
										<div className="space-y-0.5">
											<div className="text-[9px] font-mono text-slate-400">
												Kernel Overhead
											</div>
											<div className="text-xs font-mono font-bold text-white">
												{Math.round(coreDeltas[selectedCore].kernelUsage)}%
											</div>
											<div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
												<div
													className="h-full bg-[#8B5CF6] rounded-full"
													style={{
														width: `${coreDeltas[selectedCore].kernelUsage}%`,
													}}
												/>
											</div>
										</div>
										<div className="space-y-0.5">
											<div className="text-[9px] font-mono text-slate-400">
												Idle Capacity
											</div>
											<div className="text-xs font-mono font-bold text-white">
												{Math.round(coreDeltas[selectedCore].idleUsage)}%
											</div>
											<div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
												<div
													className="h-full bg-slate-500 rounded-full"
													style={{
														width: `${coreDeltas[selectedCore].idleUsage}%`,
													}}
												/>
											</div>
										</div>
									</div>
								</InteractiveGlassCard>
							)}
						</motion.div>
					)}

					{activeTab === "registers" && (
						<motion.div
							key="registers"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-4"
						>
							{/* Architecture register definitions layout */}
							<InteractiveGlassCard className="space-y-3">
								<div className="space-y-1">
									<span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">
										Telemetry Engine Specification
									</span>
									<h4 className="text-sm font-jakarta font-extrabold text-white leading-tight">
										{cpuInfo?.modelName}
									</h4>
								</div>

								{/* Instruction micro-gates indicators */}
								<div className="space-y-2">
									<span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
										Hardware Registers Decoded
									</span>
									<div className="flex flex-wrap gap-1.5">
										{cpuInfo?.features.map((flag) => {
											const isSelected = selectedFlag === flag;
											return (
												<button
													key={flag}
													onClick={() =>
														setSelectedFlag(isSelected ? null : flag)
													}
													className={`text-[9px] font-mono px-2 py-1 rounded-md transition-all ${
														isSelected
															? "bg-[#00E0FF] text-[#05050A] font-bold shadow-[0_0_8px_#00E0FF]"
															: "bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"
													}`}
												>
													{flag.toUpperCase()}
												</button>
											);
										})}
									</div>

									{/* Interactive definition display */}
									{selectedFlag && (
										<div className="p-3 bg-white/2 border border-white/8 rounded-xl text-[10px] text-slate-300 leading-relaxed font-mono">
											<span className="text-[#00E0FF] font-bold">
												{selectedFlag.toUpperCase()}:{" "}
											</span>
											{FLAG_DEFINITIONS[selectedFlag] ||
												"Dynamic architectural hardware feature register."}
										</div>
									)}
								</div>
							</InteractiveGlassCard>

							{/* Silicon execution sparkline graph */}
							<InteractiveGlassCard className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
										Silicon Signals Sparkline
									</span>
									<span className="text-[10px] font-mono text-[#8B5CF6]">
										Avg: {Math.round(averageUsage)}%
									</span>
								</div>

								<div className="h-12 w-full flex items-end">
									{averageHistory.length < 2 ? (
										<div className="w-full text-center text-[10px] font-mono text-slate-500 py-3">
											Calibrating system telemetry arrays...
										</div>
									) : (
										<svg className="w-full h-12 overflow-visible">
											<defs>
												<linearGradient
													id="glowGrad"
													x1="0"
													y1="0"
													x2="0"
													y2="1"
												>
													<stop
														offset="0%"
														stopColor="#00E0FF"
														stopOpacity="0.3"
													/>
													<stop
														offset="100%"
														stopColor="#8B5CF6"
														stopOpacity="0"
													/>
												</linearGradient>
											</defs>
											{/* Technical visual path */}
											<path
												d={`M 0,48 ${averageHistory
													.map(
														(val, idx) =>
															`L ${(idx / (averageHistory.length - 1)) * 320},${48 - (val / 100) * 44}`,
													)
													.join(" ")} L 320,48 Z`}
												fill="url(#glowGrad)"
											/>
											<path
												d={averageHistory
													.map(
														(val, idx) =>
															`${idx === 0 ? "M" : "L"} ${(idx / (averageHistory.length - 1)) * 320},${48 - (val / 100) * 44}`,
													)
													.join(" ")}
												fill="none"
												stroke="#00E0FF"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									)}
								</div>
							</InteractiveGlassCard>
						</motion.div>
					)}

					{activeTab === "ram" && (
						<motion.div
							key="ram"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-4"
						>
							{/* RAM Allocation Interface */}
							<InteractiveGlassCard className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
										Physical RAM Allocation
									</span>
									<span className="text-[10px] font-mono text-[#FF2E63]">
										{Math.round(memoryPercentUsed)}% Used
									</span>
								</div>

								{/* Progress fluid ring indicator */}
								<div className="relative h-2 bg-white/[0.03] border border-white/[0.08] rounded-full overflow-hidden">
									<motion.div
										className="absolute top-0 bottom-0 left-0 bg-linear-to-r from-[#8B5CF6] to-[#FF2E63] rounded-full"
										animate={{ width: `${memoryPercentUsed}%` }}
										transition={{ type: "spring", stiffness: 50, damping: 12 }}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-0.5">
										<span className="text-[9px] font-mono text-slate-400 block">
											Total Capacity
										</span>
										<span className="text-sm font-mono font-bold text-white">
											{totalMemoryGB} GB
										</span>
										<span className="text-[8px] font-mono text-slate-500 block">
											{memoryInfo?.capacity.toLocaleString()} Bytes
										</span>
									</div>
									<div className="space-y-0.5">
										<span className="text-[9px] font-mono text-slate-400 block">
											Available Bounds
										</span>
										<span className="text-sm font-mono font-bold text-[#00E0FF]">
											{availableMemoryGB} GB
										</span>
										<span className="text-[8px] font-mono text-slate-500 block">
											{memoryInfo?.availableCapacity.toLocaleString()} Bytes
										</span>
									</div>
									<div className="space-y-0.5">
										<span className="text-[9px] font-mono text-slate-400 block">
											Used Bounds
										</span>
										<span className="text-sm font-mono font-bold text-[#ff003c]">
											{usedMemoryGB} GB
										</span>
										<span className="text-[8px] font-mono text-slate-500 block">
											{(+usedMemoryGB * 1024 * 1024).toLocaleString()} bytes
										</span>
									</div>
								</div>
							</InteractiveGlassCard>

							{/* Dynamic Storage Matrix */}
							<InteractiveGlassCard className="space-y-3">
								<span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">
									Memory Register Capacitor Matrix
								</span>
								<div className="grid grid-cols-8 gap-1.5">
									{[...Array(32)].map((_, idx) => {
										const blockBound = (idx / 32) * 100;
										const isActive = memoryPercentUsed >= blockBound;

										return (
											<div
												key={idx}
												className={`aspect-square rounded-sm border transition-all duration-500 ${
													isActive
														? "bg-linear-to-tr from-[#8B5CF6] to-[#FF2E63] border-[#FF2E63]/30 shadow-[0_0_6px_rgba(255,46,99,0.2)]"
														: "bg-white/[0.02] border-white/[0.04]"
												}`}
											/>
										);
									})}
								</div>
								<span className="text-[8px] font-mono text-slate-500 tracking-normal block text-center">
									Matrix elements map live capacity state boundaries.
								</span>
							</InteractiveGlassCard>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="pt-4 z-20">
				<div className="backdrop-blur-2xl bg-white/5 border border-white/15 rounded-full p-1.5 flex items-center justify-around shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
					<MagneticNode
						active={activeTab === "core"}
						onClick={() => setActiveTab("core")}
						className="flex-1 cursor-pointer"
					>
						<div className="flex flex-col items-center">
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.8}
									d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
							<span className="text-[8px] font-mono font-bold mt-1 tracking-wider uppercase">
								ALU Core
							</span>
						</div>
					</MagneticNode>

					<MagneticNode
						active={activeTab === "registers"}
						onClick={() => setActiveTab("registers")}
						className="flex-1"
					>
						<div className="flex flex-col items-center">
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.8}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<span className="text-[8px] font-mono font-bold mt-1 tracking-wider uppercase">
								Registers
							</span>
						</div>
					</MagneticNode>

					<MagneticNode
						active={activeTab === "ram"}
						onClick={() => setActiveTab("ram")}
						className="flex-1"
					>
						<div className="flex flex-col items-center">
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.8}
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/>
							</svg>
							<span className="text-[8px] font-mono font-bold mt-1 tracking-wider uppercase">
								RAM Bus
							</span>
						</div>
					</MagneticNode>
				</div>
			</div>
		</div>
	);
}
