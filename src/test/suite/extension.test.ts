import * as vscode from 'vscode';

import * as extension from "../../extension";
import * as assert from "./assertions";

suite('extension', () => {
	test('activation', () => {
		assert.ok(extension.activate);
	});

	test('opens preview command for handlebars document', async () => {
		const extensionUri = vscode.extensions.getExtension('chaliy.handlebars-preview')?.extensionUri;
		assert.ok(extensionUri);

		const document = await vscode.workspace.openTextDocument(
			vscode.Uri.joinPath(extensionUri, 'src/test/examples/simple.handlebars')
		);

		await vscode.window.showTextDocument(document);
		await vscode.commands.executeCommand('handlebars.preview');

		const webviewTabs = vscode.window.tabGroups.all
			.flatMap(group => group.tabs)
			.filter(tab => tab.input instanceof vscode.TabInputWebview);

		assert.ok(webviewTabs.some(tab => tab.label === 'Handlebars HTML Preview'));
	});

	test('renders handlebars document with adjacent JSON data in preview', async () => {
		const extensionUri = vscode.extensions.getExtension('chaliy.handlebars-preview')?.extensionUri;
		assert.ok(extensionUri);

		const document = await vscode.workspace.openTextDocument(
			vscode.Uri.joinPath(extensionUri, 'src/test/examples/simple.handlebars')
		);

		await vscode.window.showTextDocument(document);
		const html = await vscode.commands.executeCommand<string>('handlebars.preview');

		assert.ok(html);
		assert.doesNotMatch(html, /Super \{\{foo\}\}!/);
		assert.match(html, /Super bar!/);
	});

	test('renders local font references through the preview command', async () => {
		const extensionUri = vscode.extensions.getExtension('chaliy.handlebars-preview')?.extensionUri;
		assert.ok(extensionUri);

		const document = await vscode.workspace.openTextDocument(
			vscode.Uri.joinPath(extensionUri, 'src/test/examples/local-font.handlebars')
		);

		await vscode.window.showTextDocument(document);
		const html = await vscode.commands.executeCommand<string>('handlebars.preview');

		assert.ok(html);
		assert.match(html, /Font bar!/);
		assert.match(html, /font-src/);
		assert.match(html, /preview-local\.woff2/);
		assert.doesNotMatch(html, /url\("\.\/fonts\/preview-local\.woff2"\)/);
	});
});
