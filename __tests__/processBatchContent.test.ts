import path from "path";
import { readFile } from "fs/promises";
import { vi } from "vitest";
import { processBatchContent } from "../src/processBatchContent";

vi.mock("fs/promises");
vi.mock("path");
vi.mock("openai");
vi.mock("../src/getPrompt");

describe("processBatchContent", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("processes batch content correctly", async () => {
		vi.mocked(readFile).mockResolvedValueOnce(
			"import { test } from 'vitest'; test('something', () => {});",
		);
		vi.mocked(readFile).mockResolvedValueOnce(
			"import { describe } from 'vitest'; describe('module', () => {});",
		);
		vi.mocked(path.relative).mockReturnValue("relative/path/to/file");

		const batch = ["file1.test.ts", "file2.test.ts"];
		const result = await processBatchContent(batch);

		expect(readFile).toHaveBeenCalledTimes(2);
		expect(readFile).toHaveBeenCalledWith("file1.test.ts", "utf-8");
		expect(readFile).toHaveBeenCalledWith("file2.test.ts", "utf-8");

		expect(result[0].content).not.toContain("import { test } from 'vitest';");
		expect(result[1].content).not.toContain(
			"import { describe } from 'vitest';",
		);

		expect(path.relative).toHaveBeenCalledTimes(2);
		expect(result[0].file).toBe("relative/path/to/file");
		expect(result[1].file).toBe("relative/path/to/file");
	});
});
