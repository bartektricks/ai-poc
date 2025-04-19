# Test Quality Analysis GitHub Action

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Coverage](./badges/coverage.svg)

A GitHub Action that uses AI to analyze the quality of your test files, providing insightful feedback and suggestions for improvement.

## Features

- Analyzes test files using OpenAI's GPT models
- Provides a quality score for each test file
- Identifies common issues and improvement areas
- Generates a detailed report with specific recommendations
- Can post results directly to your Pull Request

## Setup

### Prerequisites

- An OpenAI API key

## Usage

Add this action to your GitHub workflow:

```yaml
name: Test Quality Check

on:
  pull_request:
    branches: [ main ]
    paths:
      - '**.test.ts'
      - '**.test.js'
      - '**.spec.ts'
      - '**.spec.js'

jobs:
  analyze-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Analyze Test Quality
        uses: Aetherr-Agency/DeepDive@v1
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input           | Description                                               | Required | Default        |
|-----------------|-----------------------------------------------------------|----------|----------------|
| openai_api_key  | Your OpenAI API key                                       | Yes      | -              |
| github_token    | GitHub token for posting comments to PRs                  | No       | -              |
| batch_size      | Number of files to process in each batch                   | No       | 5              |
| model           | OpenAI model to use                                       | No       | gpt-4o-mini    |
| temperature     | Temperature setting for the AI model                      | No       | 0.5            |
| test_files       | Whitespace-separated list of glob patterns for test files  | No       | **/*.test.ts   |
| only_changed_files | Only analyze test files that have been changed in the PR  | No       | true           |

## Outputs

| Output            | Description                                   |
|-------------------|-----------------------------------------------|
| summary           | JSON summary of the test analysis             |
| detailed_report   | Detailed JSON report with scores and feedback |
| markdown_comment  | Formatted markdown for PR comments            |

## Advanced Configuration

### Custom Test File Patterns

You can specify custom patterns to match your test files:

```yaml
- name: Analyze Test Quality
  uses: Aetherr-Agency/DeepDive@v1
  with:
    openai_api_key: ${{ secrets.OPENAI_API_KEY }}
    test_files: "**/*test.js **/*spec.js **/__tests__/**/*.js"
```

### Using a Different Model

For more detailed analysis, you can use a more powerful model:

```yaml
- name: Analyze Test Quality
  uses: Aetherr-Agency/DeepDive@v1
  with:
    openai_api_key: ${{ secrets.OPENAI_API_KEY }}
    model: "gpt-4o"
```

## Example Workflow with Custom Report Handling

```yaml
name: Comprehensive Test Analysis

on:
  pull_request:
    branches: [ main, development ]

jobs:
  test-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Analyze Test Quality
        id: test_analysis
        uses: Aetherr-Agency/DeepDive@v1
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          model: "gpt-4o"
          
      - name: Save Analysis Report
        run: |
          echo '${{ steps.test_analysis.outputs.detailed_report }}' > test-analysis-report.json
          
      - name: Upload Analysis Report
        uses: actions/upload-artifact@v3
        with:
          name: test-analysis-report
          path: test-analysis-report.json
```

### Example workflow with comment trigger

```yaml
name: DeepDive on PR Comment

on:
  pull_request:
    types: [opened]
  issue_comment:
    types: [created]

jobs:
  add-initial-comment:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    
    steps:
      - name: Add initial comment
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## 🤖 DeepDive Analysis Available
            
            You can run analysis on this PR by using these commands in a comment:
            
            - \`/start-analysis\` - Run analysis on changed files only
            - \`/analyze-all\` - Run analysis on all test files in the repository
            
            The analysis will check your test files and provide feedback.`
            });

  deepdive-check:
    if: |
      github.event.issue.pull_request != null &&
      (
        github.event.comment.body == '/start-analysis' ||
        github.event.comment.body == '/analyze-all'
      )
    runs-on: ubuntu-latest

    permissions:
      contents: read
      pull-requests: write
      statuses: write

    steps:
      - name: Set initial PR Check status (DeepDive Analysis)
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const pr = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.issue.number
            });
            const commitSHA = pr.data.head.sha;

            await github.rest.repos.createCommitStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              sha: commitSHA,
              state: "pending",
              context: "DeepDive Analysis",
              description: "DeepDive analysis in progress...",
              target_url: `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`
            });

      - name: Set analyze_all flag
        id: set_scope
        run: |
          if [[ "${{ github.event.comment.body }}" == "/analyze-all" ]]; then
            echo "analyze_all=true" >> $GITHUB_OUTPUT
          else
            echo "analyze_all=false" >> $GITHUB_OUTPUT
          fi

      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Run DeepDive analysis
        id: deepdive
        uses: ./
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          test_files: "**/*.test.ts **/*.test.tsx"
          only_changed_files: ${{ steps.set_scope.outputs.analyze_all == 'false' }}

      - name: Update PR Check status (DeepDive Analysis)
        if: always()
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const pr = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.issue.number
            });
            const commitSHA = pr.data.head.sha;
            
            const state = "${{ steps.deepdive.outcome }}" === "success" ? "success" : "failure";
            const description = state === "success" 
              ? "DeepDive analysis completed successfully" 
              : "DeepDive analysis failed";

            await github.rest.repos.createCommitStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              sha: commitSHA,
              state: state,
              context: "DeepDive Analysis",
              description: description,
              target_url: `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`
            });
```

## Example analysis (mocked data)

# 📊 Test Quality Analysis

## Summary

| Metric | Value |
| --- | --- |
| Total Files Analyzed | 7 |
| Average Score | 75/100 |

## Overall Assessment

The unit tests demonstrate a solid understanding of testing principles, covering various scenarios for each function. Most tests are meaningful and provide good coverage, but some could benefit from additional edge case considerations. The first test file is ineffective and lacks any meaningful tests, while the second test file is well-structured and provides valuable coverage for the `postCommentToPR` function. Improvements can be made by removing or enhancing the first test and ensuring the second test covers more edge cases.

## Top Issues

### Low scoring test files (1)

| File | Issue |
| --- | --- |
| `__tests__/main.test.ts` | This test is essentially a placeholder that checks if true is equal to true. It does not provide any meaningful validation of functionality or behavior. |

## Detailed Report

| File | Score | Meaningful | Suggestions | Summary |
| --- | --- | --- | --- | --- |
| `__tests__/calculateAverageScore.test.ts` | 85/100 | ✅ | Consider adding tests for edge cases such as negative scores or very large arrays. | Tests the calculateAverageScore function for various scenarios including empty arrays, single file, multiple files, and handling missing scores. |
| `__tests__/generateMarkdownComment.test.ts` | 90/100 | ✅ | Add tests for more complex scenarios with mixed data types in the summary. | Tests the generateMarkdownComment function for generating markdown output based on summary and detailed reports. |
| `__tests__/getChangedFiles.test.ts` | 95/100 | ✅ | Ensure that the mock implementations cover all edge cases, especially for error handling. | Tests the getChangedFiles function for various scenarios including PR context, fetching files, filtering invalid files, and handling errors. |
| `__tests__/getPrompt.test.ts` | 80/100 | ✅ | Consider testing for more diverse test file contents and edge cases. | Tests the getPrompt function to ensure it generates the correct prompt structure for different numbers of test files. |
| `__tests__/identifyTopIssues.test.ts` | 85/100 | ✅ | Add tests for more complex scenarios with mixed quality reports. | Tests the identifyTopIssues function for identifying issues in a detailed report including low scores and tests that are not meaningful. |
| `__tests__/main.test.ts` | 0/100 | ❌ | Remove this test or replace it with meaningful tests that validate actual functionality of the codebase. | This test is essentially a placeholder that checks if true is equal to true. It does not provide any meaningful validation of functionality or behavior. |
| `__tests__/postCommentToPr.test.ts` | 90/100 | ✅ | Consider adding more edge cases or additional scenarios, such as testing for invalid tokens or unexpected payload structures. | This test file contains multiple tests for the `postCommentToPR` function, covering scenarios such as posting a comment in PR context, skipping when not in PR context, and handling errors. The tests are comprehensive and effectively validate the function's behavior. |



## License

MIT
