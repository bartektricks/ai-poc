import path from "path";
import core from "@actions/core";
import glob from "@actions/glob";
import { readFile } from "fs/promises";
import OpenAI from "openai";
import { calculateAverageScore } from "./calculateAverageScore";
import { generateMarkdownComment } from "./generateMarkdownComment";
import { ResponseJson, getPrompt } from "./getPrompt";
import type { File } from "./getPrompt";
import { identifyTopIssues } from "./identifyTopIssues";
import { postCommentToPR } from "./postCommentToPr";

export async function run(): Promise<void> {
	try {
		const apiKey = core.getInput("open_ai_api_key", { required: true });
		const batchSize =
			Number(core.getInput("batch_size", { required: false })) || 5;
		const model = core.getInput("model", { required: false }) || "gpt-4o-mini";
		const temperature =
			Number(core.getInput("temperature", { required: false })) || 0.5;
		const testPatterns =
			core.getInput("test_files", { required: false }) || "**/*.test.ts";
		const githubToken = core.getInput("github_token", { required: false });

		const openai = new OpenAI({
			apiKey,
		});

		core.info(`Finding test files`);

		const patterns = ["!**/node_modules/**", "!**/dist/**", "!**/build/**"];

		if (testPatterns) {
			patterns.unshift(...testPatterns.split(" "));
		}

		const globber = await glob.create(patterns.join("\n"));
		const testFiles = await globber.glob();

		if (testFiles.length === 0) {
			core.info(`No test files found`);
			return;
		}

		core.info(`Found ${testFiles.length} test files`);

		const batches = [];

		for (let i = 0; i < testFiles.length; i += batchSize) {
			batches.push(testFiles.slice(i, i + batchSize));
		}

		let overallSummary: string[] = [];
		let detailedReport: File[] = [];

		for (const batch of batches) {
			const batchContent = await Promise.all(
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

			const prompt = getPrompt(batchContent);

			core.info(prompt);

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
				core.error(`No response from OpenAI`);
				continue;
			}

			try {
				const result: ResponseJson = JSON.parse(content);

				if (result.files) {
					detailedReport = [...detailedReport, ...result.files];
				}

				if (result.overallSummary) {
					overallSummary.push(result.overallSummary);
				}
			} catch (error) {
				core.error(`Error parsing JSON: ${error}`);
				continue;
			}
		}

		const finalSummary = {
			totalFiles: testFiles.length,
			averageScore: calculateAverageScore(detailedReport),
			summary: overallSummary.join(" "),
			topIssues: identifyTopIssues(detailedReport),
		};

		const markdownComment = generateMarkdownComment(
			finalSummary,
			detailedReport,
		);

		if (githubToken) {
			await postCommentToPR(githubToken, markdownComment);
		}

		// Set outputs
		core.setOutput("summary", JSON.stringify(finalSummary, null, 2));
		core.setOutput("detailed_report", JSON.stringify(detailedReport, null, 2));
		core.setOutput("markdown_comment", markdownComment);

		// Log summary to console
		core.info("Analysis complete!");
		core.info(`Total files analyzed: ${finalSummary.totalFiles}`);
		core.info(`Average score: ${finalSummary.averageScore.toFixed(2)}/100`);
		core.info(`Summary: ${finalSummary.summary}`);
	} catch (error) {
		// Fail the workflow run if an error occurs
		if (error instanceof Error) core.setFailed(error.message);
	}
}
