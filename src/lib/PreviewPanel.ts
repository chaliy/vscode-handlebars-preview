import { dirname, parse } from "path";
import { existsSync, readFileSync } from "fs";
import * as vscode from 'vscode';

import renderContent, { Partials } from "./renderContent";


function resolveFileOrText(fileName: string): string {
    fileName = fileName?.startsWith("file://") ? vscode.Uri.parse(fileName).fsPath : fileName;
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
	private _fileName: string = "";
    private _dataFileName: string = "";
	private _disposables: vscode.Disposable[] = [];

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

		PreviewPanel.currentPanel = new PreviewPanel(panel);
	}

	public static revive(panel: vscode.WebviewPanel) {
		PreviewPanel.currentPanel = new PreviewPanel(panel);
	}

	public static update() {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.update();
		}
	}

	private constructor(panel: vscode.WebviewPanel) {
		this._panel = panel;

		// Set the webview's initial html content
		this.update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			() => {
				if (this._panel.visible) {
					this.update();
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

	private update() {
		this._panel.webview.html = renderWebviewDocument(this._panel.webview, this.generateHtmlPreview());
	}

	private loadPartials(): Partials {
		const config = vscode.workspace.getConfiguration("handlebars");
		const partialUris = config.get<string[]>("partials") ?? [];

		const partials: Partials = {};
		partialUris.forEach((uri: string) => {
			const fileName = uri?.startsWith("file://") ? vscode.Uri.parse(uri).fsPath : uri;
			const partialName = parse(fileName).name;
			if (!partialName) {
				return;
			}
			partials[partialName] = resolveFileOrText(fileName);
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
            <p>No active text editor selected....</p>
        `;
	}
}
