import {
    workspace, window, commands,
    ExtensionContext, TextEditorSelectionChangeEvent, TextDocumentChangeEvent,
    ConfigurationTarget
} from "vscode";

import { PreviewPanel } from './lib/PreviewPanel';

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        // Global handlers
        window.onDidChangeTextEditorSelection((e: TextEditorSelectionChangeEvent) => {
            if (e.textEditor === window.activeTextEditor) {
                PreviewPanel.update();
            }
        }),
        workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
            // Listen only to current active editor changes
            if (e.document === window.activeTextEditor?.document) {
                PreviewPanel.update();
            }
        }),
        // Commands
        commands.registerCommand('handlebars.preview', () => {
            PreviewPanel.createOrShow(context.extensionUri);
        }),
        commands.registerCommand('handlebars.loadPartials', () => {
            window.showOpenDialog({
                canSelectMany: true,
                canSelectFiles: true,
                canSelectFolders: false,
            }).then((uris: any) => {
                const config = workspace.getConfiguration("handlebars");
                const uriStrings = uris.map((uri: any) => uri.toString());
                config.update("partials", uriStrings, ConfigurationTarget.Workspace);
            });
        })
    );

    PreviewPanel.activate(context);
}

export function deactivate() {
}
