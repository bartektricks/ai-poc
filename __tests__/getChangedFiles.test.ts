import * as core from "@actions/core";
import * as github from "@actions/github";
import { GitHub } from "@actions/github/lib/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getChangedFiles } from "../src/getChangedFiles";

// Mock the @actions/github module
vi.mock("@actions/github", () => ({
	getOctokit: vi.fn().mockReturnValue({
		rest: {
			pulls: {
				listFiles: {
					endpoint: {
						merge: vi.fn().mockReturnValue("merged-options"),
					},
				},
			},
		},
		paginate: vi.fn(),
	}),
	context: {
		repo: {
			owner: "test-owner",
			repo: "test-repo",
		},
		payload: {
			pull_request: {
				number: 123,
			},
		},
	},
}));

// Mock the @actions/core module
vi.mock("@actions/core", () => ({
	info: vi.fn(),
	warning: vi.fn(),
	error: vi.fn(),
}));

describe("getChangedFiles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it("returns empty array when not in PR context", async () => {
		// Create a modified context for this test case only
		const originalContext = { ...github.context };
		const modifiedContext = {
			...originalContext,
			payload: { ...originalContext.payload, pull_request: undefined },
		};

		// Temporarily replace the context
		Object.defineProperty(github, "context", {
			value: modifiedContext,
			configurable: true,
		});

		const result = await getChangedFiles("fake-token");

		// Restore original context
		Object.defineProperty(github, "context", {
			value: originalContext,
			configurable: true,
		});

		expect(result).toEqual([]);
		expect(core.warning).toHaveBeenCalledWith(
			"This action is not running in a pull request context. No changed files will be returned.",
		);
	});

	it("fetches changed files in a PR", async () => {
		// Setup mock response
		const mockFiles = [
			{ filename: "file1.ts" },
			{ filename: "file2.ts" },
			{ filename: "file3.ts" },
		];

		vi.mocked(github.getOctokit).mockReturnValue({
			rest: {
				pulls: {
					listFiles: {
						endpoint: {
							merge: vi.fn().mockReturnValue("merged-options"),
						},
					},
				},
			},
			paginate: vi.fn().mockResolvedValue(mockFiles),
		} as unknown as InstanceType<typeof GitHub>);

		const result = await getChangedFiles("fake-token");

		expect(result).toEqual(["file1.ts", "file2.ts", "file3.ts"]);
		expect(core.info).toHaveBeenCalledWith(
			"Getting changed files for PR #123 in test-owner/test-repo",
		);
		expect(core.info).toHaveBeenCalledWith("Found 3 changed files in the PR");
	});

	it("filters out invalid file objects", async () => {
		// Setup mock response with some invalid objects
		const mockFiles = [
			{ filename: "file1.ts" },
			null, // Invalid
			{ wrongProperty: "not-a-filename" }, // Invalid
			{ filename: "file2.ts" },
			undefined, // Invalid
			{ filename: 123 }, // Invalid - not a string
		];

		vi.mocked(github.getOctokit).mockReturnValue({
			rest: {
				pulls: {
					listFiles: {
						endpoint: {
							merge: vi.fn().mockReturnValue("merged-options"),
						},
					},
				},
			},
			paginate: vi.fn().mockResolvedValue(mockFiles),
		} as unknown as InstanceType<typeof GitHub>);

		const result = await getChangedFiles("fake-token");

		expect(result).toEqual(["file1.ts", "file2.ts"]);
	});

	it("handles errors gracefully", async () => {
		// Setup mock to throw an error
		vi.mocked(github.getOctokit).mockReturnValue({
			rest: {
				pulls: {
					listFiles: {
						endpoint: {
							merge: vi.fn().mockReturnValue("merged-options"),
						},
					},
				},
			},
			paginate: vi.fn().mockRejectedValue(new Error("API error")),
		} as unknown as InstanceType<typeof GitHub>);

		const result = await getChangedFiles("fake-token");

		expect(result).toEqual([]);
		expect(core.warning).toHaveBeenCalledWith(
			"Error getting changed files: API error",
		);
	});
});
