import { describe, expect, it } from "vitest";
import { calculateAverageScore } from "../src/calculateAverageScore";
import type { File } from "../src/getPrompt";

describe("calculateAverageScore", () => {
	it("returns 0 for an empty array", () => {
		expect(calculateAverageScore([])).toBe(0);
	});

	it("calculates the correct average for a single file", () => {
		const mockFile: File = {
			file: "test.ts",
			summary: "Test summary",
			score: 5,
			tests: [],
		};

		expect(calculateAverageScore([mockFile])).toBe(50);
	});

	it("calculates the correct average for multiple files", () => {
		const mockFiles: File[] = [
			{
				file: "test1.ts",
				summary: "Test summary 1",
				score: 3,
				tests: [],
			},
			{
				file: "test2.ts",
				summary: "Test summary 2",
				score: 7,
				tests: [],
			},
			{
				file: "test3.ts",
				summary: "Test summary 3",
				score: 5,
				tests: [],
			},
		];

		expect(calculateAverageScore(mockFiles)).toBe(50);
	});

	it("handles files with missing scores by treating them as 0", () => {
		const mockFiles: File[] = [
			{
				file: "test1.ts",
				summary: "Test summary 1",
				score: 6,
				tests: [],
			},
			{
				file: "test2.ts",
				summary: "Test summary 2",
				score: 0,
				tests: [],
			},
			{
				file: "test3.ts",
				summary: "Test summary 3",
				// @ts-expect-error Testing missing score
				score: undefined,
				tests: [],
			},
		];

		// Average: (6 + 0 + 0) / 3 = 2, then * 10 = 20
		expect(calculateAverageScore(mockFiles)).toBe(20);
	});
});
