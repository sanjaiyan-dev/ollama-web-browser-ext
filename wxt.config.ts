import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	react: {
		vite: {
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		},
	},
	vite: () => ({
		plugins: [tailwindcss()],
	}),
	manifest: {
		name: "Ollama Web Browser",
		permissions: ["sidePanel", "tabs", "storage"],
	},
});
