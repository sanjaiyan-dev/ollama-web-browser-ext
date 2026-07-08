import type { ToolArguments } from "./basicTools";

/**
 * 1. Compose Gmail Window
 * Launches a pre-populated draft compose window in a new tab.
 */
export async function compose_gmail_window(
	args: ToolArguments["compose_gmail_window"],
): Promise<Browser.tabs.Tab> {
	const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(args.to)}&su=${encodeURIComponent(args.subject)}&body=${encodeURIComponent(args.body)}${args.cc ? `&cc=${encodeURIComponent(args.cc)}` : ""}${args.bcc ? `&bcc=${encodeURIComponent(args.bcc)}` : ""}`;
	return await browser.tabs.create({ url });
}

/**
 * 2. Schedule Google Calendar
 * Populates an event draft onto Google Calendar's web interface.
 */
export async function schedule_google_calendar(
	args: ToolArguments["schedule_google_calendar"],
): Promise<Browser.tabs.Tab> {
	const formatTime = (isoStr: string) => isoStr.replace(/[-:]/g, "");
	const datesParam = `${formatTime(args.start_datetime)}/${formatTime(args.end_datetime)}`;

	const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(args.title)}&dates=${datesParam}&details=${encodeURIComponent(args.details || "")}&location=${encodeURIComponent(args.location || "")}`;
	return await browser.tabs.create({ url });
}

/**
 * 3. Create Google Workspace File
 * Directs the browser to Google's fast-creation workspace shortcuts.
 */
export async function create_google_workspace_file(
	args: ToolArguments["create_google_workspace_file"],
): Promise<Browser.tabs.Tab> {
	const mapping = {
		document: "https://docs.new",
		spreadsheet: "https://sheets.new",
		presentation: "https://slides.new",
		form: "https://forms.new",
	} as const;
	const url = mapping[args.app_type] || "https://docs.new";
	return await browser.tabs.create({ url });
}
