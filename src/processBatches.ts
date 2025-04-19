import OpenAI from "openai";
import type { File } from "./getPrompt";
import { processBatchContent } from "./processBatchContent";
import { processOpenAIResponse } from "./processOpenAIResponse";

export async function processBatches(
	testFiles: string[],
	batchSize: number,
	model: string,
	temperature: number,
	openai: OpenAI,
): Promise<{ overallSummary: string[]; detailedReport: File[] }> {
	const batches = [];
	for (let i = 0; i < testFiles.length; i += batchSize) {
		batches.push(testFiles.slice(i, i + batchSize));
	}

	let overallSummary: string[] = [];
	let detailedReport: File[] = [];

	for (const batch of batches) {
		const batchContent = await processBatchContent(batch);

		const result = await processOpenAIResponse(
			batchContent,
			model,
			temperature,
			openai,
		);

		if (result.files) {
			detailedReport = [...detailedReport, ...result.files];
		}

		if (result.overallSummary) {
			overallSummary.push(result.overallSummary);
		}
	}

	return { overallSummary, detailedReport };
}
