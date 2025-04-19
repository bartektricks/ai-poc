import { beforeEach, describe, expect, it, vi } from "vitest";

import type OpenAI from "openai";
import type { File } from "../src/getPrompt";
import { processBatchContent } from "../src/processBatchContent";
import { processBatches } from "../src/processBatches";
import { processOpenAIResponse } from "../src/processOpenAIResponse";

vi.mock("../src/processBatchContent");
vi.mock("../src/processOpenAIResponse");

describe("processBatches", () => {
	const mockOpenAI = {} as OpenAI;
	const model = "gpt-4";
	const temperature = 0.7;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should process files in correct batch sizes", async () => {
		const testFiles = [
			"file1.ts",
			"file2.ts",
			"file3.ts",
			"file4.ts",
			"file5.ts",
		];
		const batchSize = 2;

		const mockBatchContent1 = [
			{ file: "file1.ts", content: "content1" },
			{ file: "file2.ts", content: "content2" },
		];
		const mockBatchContent2 = [
			{ file: "file3.ts", content: "content3" },
			{ file: "file4.ts", content: "content4" },
		];
		const mockBatchContent3 = [{ file: "file5.ts", content: "content5" }];

		vi.mocked(processBatchContent)
			.mockResolvedValueOnce(mockBatchContent1)
			.mockResolvedValueOnce(mockBatchContent2)
			.mockResolvedValueOnce(mockBatchContent3);

		const mockResult1 = {
			files: [
				{ file: "file1.ts", summary: "summary1" },
				{ file: "file2.ts", summary: "summary2" },
			] as File[],
			overallSummary: "overallSummary1",
		};
		const mockResult2 = {
			files: [
				{ file: "file3.ts", summary: "summary3" },
				{ file: "file4.ts", summary: "summary4" },
			] as File[],
			overallSummary: "overallSummary2",
		};
		const mockResult3 = {
			files: [{ file: "file5.ts", summary: "summary5" }] as File[],
			overallSummary: "overallSummary3",
		};

		vi.mocked(processOpenAIResponse)
			.mockResolvedValueOnce(mockResult1)
			.mockResolvedValueOnce(mockResult2)
			.mockResolvedValueOnce(mockResult3);

		const result = await processBatches(
			testFiles,
			batchSize,
			model,
			temperature,
			mockOpenAI,
		);

		expect(processBatchContent).toHaveBeenCalledTimes(3);
		expect(processBatchContent).toHaveBeenNthCalledWith(1, [
			"file1.ts",
			"file2.ts",
		]);
		expect(processBatchContent).toHaveBeenNthCalledWith(2, [
			"file3.ts",
			"file4.ts",
		]);
		expect(processBatchContent).toHaveBeenNthCalledWith(3, ["file5.ts"]);

		expect(processOpenAIResponse).toHaveBeenCalledTimes(3);
		expect(processOpenAIResponse).toHaveBeenNthCalledWith(
			1,
			mockBatchContent1,
			model,
			temperature,
			mockOpenAI,
		);
		expect(processOpenAIResponse).toHaveBeenNthCalledWith(
			2,
			mockBatchContent2,
			model,
			temperature,
			mockOpenAI,
		);
		expect(processOpenAIResponse).toHaveBeenNthCalledWith(
			3,
			mockBatchContent3,
			model,
			temperature,
			mockOpenAI,
		);

		expect(result).toEqual({
			overallSummary: ["overallSummary1", "overallSummary2", "overallSummary3"],
			detailedReport: [
				{ file: "file1.ts", summary: "summary1" },
				{ file: "file2.ts", summary: "summary2" },
				{ file: "file3.ts", summary: "summary3" },
				{ file: "file4.ts", summary: "summary4" },
				{ file: "file5.ts", summary: "summary5" },
			],
		});
	});

	it("should handle empty results correctly", async () => {
		const testFiles = ["file1.ts", "file2.ts"];
		const batchSize = 2;

		vi.mocked(processBatchContent).mockResolvedValueOnce([
			{ file: "file1.ts", content: "content1" },
			{ file: "file2.ts", content: "content2" },
		]);
		vi.mocked(processOpenAIResponse).mockResolvedValueOnce({});

		const result = await processBatches(
			testFiles,
			batchSize,
			model,
			temperature,
			mockOpenAI,
		);

		expect(result).toEqual({
			overallSummary: [],
			detailedReport: [],
		});
	});
});
