# Test Quality Analysis GitHub Action

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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
        uses: Aetherr-Agency/test-quality-analysis@v1
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
  uses: Aetherr-Agency/test-quality-analysis@v1
  with:
    openai_api_key: ${{ secrets.OPENAI_API_KEY }}
    test_files: "**/*test.js **/*spec.js **/__tests__/**/*.js"
```

### Using a Different Model

For more detailed analysis, you can use a more powerful model:

```yaml
- name: Analyze Test Quality
  uses: Aetherr-Agency/test-quality-analysis@v1
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
        uses: Aetherr-Agency/test-quality-analysis@v1
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

## License

MIT
