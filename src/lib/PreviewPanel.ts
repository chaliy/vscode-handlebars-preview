import { dirname } from "path";
import { existsSync, readFileSync } from "fs";
import * as vscode from 'vscode';

import renderContent from "./renderContent";


function resolveFileOrText(fileName: string): string {
	fileName = fileName?.startsWith("file://") ? fileName.slice(7) : fileName;
	let document = vscode.workspace.textDocuments.find(e => e.fileName === fileName);

	if (document) {
		return document.getText();
	}
	if (dirname(fileName) && existsSync(fileName)) {
		return readFileSync(fileName, "utf8");
	}
	return "";
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		enableScripts: true,
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}

export class PreviewPanel {
	public static currentPanel: PreviewPanel | undefined;

	public static readonly viewType = 'handlebars';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _fileName: string = "";
	private _dataFileName: string = "";
	private _disposables: vscode.Disposable[] = [];

	public static activate(context: vscode.ExtensionContext) {
		if (vscode.window.registerWebviewPanelSerializer) {
			// Make sure we register a serializer in activation event
			vscode.window.registerWebviewPanelSerializer(PreviewPanel.viewType, {
				async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
					// Reset the webview options so we use latest uri for `localResourceRoots`.
					webviewPanel.webview.options = {
						enableScripts: false,
						localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
					};
					PreviewPanel.revive(webviewPanel, context.extensionUri);
				}
			});
		}
	}

	public static createOrShow(extensionUri: vscode.Uri) {
		// If we already have a panel, show it.
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			PreviewPanel.viewType,
			'Handlebars HTML Preview',
			vscode.ViewColumn.Two,
			getWebviewOptions(extensionUri),
		);

		PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri);
	}

	public static update() {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.update();
		}
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this.update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this.update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
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

	private update() {
		this._panel.webview.html = this.generateHtmlPreview();
	}

	private loadPartials() {
		const config = vscode.workspace.getConfiguration();
		const partialUris = config.get<string[]>("handlebars.partials") ?? [];

		const partials: { [key: string]: string } = {};
		partialUris.forEach((uri: string) => {
			let partialName = uri?.split("/")?.pop()?.split(".")[0];
			if (!partialName) {
				return;
			}
			let partialContent = resolveFileOrText(uri);
			partials[partialName] = partialContent;
		});
		return partials;
	}

	private generateHtmlPreview() {
		if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document) {
			const currentFileName = vscode.window.activeTextEditor.document.fileName;

			let dataFileName;
			let fileName;

			if (currentFileName === this._fileName
				|| currentFileName === this._dataFileName) {
				// User switched editor to context, just use stored on
				fileName = this._fileName;
				dataFileName = this._dataFileName;
			} else {
				dataFileName = currentFileName + '.json';
				fileName = currentFileName;
			}

			this._fileName = fileName;
			this._dataFileName = dataFileName;
			const templateSource = resolveFileOrText(fileName);
			const dataSource = resolveFileOrText(dataFileName);
			const partials = this.loadPartials();

			return renderContent(templateSource, dataSource, partials);
		}

		return `
            <body>
                <p>No active text editor selected....</p>
            </body>
        `;
	}
}
