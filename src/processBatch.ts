import path from "path";
import core from "@actions/core";
import { readFile } from "fs/promises";
import OpenAI from "openai";
import { ResponseJson, getPrompt } from "./getPrompt";
import type { File } from "./getPrompt";

export async function processBatchContent(
	batch: string[],
): Promise<{ file: string; content: string }[]> {
	return Promise.all(
		batch.map(async (file) => {
			const content = await readFile(file, "utf-8");
			const contentWithoutImports = content.replace(
				/import\s[\s\S]*?from ['"][\s\S]*?['"];/gm,
				"",
			);
			return {
				file: path.relative(process.cwd(), file),
				content: contentWithoutImports,
			};
		}),
	);
}

export async function processOpenAIResponse(
	batchContent: { file: string; content: string }[],
	model: string,
	temperature: number,
	openai: OpenAI,
): Promise<{ files?: File[]; overallSummary?: string }> {
	const prompt = getPrompt(batchContent);

	const response = await openai.chat.completions.create({
		model,
		messages: [
			{
				role: "system",
				content:
					"You are a senior software engineer specializing in test quality analysis.",
			},
			{ role: "user", content: prompt },
		],
		temperature: Number(temperature),
		response_format: { type: "json_object" },
	});

	const content = response.choices[0].message.content;

	if (!content) {
		return {};
	}

	try {
		return JSON.parse(content) as ResponseJson;
	} catch (error) {
		core.error(`Error parsing JSON: ${error}`);
		return {};
	}
}

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
