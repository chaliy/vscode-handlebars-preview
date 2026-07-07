import * as vscode from 'vscode';

import * as extension from "../../extension";
import * as assert from "./assertions";

function basenameWithoutExtension(uri: vscode.Uri): string {
	const basename = uri.path.split('/').pop() ?? '';
	return basename.replace(/\.[^/.]+$/, '');
}

function fullDocumentRange(document: vscode.TextDocument): vscode.Range {
	const lastLine = document.lineAt(document.lineCount - 1);
	return new vscode.Range(0, 0, lastLine.lineNumber, lastLine.range.end.character);
}

function delay(ms: number): Promise<void> {
	return new Promise(resolve => globalThis.setTimeout(resolve, ms));
}

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

	test('refreshes preview when a configured partial document changes', async () => {
		const previousPartials = vscode.workspace.getConfiguration("handlebars").get<string[]>("partials");
		const partialDocument = await vscode.workspace.openTextDocument({
			language: 'handlebars',
			content: 'First'
		});
		const partialName = basenameWithoutExtension(partialDocument.uri);
		const templateDocument = await vscode.workspace.openTextDocument({
			language: 'handlebars',
			content: `Hello {{> ${partialName}}}!`
		});

		try {
			await vscode.workspace
				.getConfiguration("handlebars")
				.update("partials", [partialDocument.uri.toString()], vscode.ConfigurationTarget.Global);

			await vscode.window.showTextDocument(templateDocument);
			const initialHtml = await vscode.commands.executeCommand<string>('handlebars.preview');

			assert.ok(initialHtml);
			assert.match(initialHtml, /Hello First!/);

			await vscode.window.showTextDocument(partialDocument);
			const edit = new vscode.WorkspaceEdit();
			edit.replace(partialDocument.uri, fullDocumentRange(partialDocument), "Second");
			assert.ok(await vscode.workspace.applyEdit(edit));

			await delay(150);
			const refreshedHtml = await vscode.commands.executeCommand<string>('handlebars.preview');

			assert.ok(refreshedHtml);
			assert.match(refreshedHtml, /Hello Second!/);
		} finally {
			await vscode.workspace
				.getConfiguration("handlebars")
				.update("partials", previousPartials, vscode.ConfigurationTarget.Global);
		}
	});

	test('applies configured preview background color', async () => {
		const extensionUri = vscode.extensions.getExtension('chaliy.handlebars-preview')?.extensionUri;
		assert.ok(extensionUri);

		const config = vscode.workspace.getConfiguration('handlebarsPreview');
		const previousBackgroundColor = config.inspect<string>('backgroundColor')?.globalValue;

		try {
			await config.update('backgroundColor', '#ffffff', vscode.ConfigurationTarget.Global);

			const document = await vscode.workspace.openTextDocument(
				vscode.Uri.joinPath(extensionUri, 'src/test/examples/simple.handlebars')
			);

			await vscode.window.showTextDocument(document);
			const html = await vscode.commands.executeCommand<string>('handlebars.preview');

			assert.ok(html);
			assert.match(html, /<body style="background-color: #ffffff;">/);
		} finally {
			await config.update('backgroundColor', previousBackgroundColor, vscode.ConfigurationTarget.Global);
		}
	});
});
