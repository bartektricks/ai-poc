import type { File } from "./getPrompt";
import type { identifyTopIssues } from "./identifyTopIssues";

export function generateMarkdownComment(
	summary: {
		totalFiles: number;
		averageScore: number;
		summary: string;
		topIssues: ReturnType<typeof identifyTopIssues>;
	},
	detailedReport: File[],
): string {
	// Create the summary section
	let markdown = `# 📊 Test Quality Analysis\n\n`;

	// Summary table
	markdown += `## Summary\n\n`;
	markdown += `| Metric | Value |\n`;
	markdown += `| --- | --- |\n`;
	markdown += `| Total Files Analyzed | ${summary.totalFiles} |\n`;
	markdown += `| Average Score | ${summary.averageScore.toFixed(2)}/100 |\n\n`;

	// Overall summary text
	markdown += `## Overall Assessment\n\n${summary.summary}\n\n`;

	// Top Issues section
	if (summary.topIssues.length > 0) {
		markdown += `## Top Issues\n\n`;

		summary.topIssues.forEach((issueGroup) => {
			markdown += `### ${issueGroup.type} (${issueGroup.count})\n\n`;

			if (issueGroup.examples.length > 0) {
				markdown += `| File | Issue |\n`;
				markdown += `| --- | --- |\n`;

				issueGroup.examples.forEach((example) => {
					const file = example.file;
					const reason =
						"test" in example
							? `${example.test}: ${example.reason}`
							: example.reason;

					// Escape pipe characters
					const sanitizedReason = reason.replace(/\|/g, "\\|");
					markdown += `| \`${file}\` | ${sanitizedReason} |\n`;
				});

				markdown += `\n`;
			}
		});
	}

	// Detailed report section
	if (detailedReport.length > 0) {
		markdown += `## Detailed Report\n\n`;
		markdown += `| File | Score | Summary |\n`;
		markdown += `| --- | --- | --- |\n`;
		detailedReport.forEach((report) => {
			// Escape pipe characters in the summary
			const sanitizedSummary = report.summary.replace(/\|/g, "\\|");
			markdown += `| \`${report.file}\` | ${report.score.toFixed(1)}/100 | ${sanitizedSummary} |\n`;
		});
		markdown += `\n`;

		// Add test details for each file
		markdown += `## Test Details\n\n`;
		detailedReport.forEach((report) => {
			markdown += `### ${report.file}\n\n`;
			markdown += `| Test | Score | Meaningful | Suggestions |\n`;
			markdown += `| --- | --- | --- | --- |\n`;

			report.tests.forEach((test) => {
				// Escape pipe characters in the suggestions
				const sanitizedSuggestions = test.suggestions.replace(/\|/g, "\\|");
				markdown += `| ${test.name} | ${test.score.toFixed(1)}/100 | ${test.meaningful ? "✅" : "❌"} | ${sanitizedSuggestions} |\n`;
			});

			markdown += `\n`;
		});
	}

	return markdown;
}
