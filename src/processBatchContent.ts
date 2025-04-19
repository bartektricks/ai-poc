import { readFile } from "node:fs/promises";
import path from "node:path";

export async function processBatchContent(
	batch: string[],
): Promise<{ file: string; content: string }[]> {
	return Promise.all(
		batch.map(async (file) => {
			const content = await readFile(file, "utf-8");
			const contentWithoutImports = content.replace(
				/import\s[\s\S]*?from ['"][\s\S]*?['"];/gm,
				"",
			);
			return {
				file: path.relative(process.cwd(), file),
				content: contentWithoutImports,
			};
		}),
	);
}
