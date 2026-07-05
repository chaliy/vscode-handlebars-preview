import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

import * as extension from "../../extension";

suite('extension', () => {
	test('activation', () => {
		assert.ok(extension.activate);
	});

	test('opens preview command for handlebars document', async () => {
		const document = await vscode.workspace.openTextDocument(
			path.resolve(__dirname, '../../../src/test/examples/simple.handlebars')
		);

		await vscode.window.showTextDocument(document);
		await vscode.commands.executeCommand('handlebars.preview');

		const webviewTabs = vscode.window.tabGroups.all
			.flatMap(group => group.tabs)
			.filter(tab => tab.input instanceof vscode.TabInputWebview);

		assert.ok(webviewTabs.some(tab => tab.label === 'Handlebars HTML Preview'));
	});
});
