import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { lazy, startTransition } from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import "./style.css";

import "./App.css";
import { BottomNav } from "./layout/Navigation.tsx";
import App from "./App.tsx";

const OllamaModelList = lazy(() => import("./routes/ModelLists.tsx"));
const SystemMonitor = lazy(() => import("./routes/CPUUsage.tsx"));

const root = ReactDOM.createRoot(document.getElementById("root")!);
export const queryClient = new QueryClient({
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
						<Route index element={<App />} />
						<Route path="sys-usage" element={<SystemMonitor />} />
						<Route path="models-lists" element={<OllamaModelList />} />
					</Routes>
					<BottomNav />
				</MemoryRouter>
			</QueryClientProvider>
		</React.StrictMode>,
	);
});
