import { useQueries, useQuery } from "@tanstack/react-query";
import { OLLAMA_BROWSER_EXT_REACTQUERY_KEY } from ".";

export interface NewsItem {
	id: string;
	title: string;
	link: string;
	pubDate: string;
	source: string;
}

// Map human-readable topics to Google News RSS Topic IDs
export type NewsCategory = "SPORTS" | "BUSINESS" | "WORLD";

const TOPIC_URLS: Record<NewsCategory, string> = {
	SPORTS:
		"https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en",
	BUSINESS:
		"https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en", // Google clusters Finance under Business
	WORLD: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
};

export async function fetchGoogleNews(
	url: string,
	signal: AbortSignal,
	type?: string,
): Promise<NewsItem[]> {
	const response = await fetch(url, { signal });

	if (!response.ok) {
		throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
	}

	const xmlText = await response.text();
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(xmlText, "text/xml");

	const items = xmlDoc.querySelectorAll("item");

	return Array.from(items).map((item, index) => {
		const rawTitle = item.querySelector("title")?.textContent || "";
		const source = item.querySelector("source")?.textContent || "Google News";
		const title = rawTitle.replace(` - ${source}`, "").trim();

		return {
			id: `${type}-${index}-${item.querySelector("pubDate")?.textContent}`,
			title,

			link: item.querySelector("link")?.textContent || "",
			pubDate: item.querySelector("pubDate")?.textContent || "",
			source,
		};
	});
}

export function useNewsInternationalFeed() {
	browser.i18n.getUILanguage();
	return useQuery<NewsItem[], Error>({
		queryKey: [
			OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
			"useNewsInternationalFeed",
		] as const,
		queryFn: ({ signal }) =>
			fetchGoogleNews("https://news.google.com/rss", signal),
		staleTime: 1000 * 60 * 60 * 12,
		gcTime: 1000 * 60 * 60 * 5,
	});
}

export function useNewsInternationalFeeds() {
	return useQueries({
		queries: [
			{
				queryKey: [
					OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
					"useNewsInternationalFeed",
					"https://news.google.com/rss",
				] as const,
				queryFn: ({ signal }) =>
					fetchGoogleNews("https://news.google.com/rss", signal),
				staleTime: 1000 * 60 * 60 * 12,
				gcTime: 1000 * 60 * 60 * 5,
			},
		],
	});
}
