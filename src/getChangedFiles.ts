import * as core from "@actions/core";
import * as github from "@actions/github";

export async function getChangedFiles(token: string): Promise<string[]> {
	try {
		const octokit = github.getOctokit(token);
		const context = github.context;

		if (!context.payload.pull_request) {
			core.warning(
				"This action is not running in a pull request context. No changed files will be returned.",
			);
			return [];
		}

		const { owner, repo } = context.repo;
		const pull_number = context.payload.pull_request.number;

		core.info(
			`Getting changed files for PR #${pull_number} in ${owner}/${repo}`,
		);

		// Get all changed files in the PR
		const changedFiles: string[] = [];

		// Need to handle pagination for PRs with many changed files
		const options = octokit.rest.pulls.listFiles.endpoint.merge({
			owner: owner,
			repo: repo,
			pull_number: pull_number,
			per_page: 100,
		});

		const response = await octokit.paginate(options);

		for (const file of response) {
			// Ensure file has the expected structure with a filename property
			if (
				file &&
				typeof file === "object" &&
				"filename" in file &&
				typeof file.filename === "string"
			) {
				changedFiles.push(file.filename);
			}
		}

		core.info(`Found ${changedFiles.length} changed files in the PR`);
		return changedFiles;
	} catch (error) {
		if (error instanceof Error) {
			core.warning(`Error getting changed files: ${error.message}`);
		}
		return [];
	}
}
