import React, { startTransition } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

startTransition(() => {
	root.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	);
});
