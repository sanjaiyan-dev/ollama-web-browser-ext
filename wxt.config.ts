import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	vite: () => ({
		plugins: [
			tailwindcss(),
			babel({
				presets: [reactCompilerPreset()],
			}),
		],
	}),
	manifest: {
		name: "Ollama Web Browser",
		permissions: [
			"sidePanel",
			"tabs",
			"storage",
			"system.cpu",
			"system.memory",
			"scripting",
			"activeTab",
		],
		host_permissions: ["http://localhost/*", "<all_urls>"],
	},
});
