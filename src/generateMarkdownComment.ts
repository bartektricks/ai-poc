import { MEANINGFUL_SCORE } from "./config";
import type { File } from "./getPrompt";
import type { identifyTopIssues } from "./identifyTopIssues";

const getPipeSanitizedText = (text: string) => text.replace(/\|/g, "\\|");

export function generateMarkdownComment(
	summary: {
		totalFiles: number;
		averageScore: number;
		summary: string;
		topIssues: ReturnType<typeof identifyTopIssues>;
	},
	detailedReport: File[],
): string {
	let markdown = `# 📊 Test Quality Analysis\n\n`;

	markdown += `## Summary\n\n`;
	markdown += `| Metric | Value |\n`;
	markdown += `| --- | --- |\n`;
	markdown += `| Total Files Analyzed | ${summary.totalFiles} |\n`;
	markdown += `| Average Score | ${summary.averageScore}/100 |\n\n`;
	markdown += `## Overall Assessment\n\n${summary.summary}\n\n`;

	if (summary.topIssues.length > 0) {
		markdown += `## Top Issues\n\n`;
		markdown += `### Low scoring test files (${summary.topIssues.length})\n\n`;
		markdown += `| File | Issue |\n`;
		markdown += `| --- | --- |\n`;

		summary.topIssues.forEach(({ file, reason }) => {
			const sanitizedReason = getPipeSanitizedText(reason);
			markdown += `| \`${file}\` | ${sanitizedReason} |\n`;
			markdown += `\n`;
		});
	}

	if (detailedReport.length > 0) {
		markdown += `## Detailed Report\n\n`;
		markdown += `| File | Score | Meaningful | Suggestions | Summary |\n`;
		markdown += `| --- | --- | --- | --- | --- |\n`;
		detailedReport.forEach((report) => {
			const sanitizedSummary = getPipeSanitizedText(report.summary);
			const sanitizedSuggestions = getPipeSanitizedText(report.suggestions);
			markdown += `| \`${report.file}\` | ${report.score}/100 | ${report.score > MEANINGFUL_SCORE ? "✅" : "❌"} | ${sanitizedSuggestions} | ${sanitizedSummary} |\n`;
		});
		markdown += `\n`;
	}

	return markdown;
}
