import core from "@actions/core";
import OpenAI from "openai";
import { type File, ResponseJson, getPrompt } from "./getPrompt";

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
