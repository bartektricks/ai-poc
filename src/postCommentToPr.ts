import core from "@actions/core";
import github from "@actions/github";

export async function postCommentToPR(
	token: string,
	comment: string,
): Promise<void> {
	const octokit = github.getOctokit(token);

	const context = github.context;

	if (!context.payload.pull_request) {
		core.info("Not in a pull request context. Skipping PR comment.");
		return;
	}

	const repo = context.repo;
	const prNumber = context.payload.pull_request.number;

	try {
		core.info(`Posting comment to PR #${prNumber}`);

		await octokit.rest.issues.createComment({
			...repo,
			issue_number: prNumber,
			body: comment,
		});

		core.info(`Comment posted successfully to PR #${prNumber}`);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		core.warning(`Failed to post comment to PR: ${errorMessage}`);
	}
}
