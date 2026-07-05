import * as vscode from 'vscode';

import renderContent from "./renderContent";

const textDecoder = new globalThis.TextDecoder('utf-8');

function uriEquals(left: vscode.Uri | undefined, right: vscode.Uri | undefined): boolean {
	return left?.toString() === right?.toString();
}

export function getDataUriForTemplate(templateUri: vscode.Uri, dataFileSuffix: string): vscode.Uri {
	return templateUri.with({ path: `${templateUri.path}${dataFileSuffix}` });
}

function getDataFileSuffix(): string {
	const configured = vscode.workspace
		.getConfiguration('handlebarsPreview')
		.get<string>('dataFileSuffix');

	return configured?.trim() || '.json';
}

async function resolveUriOrText(uri: vscode.Uri): Promise<string> {
	const document = vscode.workspace.textDocuments.find(e => uriEquals(e.uri, uri));

	if (document) {
		return document.getText();
	}

	try {
		const content = await vscode.workspace.fs.readFile(uri);
		return textDecoder.decode(content);
	} catch {
		return "";
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		enableScripts: false,
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}

function renderWebviewDocument(webview: vscode.Webview, body: string): string {
	const contentSecurityPolicy = [
		"default-src 'none'",
		`img-src ${webview.cspSource} https: data:`,
		`style-src ${webview.cspSource} 'unsafe-inline'`
	].join("; ");

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Handlebars HTML Preview</title>
</head>
<body>
${body}
</body>
</html>`;
}

export class PreviewPanel {
	public static currentPanel: PreviewPanel | undefined;

	public static readonly viewType = 'handlebars';

	private readonly _panel: vscode.WebviewPanel;
	private _templateUri: vscode.Uri | undefined;
	private _dataUri: vscode.Uri | undefined;
	private _disposables: vscode.Disposable[] = [];
	private _updateSequence = 0;

	public static activate(context: vscode.ExtensionContext) {
		if (vscode.window.registerWebviewPanelSerializer) {
			// Make sure we register a serializer in activation event
			vscode.window.registerWebviewPanelSerializer(PreviewPanel.viewType, {
				async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
					// Reset the webview options so we use latest uri for `localResourceRoots`.
					webviewPanel.webview.options = {
						enableScripts: false,
						localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
					};
					PreviewPanel.revive(webviewPanel);
				}
			});
		}
	}

	public static async createOrShow(extensionUri: vscode.Uri): Promise<string | undefined> {
		// If we already have a panel, show it.
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
			return PreviewPanel.currentPanel.update({ useActiveEditor: true });
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			PreviewPanel.viewType,
			'Handlebars HTML Preview',
			vscode.ViewColumn.Two,
			getWebviewOptions(extensionUri),
		);

		PreviewPanel.currentPanel = new PreviewPanel(panel);
		return PreviewPanel.currentPanel.update({ useActiveEditor: true });
	}

	public static revive(panel: vscode.WebviewPanel) {
		PreviewPanel.currentPanel = new PreviewPanel(panel);
	}

	public static update() {
		if (PreviewPanel.currentPanel) {
			void PreviewPanel.currentPanel.update({ useActiveEditor: false });
		}
	}

	public static updateFromActiveEditor() {
		if (PreviewPanel.currentPanel) {
			void PreviewPanel.currentPanel.update({ useActiveEditor: true });
		}
	}

	public static refreshForUri(uri: vscode.Uri) {
		if (PreviewPanel.currentPanel?.tracksUri(uri)) {
			void PreviewPanel.currentPanel.update({ useActiveEditor: false });
		}
	}

	public static updateConfiguration() {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.refreshDataUri();
			void PreviewPanel.currentPanel.update({ useActiveEditor: false });
		}
	}

	private constructor(panel: vscode.WebviewPanel) {
		this._panel = panel;

		// Set the webview's initial html content
		void this.update({ useActiveEditor: true });

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			() => {
				if (this._panel.visible) {
					void this.update({ useActiveEditor: false });
				}
			},
			null,
			this._disposables
		);

	}

	public dispose() {
		PreviewPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private async update(options: { useActiveEditor: boolean }): Promise<string> {
		const updateSequence = ++this._updateSequence;
		const body = await this.generateHtmlPreview(options.useActiveEditor);
		const html = renderWebviewDocument(this._panel.webview, body);

		if (updateSequence === this._updateSequence) {
			this._panel.webview.html = html;
		}

		return html;
	}

	private async generateHtmlPreview(useActiveEditor: boolean): Promise<string> {
		const activeDocument = vscode.window.activeTextEditor?.document;

		if (useActiveEditor && activeDocument && !this.tracksUri(activeDocument.uri)) {
			this.setPreviewSource(activeDocument.uri);
		} else if (!this._templateUri && activeDocument) {
			this.setPreviewSource(activeDocument.uri);
		}

		if (this._templateUri && this._dataUri) {
			const templateSource = await resolveUriOrText(this._templateUri);
			const dataSource = await resolveUriOrText(this._dataUri);

			return renderContent(templateSource, dataSource);
		}

		return `
            <p>No active text editor selected....</p>
        `;
	}

	private setPreviewSource(templateUri: vscode.Uri) {
		this._templateUri = templateUri;
		this._dataUri = getDataUriForTemplate(templateUri, getDataFileSuffix());
	}

	private refreshDataUri() {
		if (this._templateUri) {
			this._dataUri = getDataUriForTemplate(this._templateUri, getDataFileSuffix());
		}
	}

	private tracksUri(uri: vscode.Uri): boolean {
		return uriEquals(this._templateUri, uri) || uriEquals(this._dataUri, uri);
	}
}
