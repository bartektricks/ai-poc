import core from "@actions/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateAverageScore } from "../src/calculateAverageScore";
import { generateMarkdownComment } from "../src/generateMarkdownComment";
import {
	FinalSummary,
	generateSummary,
	outputResults,
} from "../src/generateReport";
import type { File } from "../src/getPrompt";
import { identifyTopIssues } from "../src/identifyTopIssues";
import { postCommentToPR } from "../src/postCommentToPr";

vi.mock("../src/calculateAverageScore");
vi.mock("../src/generateMarkdownComment");
vi.mock("../src/identifyTopIssues");
vi.mock("../src/postCommentToPr");
vi.mock("@actions/core");

describe("generateSummary", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("generates a summary correctly", () => {
		const mockTestFiles = ["file1.test.ts", "file2.test.ts"];
		const mockOverallSummary = ["Good tests", "Average test quality"];
		const mockDetailedReport: File[] = [
			{
				file: "file1.test.ts",
				summary: "Good test",
				score: 80,
				suggestions: "",
			},
			{
				file: "file2.test.ts",
				summary: "OK test",
				score: 60,
				suggestions: "Add more assertions",
			},
		];

		vi.mocked(calculateAverageScore).mockReturnValue(70);
		vi.mocked(identifyTopIssues).mockReturnValue([
			{ file: "file2.test.ts", score: 60, reason: "OK test" },
		]);

		const result = generateSummary(
			mockTestFiles,
			mockOverallSummary,
			mockDetailedReport,
		);

		expect(calculateAverageScore).toHaveBeenCalledWith(mockDetailedReport);
		expect(identifyTopIssues).toHaveBeenCalledWith(mockDetailedReport);

		expect(result).toEqual({
			totalFiles: 2,
			averageScore: 70,
			summary: "Good tests Average test quality",
			topIssues: [{ file: "file2.test.ts", score: 60, reason: "OK test" }],
		});
	});

	it("handles empty inputs", () => {
		const mockTestFiles: string[] = [];
		const mockOverallSummary: string[] = [];
		const mockDetailedReport: File[] = [];

		vi.mocked(calculateAverageScore).mockReturnValue(0);
		vi.mocked(identifyTopIssues).mockReturnValue([]);

		const result = generateSummary(
			mockTestFiles,
			mockOverallSummary,
			mockDetailedReport,
		);

		expect(result).toEqual({
			totalFiles: 0,
			averageScore: 0,
			summary: "",
			topIssues: [],
		});
	});
});

describe("outputResults", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("outputs results without posting to PR when no token is provided", async () => {
		const mockFinalSummary: FinalSummary = {
			totalFiles: 2,
			averageScore: 75,
			summary: "Good test quality",
			topIssues: [
				{ file: "file.test.ts", score: 65, reason: "Needs improvement" },
			],
		};

		const mockDetailedReport: File[] = [
			{ file: "file1.test.ts", summary: "Good", score: 85, suggestions: "" },
			{
				file: "file2.test.ts",
				summary: "OK",
				score: 65,
				suggestions: "Add more assertions",
			},
		];

		vi.mocked(generateMarkdownComment).mockReturnValue("# Test Report");
		vi.mocked(core.info).mockImplementation(vi.fn());
		vi.mocked(core.setOutput).mockImplementation(vi.fn());

		await outputResults(mockFinalSummary, mockDetailedReport);

		expect(generateMarkdownComment).toHaveBeenCalledWith(
			mockFinalSummary,
			mockDetailedReport,
		);
		expect(postCommentToPR).not.toHaveBeenCalled();

		expect(core.setOutput).toHaveBeenCalledWith("summary", mockFinalSummary);
		expect(core.setOutput).toHaveBeenCalledWith(
			"detailed_report",
			mockDetailedReport,
		);
		expect(core.setOutput).toHaveBeenCalledWith(
			"markdown_comment",
			"# Test Report",
		);

		expect(core.info).toHaveBeenCalledWith("Analysis complete!");
		expect(core.info).toHaveBeenCalledWith(
			`Total files analyzed: ${mockFinalSummary.totalFiles}`,
		);
		expect(core.info).toHaveBeenCalledWith(
			`Average score: ${mockFinalSummary.averageScore}/100`,
		);
		expect(core.info).toHaveBeenCalledWith(
			`Summary: ${mockFinalSummary.summary}`,
		);
	});

	it("posts to PR when token is provided", async () => {
		const mockFinalSummary: FinalSummary = {
			totalFiles: 1,
			averageScore: 80,
			summary: "Excellent test quality",
			topIssues: [],
		};

		const mockDetailedReport: File[] = [
			{
				file: "file1.test.ts",
				summary: "Excellent",
				score: 80,
				suggestions: "",
			},
		];

		const githubToken = "github-token";

		vi.mocked(generateMarkdownComment).mockReturnValue("# Test Report");
		vi.mocked(postCommentToPR).mockResolvedValue(undefined);
		vi.mocked(core.info).mockImplementation(vi.fn());
		vi.mocked(core.setOutput).mockImplementation(vi.fn());

		await outputResults(mockFinalSummary, mockDetailedReport, githubToken);

		expect(postCommentToPR).toHaveBeenCalledWith(githubToken, "# Test Report");
	});
});
