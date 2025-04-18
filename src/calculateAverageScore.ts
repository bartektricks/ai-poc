import type { File } from "./getPrompt";

export const calculateAverageScore = (detailedReport: File[]) => {
	if (detailedReport.length === 0) return 0;

	const sum = detailedReport.reduce(
		(total, file) => total + (file.score || 0),
		0,
	);

	return sum / detailedReport.length;
};
