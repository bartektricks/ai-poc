import core from "@actions/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig } from "../src/config";

vi.mock("@actions/core");

describe("getConfig", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns default values when inputs are not provided", () => {
		vi.mocked(core.getInput).mockImplementation((name) => {
			if (name === "openai_api_key") return "test-api-key";
			return "";
		});

		const config = getConfig();

		expect(config).toEqual({
			apiKey: "test-api-key",
			batchSize: 5,
			model: "gpt-4o-mini",
			temperature: 0.5,
			testPatterns: "**/*.test.ts",
			githubToken: undefined,
			onlyChangedFiles: true,
		});
	});

	it("rounds temperature to 1 decimal place", () => {
		vi.mocked(core.getInput).mockImplementation((name) => {
			if (name === "openai_api_key") return "test-api-key";
			return "0.555";
		});

		const config = getConfig();

		expect(config.temperature).toBe(0.6);
	});

	it("max temperature is 2", () => {
		vi.mocked(core.getInput).mockImplementation((name) => {
			if (name === "openai_api_key") return "test-api-key";
			return "2.5";
		});

		const config = getConfig();

		expect(config.temperature).toBe(2);
	});

	it("min temperature is 0", () => {
		vi.mocked(core.getInput).mockImplementation((name) => {
			if (name === "openai_api_key") return "test-api-key";
			return "-0.5";
		});

		const config = getConfig();

		expect(config.temperature).toBe(0);
	});

	it("uses custom values when provided", () => {
		vi.mocked(core.getInput).mockImplementation((name) => {
			switch (name) {
				case "openai_api_key":
					return "custom-api-key";
				case "batch_size":
					return "10";
				case "model":
					return "gpt-4";
				case "temperature":
					return "0.7";
				case "test_files":
					return "**/*.spec.ts";
				case "github_token":
					return "gh-token";
				case "only_changed_files":
					return "false";
				default:
					return "";
			}
		});

		const config = getConfig();

		expect(config).toEqual({
			apiKey: "custom-api-key",
			batchSize: 10,
			model: "gpt-4",
			temperature: 0.7,
			testPatterns: "**/*.spec.ts",
			githubToken: "gh-token",
			onlyChangedFiles: false,
		});
	});

	it("handles invalid numeric inputs", () => {
		vi.mocked(core.getInput).mockImplementation((name) => {
			switch (name) {
				case "openai_api_key":
					return "test-api-key";
				case "batch_size":
					return "not-a-number";
				case "temperature":
					return "invalid";
				default:
					return "";
			}
		});

		const config = getConfig();

		expect(config.batchSize).toBe(5);
		expect(config.temperature).toBe(0.5);
	});
});
