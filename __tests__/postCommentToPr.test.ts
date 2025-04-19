import core from "@actions/core";
import github from "@actions/github";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { postCommentToPR } from "../src/postCommentToPr";

vi.mock("@actions/github", async (importOriginal) => {
	const actual = await importOriginal<typeof github>();
	return {
		default: {
			...actual,
			getOctokit: vi.fn().mockReturnValue({
				rest: {
					issues: {
						createComment: vi.fn(),
					},
				},
			}),
			context: {
				repo: {
					owner: "testOwner",
					repo: "testRepo",
				},
				payload: {
					pull_request: {
						number: 123,
					},
				},
			},
		},
	};
});

vi.mock("@actions/core", () => ({
	default: {
		info: vi.fn(),
		warning: vi.fn(),
	},
}));

describe("postCommentToPR", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should skip posting comment when not in PR context", async () => {
		vi.mocked(github.context).payload.pull_request = undefined;

		await postCommentToPR("fake-token", "Test comment");

		expect(core.info).toHaveBeenCalledWith(
			"Not in a pull request context. Skipping PR comment.",
		);

		expect(github.getOctokit).toHaveBeenCalledWith("fake-token");

		const mockOctokit = vi.mocked(github.getOctokit).mock.results[0].value;
		expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
	});

	test("should post comment to PR when in PR context", async () => {
		vi.mocked(github.context).payload.pull_request = { number: 123 };

		const mockCreateComment = vi.fn().mockResolvedValue({});
		vi.mocked(github.getOctokit).mockReturnValue({
			rest: {
				issues: {
					createComment: mockCreateComment,
				},
			},
		} as any);

		await postCommentToPR("fake-token", "Test comment");

		expect(core.info).toHaveBeenCalledWith("Posting comment to PR #123");
		expect(core.info).toHaveBeenCalledWith(
			"Comment posted successfully to PR #123",
		);

		expect(mockCreateComment).toHaveBeenCalledWith({
			owner: "testOwner",
			repo: "testRepo",
			issue_number: 123,
			body: "Test comment",
		});
	});

	test("should handle errors when posting comment fails", async () => {
		vi.mocked(github.context).payload.pull_request = { number: 123 };

		const mockError = new Error("API error");
		const mockCreateComment = vi.fn().mockRejectedValue(mockError);
		vi.mocked(github.getOctokit).mockReturnValue({
			rest: {
				issues: {
					createComment: mockCreateComment,
				},
			},
		} as any);

		await postCommentToPR("fake-token", "Test comment");

		expect(core.warning).toHaveBeenCalledWith(
			"Failed to post comment to PR: API error",
		);

		expect(core.info).toHaveBeenCalledWith("Posting comment to PR #123");
	});

	test("should handle unknown errors when posting comment fails", async () => {
		vi.mocked(github.context).payload.pull_request = { number: 123 };

		const mockCreateComment = vi.fn().mockRejectedValue("Not an Error object");
		vi.mocked(github.getOctokit).mockReturnValue({
			rest: {
				issues: {
					createComment: mockCreateComment,
				},
			},
		} as any);

		await postCommentToPR("fake-token", "Test comment");

		expect(core.warning).toHaveBeenCalledWith(
			"Failed to post comment to PR: Unknown error",
		);
	});
});
