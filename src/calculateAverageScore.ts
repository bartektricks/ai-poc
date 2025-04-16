import type { File } from "./getPrompt";

export const calculateAverageScore = (detailedReport: File[]) => {
	if (detailedReport.length === 0) return 0;

	const sum = detailedReport.reduce(
		(total, file) => total + (file.score || 0),
		0,
	);
	// Scale the average score to a 0-100 range
	return (sum / detailedReport.length) * 10;
};
