import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { startTransition } from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import "./style.css";
import OllamaSidePanel from "./routes/ModelLists.tsx";
import "./App.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			networkMode: "always",
		},
		mutations: {
			networkMode: "always",
		},
	},
});
startTransition(() => {
	root.render(
		<React.StrictMode>
			<QueryClientProvider client={queryClient}>
				<MemoryRouter useTransitions={true}>
					<Routes>
						<Route index element={<OllamaSidePanel />} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>
		</React.StrictMode>,
	);
});
