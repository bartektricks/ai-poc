import core from "@actions/core";

export interface Config {
	apiKey: string;
	batchSize: number;
	model: string;
	temperature: number;
	testPatterns: string;
	githubToken: string | undefined;
	onlyChangedFiles: boolean;
}

export function getConfig(): Config {
	const apiKey = core.getInput("openai_api_key", { required: true });
	const batchSize =
		Number(core.getInput("batch_size", { required: false })) || 5;
	const model = core.getInput("model", { required: false }) || "gpt-4o-mini";
	const temperature = Number(
		core.getInput("temperature", { required: false }) || "0.5",
	);
	const testPatterns =
		core.getInput("test_files", { required: false }) || "**/*.test.ts";
	const githubToken =
		core.getInput("github_token", { required: false }) || undefined;
	const onlyChangedFilesInput =
		core.getInput("only_changed_files", { required: false }) || "true";
	const onlyChangedFiles = onlyChangedFilesInput === "true";

	return {
		apiKey,
		batchSize,
		model,
		temperature,
		testPatterns,
		githubToken,
		onlyChangedFiles,
	};
}
