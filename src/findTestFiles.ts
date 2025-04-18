import path from "path";
import core from "@actions/core";
import glob from "@actions/glob";
import { getChangedFiles } from "./getChangedFiles";

export async function findTestFiles(
	testPatterns: string,
	onlyChangedFiles: boolean,
	githubToken?: string,
): Promise<string[]> {
	const patterns = ["!**/node_modules/**", "!**/dist/**", "!**/build/**"];

	if (testPatterns) {
		patterns.unshift(...testPatterns.split(" "));
	}

	async function getTestFiles(): Promise<string[]> {
		const globber = await glob.create(patterns.join("\n"));
		return globber.glob();
	}

	let testFiles: string[] = [];

	if (onlyChangedFiles && githubToken) {
		core.info("Getting changed files from PR");
		const changedFiles = await getChangedFiles(githubToken);
		const allTestFiles = await getTestFiles();

		const relativeChangedFiles = changedFiles.map((file) =>
			path.relative(process.cwd(), file),
		);

		testFiles = allTestFiles.filter((file) => {
			const relativePath = path.relative(process.cwd(), file);
			return relativeChangedFiles.includes(relativePath);
		});

		core.info(
			`Found ${testFiles.length} changed test files out of ${allTestFiles.length} total test files`,
		);
	} else {
		testFiles = await getTestFiles();
	}

	return testFiles;
}
