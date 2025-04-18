import * as core from "@actions/core";
import * as github from "@actions/github";

export async function getChangedFiles(token: string): Promise<string[]> {
	try {
		const octokit = github.getOctokit(token);
		const context = github.context;

		let owner = context.repo.owner;
		let repo = context.repo.repo;
		let pull_number: number;

		// Handle both direct PR context and issue_comment on a PR
		if (context.payload.pull_request) {
			// Direct pull_request trigger
			pull_number = context.payload.pull_request.number;
		} else if (context.payload.issue?.pull_request) {
			// Issue comment on a PR
			pull_number = context.payload.issue.number;
		} else {
			core.warning(
				"This action is not running in a pull request context. No changed files will be returned.",
			);
			return [];
		}

		core.info(
			`Getting changed files for PR #${pull_number} in ${owner}/${repo}`,
		);

		const changedFiles: string[] = [];

		const options = octokit.rest.pulls.listFiles.endpoint.merge({
			owner: owner,
			repo: repo,
			pull_number: pull_number,
			per_page: 100,
		});

		const response = await octokit.paginate(options);

		for (const file of response) {
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
