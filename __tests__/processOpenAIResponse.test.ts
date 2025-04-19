import core from "@actions/core";
import OpenAI from "openai";
import { vi } from "vitest";
import { getPrompt } from "../src/getPrompt";
import { processOpenAIResponse } from "../src/processOpenAIResponse";

vi.mock("../src/getPrompt");
vi.mock("node:fs/promises");
vi.mock("@actions/core");

describe("processOpenAIResponse", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("processes OpenAI response correctly", async () => {
		const mockOpenAI = {
			chat: {
				completions: {
					create: vi.fn().mockResolvedValue({
						choices: [
							{
								message: {
									content: JSON.stringify({
										files: [
											{
												file: "file1.test.ts",
												summary: "Test summary",
												score: 75,
												suggestions: "No suggestions",
											},
										],
										overallSummary: "Good tests overall",
									}),
								},
							},
						],
					}),
				},
			},
		};

		vi.mocked(getPrompt).mockReturnValue("test prompt");

		const batchContent = [{ file: "file1.test.ts", content: "test content" }];

		const result = await processOpenAIResponse(
			batchContent,
			"gpt-4o-mini",
			0.5,
			mockOpenAI as unknown as OpenAI,
		);

		expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content:
						"You are a senior software engineer specializing in test quality analysis.",
				},
				{ role: "user", content: "test prompt" },
			],
			temperature: 0.5,
			response_format: { type: "json_object" },
		});

		expect(result.files).toHaveLength(1);
		expect(result.files?.[0].file).toBe("file1.test.ts");
		expect(result.files?.[0].score).toBe(75);
		expect(result.overallSummary).toBe("Good tests overall");
	});

	it("handles empty response from OpenAI", async () => {
		const mockOpenAI = {
			chat: {
				completions: {
					create: vi.fn().mockResolvedValue({
						choices: [
							{
								message: {
									content: null,
								},
							},
						],
					}),
				},
			},
		};

		vi.mocked(getPrompt).mockReturnValue("test prompt");

		const batchContent = [{ file: "file1.test.ts", content: "test content" }];

		const result = await processOpenAIResponse(
			batchContent,
			"gpt-4o-mini",
			0.5,
			mockOpenAI as unknown as OpenAI,
		);

		expect(result).toEqual({});
	});

	it("handles invalid JSON from OpenAI", async () => {
		const mockOpenAI = {
			chat: {
				completions: {
					create: vi.fn().mockResolvedValue({
						choices: [
							{
								message: {
									content: "invalid json",
								},
							},
						],
					}),
				},
			},
		};

		vi.mocked(getPrompt).mockReturnValue("test prompt");
		vi.mocked(core.error).mockImplementation(vi.fn());

		const batchContent = [{ file: "file1.test.ts", content: "test content" }];

		const result = await processOpenAIResponse(
			batchContent,
			"gpt-4o-mini",
			0.5,
			mockOpenAI as unknown as OpenAI,
		);

		expect(result).toEqual({});
		expect(core.error).toHaveBeenCalled();
	});
});
