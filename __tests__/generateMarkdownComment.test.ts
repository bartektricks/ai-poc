import { describe, expect, it } from "vitest";
import { generateMarkdownComment } from "../src/generateMarkdownComment";
import type { File } from "../src/getPrompt";

describe("generateMarkdownComment", () => {
	it("generates basic markdown with minimal data", () => {
		const summary = {
			totalFiles: 5,
			averageScore: 75.5,
			summary: "Overall good test quality",
			topIssues: [],
		};
		const detailedReport: File[] = [];

		const markdown = generateMarkdownComment(summary, detailedReport);

		expect(markdown).toContain("# 📊 Test Quality Analysis");
		expect(markdown).toContain("## Summary");
		expect(markdown).toContain("Total Files Analyzed | 5");
		expect(markdown).toContain("Average Score | 75.5/100");
		expect(markdown).toContain("## Overall Assessment");
		expect(markdown).toContain("Overall good test quality");

		expect(markdown).not.toContain("## Top Issues");
		expect(markdown).not.toContain("## Detailed Report");
		expect(markdown).not.toContain("## Test Details");
	});

	it("includes top issues section when issues exist", () => {
		const summary = {
			totalFiles: 3,
			averageScore: 60.0,
			summary: "Average test quality",
			topIssues: [
				{
					file: "test1.ts",
					score: 3,
					reason: "Poor test coverage",
				},
				{
					file: "test2.ts",
					score: 4,
					reason: "Missing assertions",
				},
			],
		};
		const detailedReport: File[] = [];

		const markdown = generateMarkdownComment(summary, detailedReport);

		expect(markdown).toContain("## Top Issues");
		expect(markdown).toContain("### Low scoring test files (2)");
		expect(markdown).toContain("`test1.ts`");
		expect(markdown).toContain("Poor test coverage");
		expect(markdown).toContain("`test2.ts`");
		expect(markdown).toContain("Missing assertions");
	});

	it("includes detailed report section when report exists", () => {
		const summary = {
			totalFiles: 1,
			averageScore: 85.0,
			summary: "Good test quality",
			topIssues: [],
		};

		const detailedReport: File[] = [
			{
				file: "example.test.ts",
				summary: "Well-structured tests",
				score: 8.5,
				suggestions: "No improvements needed",
			},
		];

		const markdown = generateMarkdownComment(summary, detailedReport);

		expect(markdown).toContain("## Detailed Report");
		expect(markdown).toContain("`example.test.ts`");
		expect(markdown).toContain("8.5/100");
		expect(markdown).toContain("Well-structured tests");
		expect(markdown).toContain("No improvements needed");
		expect(markdown).not.toContain("## Test Details");
	});

	it("properly escapes pipe characters in text", () => {
		const summary = {
			totalFiles: 1,
			averageScore: 70.0,
			summary: "Tests with | pipe characters",
			topIssues: [
				{
					file: "pipe-test.ts",
					score: 7,
					reason: "Contains | pipe characters",
				},
			],
		};

		const detailedReport: File[] = [
			{
				file: "pipe-test.ts",
				summary: "Summary with | pipe",
				score: 7,
				suggestions: "Suggestions with | pipe",
			},
		];

		const markdown = generateMarkdownComment(summary, detailedReport);

		expect(markdown).toContain("Contains \\| pipe characters");
		expect(markdown).toContain("Summary with \\| pipe");
		expect(markdown).toContain("Suggestions with \\| pipe");
	});

	it("handles test issue examples with 'test' property", () => {
		const summary = {
			totalFiles: 1,
			averageScore: 60.0,
			summary: "Tests with issues",
			topIssues: [
				{
					file: "test-issue.ts",
					score: 60,
					reason: "testImplementationDetails: Testing internal implementation",
				},
			],
		};

		const detailedReport: File[] = [];

		const markdown = generateMarkdownComment(summary, detailedReport);

		expect(markdown).toContain(
			"testImplementationDetails: Testing internal implementation",
		);
	});
});
