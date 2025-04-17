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
				score: 8,
				tests: [
					{
						name: "test1",
						summary: "Good test",
						meaningful: true,
						score: 9,
						suggestions: "",
					},
					{
						name: "test2",
						summary: "Another good test",
						meaningful: true,
						score: 7,
						suggestions: "",
					},
				],
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues).toEqual([]);
	});

	it("identifies low scoring test files", () => {
		const detailedReport: File[] = [
			{
				file: "low-score1.test.ts",
				summary: "Poor test quality",
				score: 3,
				tests: [],
			},
			{
				file: "low-score2.test.ts",
				summary: "Missing assertions",
				score: 4,
				tests: [],
			},
			{
				file: "good-score.test.ts",
				summary: "Good test quality",
				score: 8,
				tests: [],
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues.length).toBe(1);
		expect(issues[0].type).toBe("Low scoring test files");
		expect(issues[0].count).toBe(2);
		expect(issues[0].examples.length).toBe(2);
		expect(issues[0].examples).toContainEqual({
			file: "low-score1.test.ts",
			score: 3,
			reason: "Poor test quality",
		});
		expect(issues[0].examples).toContainEqual({
			file: "low-score2.test.ts",
			score: 4,
			reason: "Missing assertions",
		});
	});

	it("identifies tests that are not meaningful", () => {
		const detailedReport: File[] = [
			{
				file: "implementation.test.ts",
				summary: "Tests implementation details",
				score: 6,
				tests: [
					{
						name: "test1",
						summary: "Tests implementation details",
						meaningful: false,
						score: 4,
						suggestions: "Focus on behavior, not implementation",
					},
					{
						name: "test2",
						summary: "Good test",
						meaningful: true,
						score: 8,
						suggestions: "",
					},
				],
			},
			{
				file: "another-file.test.ts",
				summary: "Mixed quality",
				score: 5,
				tests: [
					{
						name: "test3",
						summary: "Tests internal state",
						meaningful: false,
						score: 3,
						suggestions: "Test outputs instead of internals",
					},
				],
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues.length).toBe(1);
		expect(issues[0].type).toBe("Tests of implementation details");
		expect(issues[0].count).toBe(2);
		expect(issues[0].examples.length).toBe(2);
		expect(issues[0].examples).toContainEqual({
			file: "implementation.test.ts",
			test: "test1",
			reason: "Tests implementation details",
		});
		expect(issues[0].examples).toContainEqual({
			file: "another-file.test.ts",
			test: "test3",
			reason: "Tests internal state",
		});
	});

	it("identifies both types of issues", () => {
		const detailedReport: File[] = [
			{
				file: "low-score.test.ts",
				summary: "Poor quality",
				score: 3,
				tests: [],
			},
			{
				file: "mixed-quality.test.ts",
				summary: "Mixed quality tests",
				score: 6,
				tests: [
					{
						name: "bad-test",
						summary: "Tests implementation details",
						meaningful: false,
						score: 4,
						suggestions: "Improve test",
					},
				],
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues.length).toBe(2);

		// First issue type: Low scoring files
		expect(issues[0].type).toBe("Low scoring test files");
		expect(issues[0].count).toBe(1);
		expect(issues[0].examples.length).toBe(1);

		// Second issue type: Tests of implementation details
		expect(issues[1].type).toBe("Tests of implementation details");
		expect(issues[1].count).toBe(1);
		expect(issues[1].examples.length).toBe(1);
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
		expect(issues[0].type).toBe("Low scoring test files");
		expect(issues[0].count).toBe(1);
	});

	it("limits examples to 3 per issue type", () => {
		const detailedReport: File[] = [
			{
				file: "file1.test.ts",
				summary: "Low quality 1",
				score: 2,
				tests: [],
			},
			{
				file: "file2.test.ts",
				summary: "Low quality 2",
				score: 3,
				tests: [],
			},
			{
				file: "file3.test.ts",
				summary: "Low quality 3",
				score: 4,
				tests: [],
			},
			{
				file: "file4.test.ts",
				summary: "Low quality 4",
				score: 1,
				tests: [],
			},
		];

		const issues = identifyTopIssues(detailedReport);

		expect(issues[0].count).toBe(4);
		// Should only include 3 examples even though there are 4 low scoring files
		expect(issues[0].examples.length).toBe(3);
	});
});
