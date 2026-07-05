import * as path from 'path';
import { readdir } from 'fs/promises';
import Mocha = require('mocha');

async function findTestFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(entries.map(async entry => {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			return findTestFiles(entryPath);
		}

		return entry.name.endsWith('.test.js') ? [entryPath] : [];
	}));

	return files.flat();
}

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd'
	});

	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((c, e) => {
		findTestFiles(testsRoot).then(files => {
			files.forEach(file => mocha.addFile(file));

			try {
				// Run the mocha test
				mocha.run(failures => {
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			} catch (err) {
				console.error(err);
				e(err);
			}
		}, e);
	});
}
