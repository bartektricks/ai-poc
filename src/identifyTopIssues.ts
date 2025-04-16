import type { File } from "./getPrompt";

export const identifyTopIssues = (detailedReport: File[]) => {
	const issues = [];

	// Find files with low scores
	const lowScoringFiles = detailedReport
		.filter((file) => file.score < 5)
		.map((file) => ({
			file: file.file,
			score: file.score,
			reason: file.summary,
		}));

	if (lowScoringFiles.length > 0) {
		issues.push({
			type: "Low scoring test files",
			count: lowScoringFiles.length,
			examples: lowScoringFiles.slice(0, 3),
		});
	}

	// Find tests that are not meaningful
	const meaninglessTests: { file: string; test: string; reason: string }[] = [];
	detailedReport.forEach((file) => {
		if (file.tests) {
			file.tests.forEach((test) => {
				if (test.meaningful === false) {
					meaninglessTests.push({
						file: file.file,
						test: test.name,
						reason: test.summary,
					});
				}
			});
		}
	});

	if (meaninglessTests.length > 0) {
		issues.push({
			type: "Tests of implementation details",
			count: meaninglessTests.length,
			examples: meaninglessTests.slice(0, 3),
		});
	}

	return issues;
};
