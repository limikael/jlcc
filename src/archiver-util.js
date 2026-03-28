import fs from "fs";
import path from "path";
import archiver from "archiver";

/**
 * Zip all files from a directory (non-recursive)
 * @param {string} zipfile - output zip file path
 * @param {string} dir - directory to zip
 */
export async function zipFilesFromDir(zipfile, dir) {
	await fs.promises.mkdir(path.dirname(zipfile), { recursive: true });

	return new Promise((resolve, reject) => {
		const output = fs.createWriteStream(zipfile);
		const archive = archiver("zip", { zlib: { level: 9 } });

		output.on("close", () => resolve());
		archive.on("error", err => reject(err));

		archive.pipe(output);

		const files = fs.readdirSync(dir);

		for (const file of files) {
			const fullPath = path.join(dir, file);
			const stat = fs.statSync(fullPath);

			if (stat.isFile()) {
				// add file at root of zip (no folder prefix)
				archive.file(fullPath, { name: file });
			}
		}

		archive.finalize();
	});
}