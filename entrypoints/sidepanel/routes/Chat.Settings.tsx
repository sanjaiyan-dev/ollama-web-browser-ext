import React, { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Loader2,
	User,
	Mail,
	Phone,
	MapPin,
	Building,
	Hash,
	Flag,
	ShieldCheck,
	Check,
	Save,
	Compass,
} from "lucide-react";

export interface UserProfile {
	fullName: string;
	email: string;
	phone: string;
	addressLine1: string;
	addressLine2: string;
	city: string;
	state: string;
	zipCode: string;
	country: string;
}

const STORAGE_KEY = "agent_user_autofill_profile";

const defaultProfile = {
	fullName: "",
	email: "",
	phone: "",
	addressLine1: "",
	addressLine2: "",
	city: "",
	state: "",
	zipCode: "",
	country: "",
} satisfies UserProfile;

async function saveUserProfile(profile: UserProfile): Promise<void> {
	if (typeof browser !== "undefined" && browser.storage) {
		await browser.storage.sync.set({ [STORAGE_KEY]: profile });
	} else {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
	}
}

async function getUserProfile(): Promise<UserProfile> {
	if (typeof browser !== "undefined" && browser.storage) {
		const result = await browser.storage.sync.get(STORAGE_KEY);
		const profile = result[STORAGE_KEY] as UserProfile | undefined;
		return profile || defaultProfile;
	} else {
		const local = localStorage.getItem(STORAGE_KEY);
		return local ? JSON.parse(local) : defaultProfile;
	}
}

const ProfileSettingsView = ({
	setModelState,
}: {
	setModelState: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	"use memo";

	const [profile, setProfile] = useState<UserProfile>(defaultProfile);
	const [isPending, startTransition] = useTransition();
	const [isSaved, setIsSaved] = useState(false);

	useEffect(() => {
		getUserProfile().then(setProfile);
	}, []);

	const handleChange = (key: keyof UserProfile, val: string) => {
		setProfile((prev) => ({ ...prev, [key]: val }));
	};

	const handleSave = () => {
		startTransition(async () => {
			await saveUserProfile(profile);
			startTransition(() => {
				setIsSaved(true);
				setTimeout(() => {
					setIsSaved(false);
				}, 2000);
				setTimeout(() => {
					setModelState(false);
				}, 2500);
			});
		});
	};

	return (
		<div className="flex flex-col gap-4 p-4 rounded-3xl bg-[rgba(20,20,25,0.3)] backdrop-blur-2xl border border-white/6 shadow-[0_24px_64px_rgba(0,0,0,0.6)] max-h-115 overflow-y-auto no-scrollbar font-sans select-none">
			{/* Spatial Header Card */}
			<div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
				<div className="flex flex-col gap-1">
					<h2 className="text-[14px] font-bold text-[#F8FAFC] tracking-[-0.01em] font-sans flex items-center gap-1.5">
						Autofill Identity Settings
					</h2>
					<p className="text-[11px] text-[#94A3B8] leading-[1.4] font-medium font-sans">
						Your credentials remain stored locally and privately on your
						machine.
					</p>
				</div>
				<div className="flex items-center gap-1 bg-[#00E0FF]/10 text-[#00E0FF] border border-[#00E0FF]/20 px-2 py-0.5 rounded-full shrink-0">
					<ShieldCheck size={10} className="animate-pulse" />
					<span className="text-[8px] font-bold uppercase tracking-widest font-sans">
						Local
					</span>
				</div>
			</div>

			{/* Responsive Form Grid */}
			<div className="grid grid-cols-2 gap-2.5 mt-1">
				{/* Full Name */}
				<div className="col-span-2 flex flex-col gap-1 group">
					<label className="text-[9px] uppercase text-[#64748B] tracking-widest font-bold font-mono group-focus-within:text-[#FF2E63] transition-colors">
						Full Name
					</label>
					<div className="relative flex items-center">
						<User
							size={12}
							className="absolute left-3.5 text-[#64748B] group-focus-within:text-[#FF2E63] transition-colors"
						/>
						<input
							type="text"
							value={profile.fullName}
							autoComplete="name"
							onChange={(e) => handleChange("fullName", e.target.value)}
							className="w-full bg-[rgba(5,5,10,0.55)] border border-white/6 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none hover:border-white/10 focus:border-[#FF2E63]/40 focus:ring-2 focus:ring-[#FF2E63]/10 transition-all font-sans duration-300 placeholder:text-[#64748B]"
							placeholder="e.g. Sanjaiyan Parthipan"
						/>
					</div>
				</div>

				{/* Email */}
				<div className="flex flex-col gap-1 group col-span-1">
					<label className="text-[9px] uppercase text-[#64748B] tracking-widest font-bold font-mono group-focus-within:text-[#FF2E63] transition-colors">
						Email
					</label>
					<div className="relative flex items-center">
						<Mail
							size={12}
							className="absolute left-3.5 text-[#64748B] group-focus-within:text-[#FF2E63] transition-colors"
						/>
						<input
							type="email"
							value={profile.email}
							autoComplete="email"
							onChange={(e) => handleChange("email", e.target.value)}
							className="w-full bg-[rgba(5,5,10,0.55)] border border-white/6 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none hover:border-white/10 focus:border-[#FF2E63]/40 focus:ring-2 focus:ring-[#FF2E63]/10 transition-all font-sans duration-300 placeholder:text-[#64748B]"
							placeholder="name@email.com"
						/>
					</div>
				</div>

				{/* Phone */}
				<div className="flex flex-col gap-1 group col-span-1">
					<label className="text-[9px] uppercase text-[#64748B] tracking-widest font-bold font-mono group-focus-within:text-[#FF2E63] transition-colors">
						Phone
					</label>
					<div className="relative flex items-center">
						<Phone
							size={12}
							className="absolute left-3.5 text-[#64748B] group-focus-within:text-[#FF2E63] transition-colors"
						/>
						<input
							type="text"
							value={profile.phone}
							autoComplete="tel"
							onChange={(e) => handleChange("phone", e.target.value)}
							className="w-full bg-[rgba(5,5,10,0.55)] border border-white/6 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none hover:border-white/10 focus:border-[#FF2E63]/40 focus:ring-2 focus:ring-[#FF2E63]/10 transition-all font-sans duration-300 placeholder:text-[#64748B]"
						/>
					</div>
				</div>

				{/* Address Line 1 */}
				<div className="col-span-2 flex flex-col gap-1 group">
					<label className="text-[9px] uppercase text-[#64748B] tracking-widest font-bold font-mono group-focus-within:text-[#FF2E63] transition-colors">
						Address Line 1
					</label>
					<div className="relative flex items-center">
						<MapPin
							size={12}
							className="absolute left-3.5 text-[#64748B] group-focus-within:text-[#FF2E63] transition-colors"
						/>
						<input
							type="text"
							value={profile.addressLine1}
							autoComplete="street-address"
							onChange={(e) => handleChange("addressLine1", e.target.value)}
							className="w-full bg-[rgba(5,5,10,0.55)] border border-white/6 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none hover:border-white/10 focus:border-[#FF2E63]/40 focus:ring-2 focus:ring-[#FF2E63]/10 transition-all font-sans duration-300 placeholder:text-[#64748B]"
							placeholder="eg: Selva Sannithi Murugan, Thondaimanaru"
						/>
					</div>
				</div>

				{/* Address Line 2 */}
				<div className="col-span-2 flex flex-col gap-1 group">
					<label className="text-[9px] uppercase text-[#64748B] tracking-widest font-bold font-mono group-focus-within:text-[#FF2E63] transition-colors">
						Address Line 2 (Suite, Apt)
					</label>
					<div className="relative flex items-center">
						<Compass
							size={12}
							className="absolute left-3.5 text-[#64748B] group-focus-within:text-[#FF2E63] transition-colors"
						/>
						<input
							type="text"
							value={profile.addressLine2}
							autoComplete="address-line2"
							onChange={(e) => handleChange("addressLine2", e.target.value)}
							className="w-full bg-[rgba(5,5,10,0.55)] border border-white/6 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none hover:border-white/10 focus:border-[#FF2E63]/40 focus:ring-2 focus:ring-[#FF2E63]/10 transition-all font-sans duration-300 placeholder:text-[#64748B]"
							placeholder="eg: Jaffna, Sri Lanka"
						/>
					</div>
				</div>

				{/* City */}
				<div className="flex flex-col gap-1 group col-span-1">
					<label className="text-[9px] uppercase text-[#64748B] tracking-widest font-bold font-mono group-focus-within:text-[#FF2E63] transition-colors">
						City
					</label>
					<div className="relative flex items-center">
						<Building
							size={12}
							className="absolute left-3.5 text-[#64748B] group-focus-within:text-[#FF2E63] transition-colors"
						/>
						<input
							type="text"
							value={profile.city}
							autoComplete="address-level2"
							onChange={(e) => handleChange("city", e.target.value)}
							className="w-full bg-[rgba(5,5,10,0.55)] border border-white/6 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none hover:border-white/10 focus:border-[#FF2E63]/40 focus:ring-2 focus:ring-[#FF2E63]/10 transition-all font-sans duration-300 placeholder:text-[#64748B]"
							placeholder="eg: Point Pedro"
						/>
					</div>
				</div>

				{/* ZIP Code */}
				<div className="flex flex-col gap-1 group col-span-1">
					<label className="text-[9px] uppercase text-[#64748B] tracking-widest font-bold font-mono group-focus-within:text-[#FF2E63] transition-colors">
						ZIP Code
					</label>
					<div className="relative flex items-center">
						<Hash
							size={12}
							className="absolute left-3.5 text-[#64748B] group-focus-within:text-[#FF2E63] transition-colors"
						/>
						<input
							type="text"
							value={profile.zipCode}
							autoComplete="postal-code"
							onChange={(e) => handleChange("zipCode", e.target.value)}
							className="w-full bg-[rgba(5,5,10,0.55)] border border-white/6 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none hover:border-white/10 focus:border-[#FF2E63]/40 focus:ring-2 focus:ring-[#FF2E63]/10 transition-all font-sans duration-300 placeholder:text-[#64748B]"
							placeholder="eg: 40000"
						/>
					</div>
				</div>

				{/* State */}
				<div className="flex flex-col gap-1 group col-span-1">
					<label className="text-[9px] uppercase text-[#64748B] tracking-widest font-bold font-mono group-focus-within:text-[#FF2E63] transition-colors">
						State / Province
					</label>
					<div className="relative flex items-center">
						<MapPin
							size={12}
							className="absolute left-3.5 text-[#64748B] group-focus-within:text-[#FF2E63] transition-colors"
						/>
						<input
							type="text"
							value={profile.state}
							onChange={(e) => handleChange("state", e.target.value)}
							className="w-full bg-[rgba(5,5,10,0.55)] border border-white/6 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none hover:border-white/10 focus:border-[#FF2E63]/40 focus:ring-2 focus:ring-[#FF2E63]/10 transition-all font-sans duration-300 placeholder:text-[#64748B]"
							placeholder="eg: Jaffna"
						/>
					</div>
				</div>

				{/* Country */}
				<div className="flex flex-col gap-1 group col-span-1">
					<label className="text-[9px] uppercase text-[#64748B] tracking-widest font-bold font-mono group-focus-within:text-[#FF2E63] transition-colors">
						Country
					</label>
					<div className="relative flex items-center">
						<Flag
							size={12}
							className="absolute left-3.5 text-[#64748B] group-focus-within:text-[#FF2E63] transition-colors"
						/>
						<input
							type="text"
							value={profile.country}
							autoComplete="address-level1"
							onChange={(e) => handleChange("country", e.target.value)}
							className="w-full bg-[rgba(5,5,10,0.55)] border border-white/6 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none hover:border-white/10 focus:border-[#FF2E63]/40 focus:ring-2 focus:ring-[#FF2E63]/10 transition-all font-sans duration-300 placeholder:text-[#64748B]"
							placeholder="eg: Sri Lanka"
						/>
					</div>
				</div>
			</div>

			{/* Tactile Aurora Save Button */}
			<motion.button
				onClick={handleSave}
				disabled={isPending}
				whileTap={{ scale: 0.98 }}
				className={`w-full mt-4 rounded-xl py-3 text-xs font-bold tracking-widest uppercase font-mono transition-all cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.2)] ${
					isSaved
						? "bg-[rgba(16,185,129,0.15)] border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
						: "bg-linear-to-r from-[#FF2E63] via-[#8a5cf665] to-[#FF2E63] text-white border border-transparent"
				}`}
			>
				{/* Aurora Glow Pulse backing when unsaved */}
				{!isSaved && (
					<div className="absolute inset-0 bg-linear-to-r from-[#FF2E63] via-[#8B5CF6] to-[#FF2E63] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md pointer-events-none" />
				)}

				<AnimatePresence mode="wait">
					{isPending ? (
						<motion.div
							key="loading"
							initial={{ rotate: 0, scale: 0.8 }}
							animate={{ rotate: 360, scale: 1 }}
							exit={{ opacity: 0 }}
							transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
						>
							<Loader2 size={13} className="text-[#00E0FF]" />
						</motion.div>
					) : isSaved ? (
						<motion.span
							key="saved"
							initial={{ opacity: 0, scale: 0.6 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0 }}
							transition={{ type: "spring", stiffness: 300, damping: 15 }}
							className="flex items-center gap-1.5 cursor-progress"
						>
							<Check size={12} className="animate-bounce" /> Profile Details
							Secured
						</motion.span>
					) : (
						<motion.span
							key="idle"
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -5 }}
							className="flex items-center gap-1.5 relative z-10 cursor-pointer"
						>
							<Save size={12} /> Save Form Identity
						</motion.span>
					)}
				</AnimatePresence>
			</motion.button>
		</div>
	);
};

export default ProfileSettingsView;
