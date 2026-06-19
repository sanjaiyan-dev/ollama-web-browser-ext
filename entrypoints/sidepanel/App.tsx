import { useOllamaEndPointRead } from "@/hooks/store";
import "./App.css";
import { preconnect } from "react-dom";
import { useEffect } from "react";
import { useBrowserCurrentActiveTab } from "@/hooks/query";

function App() {
	const ollamaEndPoint = useOllamaEndPointRead();
	if (ollamaEndPoint) {
		preconnect(ollamaEndPoint, { crossOrigin: "anonymous" });
	}

	const { data } = useBrowserCurrentActiveTab();
	console.log(data);
	return <>Hi</>;
}

export default App;
