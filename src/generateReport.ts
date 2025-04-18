import core from "@actions/core";
import { calculateAverageScore } from "./calculateAverageScore";
import { generateMarkdownComment } from "./generateMarkdownComment";
import type { File } from "./getPrompt";
import { identifyTopIssues } from "./identifyTopIssues";
import { postCommentToPR } from "./postCommentToPr";

export interface FinalSummary {
	totalFiles: number;
	averageScore: number;
	summary: string;
	topIssues: ReturnType<typeof identifyTopIssues>;
}

export function generateSummary(
	testFiles: string[],
	overallSummary: string[],
	detailedReport: File[],
): FinalSummary {
	return {
		totalFiles: testFiles.length,
		averageScore: calculateAverageScore(detailedReport),
		summary: overallSummary.join(" "),
		topIssues: identifyTopIssues(detailedReport),
	};
}

export async function outputResults(
	finalSummary: FinalSummary,
	detailedReport: File[],
	githubToken?: string,
): Promise<void> {
	const markdownComment = generateMarkdownComment(finalSummary, detailedReport);

	if (githubToken) {
		await postCommentToPR(githubToken, markdownComment);
	}

	core.setOutput("summary", finalSummary);
	core.setOutput("detailed_report", detailedReport);
	core.setOutput("markdown_comment", markdownComment);

	core.info("Analysis complete!");
	core.info(`Total files analyzed: ${finalSummary.totalFiles}`);
	core.info(`Average score: ${finalSummary.averageScore}/100`);
	core.info(`Summary: ${finalSummary.summary}`);
}
