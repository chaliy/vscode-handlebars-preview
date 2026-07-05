import {
    workspace, window, commands,
    ExtensionContext, TextDocumentChangeEvent
} from "vscode";

import { PreviewPanel } from './lib/PreviewPanel';

export function activate(context: ExtensionContext) {
    const watcher = workspace.createFileSystemWatcher('**/*');

    context.subscriptions.push(
        watcher,
        watcher.onDidChange(uri => PreviewPanel.refreshForUri(uri)),
        watcher.onDidCreate(uri => PreviewPanel.refreshForUri(uri)),
        watcher.onDidDelete(uri => PreviewPanel.refreshForUri(uri)),
        window.onDidChangeActiveTextEditor(() => {
            PreviewPanel.updateFromActiveEditor();
        }),
        workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('handlebarsPreview.dataFileSuffix')) {
                PreviewPanel.updateConfiguration();
            }
        }),
        workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
            PreviewPanel.refreshForUri(e.document.uri);
        }),
        commands.registerCommand('handlebars.preview', () => PreviewPanel.createOrShow(context.extensionUri))
    );

    PreviewPanel.activate(context);
}

export function deactivate() {
}
