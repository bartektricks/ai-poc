type PromptFile = {
	file: string;
	content: string;
};

export type File = {
	file: string;
	summary: string;
	score: number;
	tests: {
		name: string;
		summary: string;
		meaningful: boolean;
		score: number;
		suggestions: string;
	}[];
};

export type ResponseJson = {
	files: File[];
	overallSummary: string;
};

export const getPrompt = (testFiles: PromptFile[]) => `
You are a senior software engineer. Evaluate the following TypeScript unit tests for usefulness and quality.
For each test, provide:
- Summary of what it's testing.
- Whether it's meaningful or just testing implementation details.
- A score from 1-10 for its value.
- Suggestions if it's weak.

Here are the test files to evaluate:

${testFiles
	.map(
		(item) => `
FILE: ${item.file}
\`\`\`typescript
${item.content}
\`\`\`
`,
	)
	.join("\n")}

Please provide your analysis in JSON format with the following structure:
{
  "files": [
    {
      "file": "path/to/file.test.ts",
      "summary": "Overall assessment of the test file",
      "score": 7,
      "tests": [
        {
          "name": "test name or description",
          "summary": "What this test is checking",
          "meaningful": true/false,
          "score": 8,
          "suggestions": "Any improvement suggestions"
        }
      ]
    }
  ],
  "overallSummary": "Brief summary of all test files analyzed in this batch"
}
`;
