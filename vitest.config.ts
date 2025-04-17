import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["./__tests__/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json-summary"],
		},
	},
});
