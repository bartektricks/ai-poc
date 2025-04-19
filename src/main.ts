import core from "@actions/core";
import OpenAI from "openai";
import { getConfig } from "./config";
import { findTestFiles } from "./findTestFiles";
import { generateSummary, outputResults } from "./generateReport";
import { processBatches } from "./processBatches";

export async function run(): Promise<void> {
	try {
		const config = getConfig();

		const openai = new OpenAI({
			apiKey: config.apiKey,
		});

		core.info(`Finding test files`);

		const testFiles = await findTestFiles(
			config.testPatterns,
			config.onlyChangedFiles,
			config.githubToken,
		);

		if (testFiles.length === 0) {
			core.info(`No test files found`);
			return;
		}

		core.info(`Analyzing ${testFiles.length} test files`);

		const { overallSummary, detailedReport } = await processBatches(
			testFiles,
			config.batchSize,
			config.model,
			config.temperature,
			openai,
		);

		const finalSummary = generateSummary(
			testFiles,
			overallSummary,
			detailedReport,
		);

		await outputResults(finalSummary, detailedReport, config.githubToken);
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message);
	}
}
