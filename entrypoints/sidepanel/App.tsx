import "./App.css";
import { useOllamaListModels } from "@/hooks/query";

function App() {
	const { data } = useOllamaListModels();
	console.log(data);
	return (
		<>
			<p>{JSON.stringify(data)}</p>
		</>
	);
}

export default App;
