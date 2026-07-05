import { run as runMocha, setup } from './mochaTestRunner';

export async function run(): Promise<void> {
	setup();

	await import('../suite/extension.test.js');
	await import('../suite/lib/PreviewPanel.test.js');
	await import('../suite/lib/renderContent.test.js');

	await runMocha();
}
