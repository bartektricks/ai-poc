/**
 * Unit tests for the action's main functionality, src/main.js
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@actions/core", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@actions/core")>();
	return {
		...actual,
		getInput: vi.fn(),
		setOutput: vi.fn(),
		setFailed: vi.fn(),
	};
});

vi.mock("../src/wait", () => ({
	wait: vi.fn(),
}));

// Import the mocked modules
import * as core from "@actions/core";
import { wait } from "../src/wait";

// Import the module being tested
import { run } from "../src/main";

describe("main.js", () => {
	beforeEach(() => {
		// Set the action's inputs as return values from core.getInput()
		vi.mocked(core.getInput).mockImplementation(() => "500");

		// Mock the wait function so that it does not actually wait
		vi.mocked(wait).mockImplementation(() => Promise.resolve("done!"));
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it("Sets the time output", async () => {
		await run();

		// Verify the time output was set
		expect(core.setOutput).toHaveBeenNthCalledWith(
			1,
			"time",
			// Simple regex to match a time string in the format HH:MM:SS
			expect.stringMatching(/^\d{2}:\d{2}:\d{2}/),
		);
	});

	it("Sets a failed status", async () => {
		// Clear the getInput mock and return an invalid value
		vi.mocked(core.getInput)
			.mockClear()
			.mockReturnValueOnce("this is not a number");

		// Clear the wait mock and return a rejected promise
		vi.mocked(wait)
			.mockClear()
			.mockRejectedValueOnce(new Error("milliseconds is not a number"));

		await run();

		// Verify that the action was marked as failed
		expect(core.setFailed).toHaveBeenNthCalledWith(
			1,
			"milliseconds is not a number",
		);
	});
});
