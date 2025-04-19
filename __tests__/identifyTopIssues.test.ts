import { describe, expect, it } from "vitest";
import type { File } from "../src/getPrompt";
import { identifyTopIssues } from "../src/identifyTopIssues";

describe("identifyTopIssues", () => {
	it("returns empty array for empty report", () => {
		const detailedReport: File[] = [];
		const issues = identifyTopIssues(detailedReport);

		expect(issues).toEqual([]);
	});

	it("returns empty array when no issues are found", () => {
		const detailedReport: File[] = [
			{
				file: "good-file.test.ts",
				summary: "Well-written tests",
				score: 80,
				suggestions: "",
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues.length).toEqual(0);
	});

	it("identifies low scoring test files", () => {
		const detailedReport: File[] = [
			{
				file: "low-score1.test.ts",
				summary: "Poor test quality",
				score: 3,
				suggestions: "",
			},
			{
				file: "low-score2.test.ts",
				summary: "Missing assertions",
				score: 71,
				suggestions: "",
			},
			{
				file: "good-score.test.ts",
				summary: "Good test quality",
				score: 80,
				suggestions: "",
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues.length).toBe(1);
		expect(issues[0].file).toBe("low-score1.test.ts");
		expect(issues[0].score).toBe(3);
		expect(issues[0].reason).toBe("Poor test quality");
	});

	it("identifies tests that are not meaningful", () => {
		const detailedReport: File[] = [
			{
				file: "implementation.test.ts",
				summary: "Tests implementation details",
				score: 71,
				suggestions: "",
			},
			{
				file: "another-file.test.ts",
				summary: "Mixed quality",
				score: 5,
				suggestions: "Test outputs instead of internals",
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues.length).toBe(1);
		expect(issues[0].file).toBe("another-file.test.ts");
		expect(issues[0].score).toBe(5);
		expect(issues[0].reason).toBe("Mixed quality");
	});

	it("identifies both types of issues", () => {
		const detailedReport: File[] = [
			{
				file: "low-score.test.ts",
				summary: "Poor quality",
				score: 3,
				suggestions: "",
			},
			{
				file: "mixed-quality.test.ts",
				summary: "Mixed quality tests",
				score: 6,
				suggestions: "Improve test",
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues.length).toBe(2);

		expect(issues[0].file).toBe("low-score.test.ts");
		expect(issues[0].score).toBe(3);
		expect(issues[0].reason).toBe("Poor quality");

		expect(issues[1].file).toBe("mixed-quality.test.ts");
		expect(issues[1].score).toBe(6);
		expect(issues[1].reason).toBe("Mixed quality tests");
	});

	it("handles files with missing tests array", () => {
		const detailedReport: File[] = [
			{
				file: "missing-tests-array.test.ts",
				summary: "Low quality",
				score: 3,
				// @ts-expect-error Testing with missing tests array
				tests: undefined,
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues.length).toBe(1);
		expect(issues[0].file).toBe("missing-tests-array.test.ts");
		expect(issues[0].score).toBe(3);
	});

	it("limits examples to 3 per issue type", () => {
		const detailedReport: File[] = [
			{
				file: "file1.test.ts",
				summary: "Low quality 1",
				score: 2,
				suggestions: "",
			},
			{
				file: "file2.test.ts",
				summary: "Low quality 2",
				score: 3,
				suggestions: "",
			},
			{
				file: "file3.test.ts",
				summary: "Low quality 3",
				score: 4,
				suggestions: "",
			},
			{
				file: "file4.test.ts",
				summary: "Low quality 4",
				score: 1,
				suggestions: "",
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues.length).toBe(4);
	});
});
