import { startTransition, useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";
import "./App.css";
import { useOllamaListModels } from "@/hooks/query";

function App() {
	const { data } = useOllamaListModels();
	console.log(data);
	return <></>;
}

export default App;
