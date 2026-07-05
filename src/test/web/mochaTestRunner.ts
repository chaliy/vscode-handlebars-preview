import 'mocha/mocha';

declare const mocha: {
	setup(options: { ui: string; reporter?: unknown }): void;
	run(callback: (failures: number) => void): void;
};

export function setup(): void {
	mocha.setup({
		ui: 'tdd',
		reporter: undefined
	});
}

export function run(): Promise<void> {
	return new Promise((resolve, reject) => {
		try {
			mocha.run(failures => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`));
				} else {
					resolve();
				}
			});
		} catch (error) {
			reject(error);
		}
	});
}
