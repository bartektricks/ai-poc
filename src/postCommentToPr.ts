import core from "@actions/core";
import github from "@actions/github";

export async function postCommentToPR(
	token: string,
	comment: string,
): Promise<void> {
	const octokit = github.getOctokit(token);

	const context = github.context;
	const repo = context.repo;
	let prNumber: number | undefined;

	if (context.payload.pull_request) {
		prNumber = context.payload.pull_request.number;
	} else if (context.payload.issue?.pull_request) {
		prNumber = context.payload.issue.number;
	}

	core.info(`Context: ${JSON.stringify(context)}`);
	core.info(`PR Number: ${prNumber}`);

	if (!prNumber) {
		core.info("Not in a pull request context. Skipping PR comment.");
		return;
	}

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
