import { describe, expect, it } from "vitest";
import { getPrompt } from "../src/getPrompt";

describe("getPrompt", () => {
	it("generates an empty prompt with no test files", () => {
		const testFiles: { file: string; content: string }[] = [];
		const prompt = getPrompt(testFiles);

		expect(prompt).toContain("You are a senior software engineer.");
		expect(prompt).toContain("Evaluate the following TypeScript unit tests");
		expect(prompt).toContain("Please provide your analysis in JSON format");

		expect(prompt).not.toContain("FILE:");
	});

	it("generates a prompt with a single test file", () => {
		const testFiles = [
			{
				file: "src/example.test.ts",
				content: "test('example', () => { expect(true).toBe(true); });",
			},
		];
		const prompt = getPrompt(testFiles);

		expect(prompt).toContain("FILE: src/example.test.ts");
		expect(prompt).toContain("```typescript");
		expect(prompt).toContain(
			"test('example', () => { expect(true).toBe(true); });",
		);
		expect(prompt).toContain("```");

		expect(prompt).toContain("Summary of what it's testing.");
		expect(prompt).toContain(
			"Whether it's meaningful or just testing implementation details.",
		);
		expect(prompt).toContain("A score from 0-100 for its value.");
		expect(prompt).toContain("Suggestions if it's weak.");
	});

	it("generates a prompt with multiple test files", () => {
		const testFiles = [
			{
				file: "src/first.test.ts",
				content: "test('first test', () => { expect(1).toBe(1); });",
			},
			{
				file: "src/second.test.ts",
				content: "test('second test', () => { expect('a').toBe('a'); });",
			},
			{
				file: "src/third.test.ts",
				content: "test('third test', () => { expect(true).toBeTruthy(); });",
			},
		];
		const prompt = getPrompt(testFiles);

		expect(prompt).toContain("FILE: src/first.test.ts");
		expect(prompt).toContain(
			"test('first test', () => { expect(1).toBe(1); });",
		);

		expect(prompt).toContain("FILE: src/second.test.ts");
		expect(prompt).toContain(
			"test('second test', () => { expect('a').toBe('a'); });",
		);

		expect(prompt).toContain("FILE: src/third.test.ts");
		expect(prompt).toContain(
			"test('third test', () => { expect(true).toBeTruthy(); });",
		);
	});

	it("includes the expected JSON structure example", () => {
		const testFiles = [
			{
				file: "src/example.test.ts",
			},
		];

		// @ts-expect-error Testing with missing content
		const prompt = getPrompt(testFiles);

		expect(prompt).toContain('"files": [');
		expect(prompt).toContain('"file": "path/to/file.test.ts"');
		expect(prompt).toContain(
			'"summary": "Overall assessment of the test file"',
		);
		expect(prompt).toContain('"score": 7');
		expect(prompt).toContain(
			'"suggestions": "Any improvement suggestions if score below 70"',
		);
		expect(prompt).toContain(
			'"overallSummary": "Brief summary of all test files analyzed in this batch"',
		);
	});

	it("properly handles test files with special characters", () => {
		const testFiles = [
			{
				file: "src/special-chars.test.ts",
				content: "test('special \"quotes\" and \\backslashes\\', () => {});",
			},
		];
		const prompt = getPrompt(testFiles);

		expect(prompt).toContain(
			"test('special \"quotes\" and \\backslashes\\', () => {});",
		);
	});
});
