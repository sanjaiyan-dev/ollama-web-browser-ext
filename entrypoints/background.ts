export default defineBackground(() => {
	browser.sidePanel
		.setPanelBehavior({ openPanelOnActionClick: true })
		.catch((error) => console.error("Error setting panel behavior:", error));
});
