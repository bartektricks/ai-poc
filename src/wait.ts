export async function wait(milliseconds: number) {
	return new Promise((resolve) => {
		if (isNaN(milliseconds)) throw new Error("milliseconds is not a number");

		setTimeout(() => resolve("done!"), milliseconds);
	});
}
