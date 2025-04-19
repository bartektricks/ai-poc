import path from "path";
import core from "@actions/core";
import glob from "@actions/glob";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findTestFiles } from "../src/findTestFiles";
import { getChangedFiles } from "../src/getChangedFiles";

vi.mock("@actions/glob");
vi.mock("@actions/core");
vi.mock("../src/getChangedFiles");
vi.mock("node:path");

describe("findTestFiles", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("finds all test files when not filtering by changed files", async () => {
		const mockGlobber = {
			glob: vi
				.fn()
				.mockResolvedValue([
					"/workspace/src/file1.test.ts",
					"/workspace/src/file2.test.ts",
				]),
			getSearchPaths: vi.fn().mockResolvedValue([]),
			globGenerator: vi.fn(),
		};
		vi.mocked(glob.create).mockResolvedValue(mockGlobber);
		vi.mocked(core.info).mockImplementation(vi.fn());

		const testFiles = await findTestFiles("**/*.test.ts", false);

		expect(glob.create).toHaveBeenCalledWith(
			expect.stringContaining("**/*.test.ts"),
		);

		expect(testFiles).toEqual([
			"/workspace/src/file1.test.ts",
			"/workspace/src/file2.test.ts",
		]);
	});

	it("filters test files when using onlyChangedFiles", async () => {
		const mockGlobber = {
			glob: vi
				.fn()
				.mockResolvedValue([
					"/workspace/src/file1.test.ts",
					"/workspace/src/file2.test.ts",
					"/workspace/src/file3.test.ts",
				]),
			getSearchPaths: vi.fn().mockResolvedValue([]),
			globGenerator: vi.fn(),
		};
		vi.mocked(glob.create).mockResolvedValue(mockGlobber);
		vi.mocked(getChangedFiles).mockResolvedValue([
			"/workspace/src/file1.test.ts",
			"/workspace/src/otherfile.ts",
		]);

		vi.mocked(path.relative).mockImplementation((_, filePath) => {
			return filePath.replace("/workspace/", "");
		});

		vi.mocked(core.info).mockImplementation(vi.fn());

		const testFiles = await findTestFiles("**/*.test.ts", true, "token");

		expect(glob.create).toHaveBeenCalledWith(
			expect.stringContaining("**/*.test.ts"),
		);

		expect(getChangedFiles).toHaveBeenCalledWith("token");

		expect(testFiles).toHaveLength(1);
		expect(testFiles).toContain("/workspace/src/file1.test.ts");
	});

	it("combines multiple test patterns", async () => {
		const mockGlobber = {
			glob: vi
				.fn()
				.mockResolvedValue([
					"/workspace/src/file1.test.ts",
					"/workspace/src/file2.spec.js",
				]),
			getSearchPaths: vi.fn().mockResolvedValue([]),
			globGenerator: vi.fn(),
		};
		vi.mocked(glob.create).mockResolvedValue(mockGlobber);
		vi.mocked(core.info).mockImplementation(vi.fn());

		await findTestFiles("**/*.test.ts **/*.spec.js", false);

		expect(glob.create).toHaveBeenCalledWith(
			expect.stringContaining("**/*.test.ts"),
		);
		expect(glob.create).toHaveBeenCalledWith(
			expect.stringContaining("**/*.spec.js"),
		);
	});

	it("excludes node_modules, dist, and build directories", async () => {
		const mockGlobber = {
			glob: vi.fn().mockResolvedValue([]),
			getSearchPaths: vi.fn().mockResolvedValue([]),
			globGenerator: vi.fn(),
		};
		vi.mocked(glob.create).mockResolvedValue(mockGlobber);
		vi.mocked(core.info).mockImplementation(vi.fn());

		await findTestFiles("**/*.test.ts", false);

		expect(glob.create).toHaveBeenCalledWith(
			expect.stringContaining("!**/node_modules/**"),
		);
		expect(glob.create).toHaveBeenCalledWith(
			expect.stringContaining("!**/dist/**"),
		);
		expect(glob.create).toHaveBeenCalledWith(
			expect.stringContaining("!**/build/**"),
		);
	});
});
