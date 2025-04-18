import { MEANINGFUL_SCORE } from "./constants";
import type { File } from "./getPrompt";

export const identifyTopIssues = (detailedReport: File[]) =>
	detailedReport
		.filter((file) => file.score < MEANINGFUL_SCORE)
		.map((file) => ({
			file: file.file,
			score: file.score,
			reason: file.summary,
		}));
