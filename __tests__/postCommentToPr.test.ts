import core from "@actions/core";
import github from "@actions/github";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { postCommentToPR } from "../src/postCommentToPr";

// Mock the modules
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
	// Reset mocks before each test
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should skip posting comment when not in PR context", async () => {
		// Setup context without PR
		vi.mocked(github.context).payload.pull_request = undefined;

		await postCommentToPR("fake-token", "Test comment");

		// Verify core.info was called with the expected message
		expect(core.info).toHaveBeenCalledWith(
			"Not in a pull request context. Skipping PR comment.",
		);

		// Verify getOctokit was called with the token
		expect(github.getOctokit).toHaveBeenCalledWith("fake-token");

		// Verify no comment was posted
		const mockOctokit = vi.mocked(github.getOctokit).mock.results[0].value;
		expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
	});

	test("should post comment to PR when in PR context", async () => {
		// Mock PR context
		vi.mocked(github.context).payload.pull_request = { number: 123 };

		// Mock Octokit instance
		const mockCreateComment = vi.fn().mockResolvedValue({});
		vi.mocked(github.getOctokit).mockReturnValue({
			rest: {
				issues: {
					createComment: mockCreateComment,
				},
			},
		} as any);

		await postCommentToPR("fake-token", "Test comment");

		// Verify core.info calls
		expect(core.info).toHaveBeenCalledWith("Posting comment to PR #123");
		expect(core.info).toHaveBeenCalledWith(
			"Comment posted successfully to PR #123",
		);

		// Verify comment was posted with correct parameters
		expect(mockCreateComment).toHaveBeenCalledWith({
			owner: "testOwner",
			repo: "testRepo",
			issue_number: 123,
			body: "Test comment",
		});
	});

	test("should handle errors when posting comment fails", async () => {
		// Mock PR context
		vi.mocked(github.context).payload.pull_request = { number: 123 };

		// Mock Octokit instance with error
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

		// Verify core.warning was called with the error message
		expect(core.warning).toHaveBeenCalledWith(
			"Failed to post comment to PR: API error",
		);

		// Verify info about posting attempt
		expect(core.info).toHaveBeenCalledWith("Posting comment to PR #123");
	});

	test("should handle unknown errors when posting comment fails", async () => {
		// Mock PR context
		vi.mocked(github.context).payload.pull_request = { number: 123 };

		// Mock Octokit instance with non-Error object thrown
		const mockCreateComment = vi.fn().mockRejectedValue("Not an Error object");
		vi.mocked(github.getOctokit).mockReturnValue({
			rest: {
				issues: {
					createComment: mockCreateComment,
				},
			},
		} as any);

		await postCommentToPR("fake-token", "Test comment");

		// Verify core.warning was called with the unknown error message
		expect(core.warning).toHaveBeenCalledWith(
			"Failed to post comment to PR: Unknown error",
		);
	});
});
