import { useQueries, useQuery } from "@tanstack/react-query";
import { OLLAMA_BROWSER_EXT_REACTQUERY_KEY } from ".";
import { preconnect, prefetchDNS } from "react-dom";
import DOMPurify from "dompurify";
export interface NewsItem {
	id: string;
	title: string;
	link: string;
	pubDate: string;
	source: string;
}

// Map human-readable topics to Google News RSS Topic IDs

const NEWS_URLS = {
	GOOGLE_NEWS: "https://news.google.com/rss",
	YAHOO_NEWS: "https://news.yahoo.com/rss/world",
	BBC_TECH_NEWS: "https://feeds.bbci.co.uk/news/technology/rss.xml",
} as const;

async function fetchXmlDoc(
	url: string,
	signal?: AbortSignal,
): Promise<Document> {
	const response = await fetch(url, { signal });
	if (!response.ok) {
		throw new Error(
			`Failed to fetch RSS feed (${response.status}): ${response.statusText}`,
		);
	}

	const xmlText = await response.text();
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(xmlText, "text/xml");

	const parserError = xmlDoc.querySelector("parsererror");
	if (parserError) {
		throw new Error(
			`Failed to parse RSS XML: ${parserError.textContent || "Unknown parser error"}`,
		);
	}

	return xmlDoc;
}

export interface RelatedArticle {
	title: string;
	link: string;
	source: string;
}

export interface NewsItem {
	id: string;
	title: string;
	link: string;
	pubDate: string;
	source: string;
	sourceUrl?: string;
	descHTML: string; // Option A: Raw HTML snippet of related coverage
}

export async function fetchGoogleNews(
	url: string,
	signal: AbortSignal,
	type?: string,
): Promise<NewsItem[]> {
	const xmlDoc = await fetchXmlDoc(url, signal);

	const items = xmlDoc.querySelectorAll("item");

	return Array.from(items).map((item, index) => {
		const rawTitle = item.querySelector("title")?.textContent?.trim() || "";
		const link = item.querySelector("link")?.textContent?.trim() || "";
		const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";
		const guid = item.querySelector("guid")?.textContent?.trim() || "";

		const sourceEl = item.querySelector("source");
		const source = sourceEl?.textContent?.trim() || "Google News";
		const sourceUrl = sourceEl?.getAttribute("url")?.trim() || undefined;

		const titleSuffix = ` - ${source}`;
		const title = rawTitle.endsWith(titleSuffix)
			? rawTitle.slice(0, -titleSuffix.length).trim()
			: rawTitle;

		const id = guid || `${type || "news"}-${index}-${pubDate}`;

		const descEl = item.querySelector("description");
		const descriptionHtml =
			descEl?.innerHTML?.trim() || descEl?.textContent?.trim() || "";

		const descHTML = DOMPurify.sanitize(descriptionHtml).trim();
		return {
			id,
			title,
			link,
			pubDate,
			source,
			sourceUrl,
			descHTML,
		};
	});
}

export interface YahooNewsItem {
	id: string;
	title: string;
	link: string;
	pubDate: string;
	source: string;
	sourceUrl?: string;
	imageUrl?: string;
	imageWidth?: number;
	imageHeight?: number;
}

export async function fetchYahooNews(
	url: string,
	signal: AbortSignal,
	type?: string,
): Promise<YahooNewsItem[]> {
	const xmlDoc = await fetchXmlDoc(url, signal);

	const items = xmlDoc.querySelectorAll("item");
	const mediaNS = "http://search.yahoo.com/mrss/"; // Yahoo's media namespace URI

	return Array.from(items).map((item, index) => {
		const rawTitle = item.querySelector("title")?.textContent?.trim() || "";
		const link = item.querySelector("link")?.textContent?.trim() || "";
		const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";
		const guid = item.querySelector("guid")?.textContent?.trim() || "";

		const sourceEl = item.querySelector("source");
		const source = sourceEl?.textContent?.trim() || "Yahoo News";
		const sourceUrl = sourceEl?.getAttribute("url")?.trim() || undefined;

		// Clean up title suffix (failsafe in case Yahoo appends " - Source Name")
		const titleSuffix = ` - ${source}`;
		const title = rawTitle.endsWith(titleSuffix)
			? rawTitle.slice(0, -titleSuffix.length).trim()
			: rawTitle;

		// Use <guid> if available, otherwise generate a key
		const id = guid || `${type || "yahoo"}-${index}-${pubDate}`;

		// --- NAMESPACE-SAFE MEDIA EXTRACTION ---
		let imageUrl: string | undefined = undefined;
		let imageWidth: number | undefined = undefined;
		let imageHeight: number | undefined = undefined;

		const mediaContent = item.getElementsByTagNameNS(mediaNS, "content")[0];
		if (mediaContent) {
			imageUrl = mediaContent.getAttribute("url")?.trim() || undefined;

			const widthAttr = mediaContent.getAttribute("width");
			const heightAttr = mediaContent.getAttribute("height");

			if (widthAttr) imageWidth = parseInt(widthAttr, 10);
			if (heightAttr) imageHeight = parseInt(heightAttr, 10);
		}

		return {
			id,
			title,
			link,
			pubDate,
			source,
			sourceUrl,
			imageUrl,
			imageWidth,
			imageHeight,
		};
	});
}

export interface BbcNewsItem {
	id: string;
	title: string;
	description: string;
	link: string;
	rawLink: string;
	pubDate: string;
	source: string;
	imageUrl?: string;
	imageWidth?: number;
	imageHeight?: number;
}

export async function fetchBbcTechNews(
	url: string,
	signal: AbortSignal,
	type?: string,
): Promise<BbcNewsItem[]> {
	const xmlDoc = await fetchXmlDoc(url, signal);

	const items = xmlDoc.querySelectorAll("item");
	const mediaNS = "http://search.yahoo.com/mrss/"; // Media namespace URI

	return Array.from(items).map((item, index) => {
		const title = item.querySelector("title")?.textContent?.trim() || "";
		const description =
			item.querySelector("description")?.textContent?.trim() || "";
		const guid = item.querySelector("guid")?.textContent?.trim() || "";
		const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";

		const rawLink = item.querySelector("link")?.textContent?.trim() || "";
		const link = rawLink.split("?")[0] || rawLink;

		const id = guid || `${type || "bbc"}-${index}-${pubDate}`;

		let imageUrl: string | undefined = undefined;
		let imageWidth: number | undefined = undefined;
		let imageHeight: number | undefined = undefined;

		const thumbnailEl = item.getElementsByTagNameNS(mediaNS, "thumbnail")[0];
		if (thumbnailEl) {
			imageUrl = thumbnailEl.getAttribute("url")?.trim() || undefined;

			const widthAttr = thumbnailEl.getAttribute("width");
			const heightAttr = thumbnailEl.getAttribute("height");

			if (widthAttr) imageWidth = parseInt(widthAttr, 10);
			if (heightAttr) imageHeight = parseInt(heightAttr, 10);
		}

		return {
			id,
			title,
			description,
			link,
			rawLink,
			pubDate,
			source: "BBC News",
			imageUrl,
			imageWidth,
			imageHeight,
		};
	});
}

export function useNewsInternationalFeed() {
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
	preconnect("https://news.google.com/rss");
	preconnect("https://news.yahoo.com/rss/world");
	preconnect("https://feeds.bbci.co.uk/news/technology/rss.xml");
	preconnect("https://feeds.bbci.co.uk/news/world/rss.xml");
	preconnect(
		"https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664",
	);
	preconnect(
		"https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839069",
	);
	return useQueries({
		queries: [
			{
				queryKey: [
					OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
					"useNewsInternationalFeed",
					NEWS_URLS["GOOGLE_NEWS"],
				] as const,
				queryFn: ({ signal }) =>
					fetchGoogleNews(NEWS_URLS["GOOGLE_NEWS"], signal),
				staleTime: 1000 * 60 * 60 * 12,
				gcTime: 1000 * 60 * 60 * 5,
			},
			{
				queryKey: [
					OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
					"useNewsInternationalFeed",
					NEWS_URLS["YAHOO_NEWS"],
				] as const,
				queryFn: ({ signal }) =>
					fetchGoogleNews(NEWS_URLS["YAHOO_NEWS"], signal),
				staleTime: 1000 * 60 * 60 * 12,
				gcTime: 1000 * 60 * 60 * 5,
			},
			{
				queryKey: [
					OLLAMA_BROWSER_EXT_REACTQUERY_KEY,
					"useNewsInternationalFeed",
					NEWS_URLS["BBC_TECH_NEWS"],
				] as const,
				queryFn: ({ signal }) =>
					fetchGoogleNews(NEWS_URLS["BBC_TECH_NEWS"], signal),
				staleTime: 1000 * 60 * 60 * 12,
				gcTime: 1000 * 60 * 60 * 5,
			},
		],
	});
}
