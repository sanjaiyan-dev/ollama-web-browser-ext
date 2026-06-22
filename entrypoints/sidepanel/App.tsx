import { useOllamaEndPointRead } from "@/hooks/store";
import "./App.css";
import { preconnect } from "react-dom";

function App() {
	const ollamaEndPoint = useOllamaEndPointRead();
	if (ollamaEndPoint) {
		preconnect(ollamaEndPoint, { crossOrigin: "anonymous" });
	}
	return <>Hi</>;
}

export default App;
