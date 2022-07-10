import {
    workspace, window, commands,
    ExtensionContext, TextEditorSelectionChangeEvent, TextDocumentChangeEvent
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
        })
    );

    PreviewPanel.activate(context);
}

export function deactivate() {
}
