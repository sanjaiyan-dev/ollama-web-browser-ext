import { useEffect, useState } from "react";
import { browser } from "#imports";

export interface ActiveTabState {
	id: number;
	url: string;
}

type OnActivatedListener = Parameters<
	typeof browser.tabs.onActivated.addListener
>[0];
type TabActiveInfo = Parameters<OnActivatedListener>[0];

type OnUpdatedListener = Parameters<
	typeof browser.tabs.onUpdated.addListener
>[0];
type TabChangeInfo = Parameters<OnUpdatedListener>[1];
type TabType = Parameters<OnUpdatedListener>[2];

export function useActiveTab() {
	const [activeTab, setActiveTab] = useState<ActiveTabState | null>(null);

	useEffect(() => {
		const initTab = async () => {
			try {
				const [tab] = await browser.tabs.query({
					active: true,
					lastFocusedWindow: true,
				});
				if (tab?.id && tab?.url) {
					setActiveTab({ id: tab.id, url: tab.url });
				}
			} catch (err) {
				console.error("Error fetching initial active tab:", err);
			}
		};
		initTab();

		const handleActivated = async (activeInfo: TabActiveInfo) => {
			try {
				const tab = await browser.tabs.get(activeInfo.tabId);
				if (tab.active && tab.id && tab.url) {
					setActiveTab({ id: tab.id, url: tab.url });
				}
			} catch (err) {
				console.warn("Could not read activated tab metadata:", err);
			}
		};

		const handleUpdated = (
			_tabId: number,
			changeInfo: TabChangeInfo,
			tab: TabType,
		) => {
			if (tab.active && changeInfo.status === "complete" && tab.id && tab.url) {
				setActiveTab({ id: tab.id, url: tab.url });
			}
		};

		browser.tabs.onActivated.addListener(handleActivated);
		browser.tabs.onUpdated.addListener(handleUpdated);

		return () => {
			browser.tabs.onActivated.removeListener(handleActivated);
			browser.tabs.onUpdated.removeListener(handleUpdated);
		};
	}, []);

	return activeTab;
}
