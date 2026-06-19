import { useOllamaEndPointRead } from "@/hooks/store";
import "./App.css";
import { preconnect } from "react-dom";
import { useBrowserCurrentActiveTab } from "@/hooks/query";

function App() {
	const ollamaEndPoint = useOllamaEndPointRead();
	if (ollamaEndPoint) {
		preconnect(ollamaEndPoint, { crossOrigin: "anonymous" });
	}
	console.log(browser.i18n.getUILanguage());
	const { data } = useBrowserCurrentActiveTab();
	console.log(data);
	return <>Hi</>;
}

export default App;
