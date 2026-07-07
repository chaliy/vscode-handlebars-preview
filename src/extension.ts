import {
    workspace, window, commands,
    ExtensionContext, TextDocumentChangeEvent, ConfigurationTarget, Uri
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
            if (e.affectsConfiguration('handlebarsPreview.dataFileSuffix')
                || e.affectsConfiguration('handlebars.partials')
                || e.affectsConfiguration('handlebarsPreview.unsafeHelpers')) {
                PreviewPanel.updateConfiguration();
            }
        }),
        workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
            PreviewPanel.refreshForUri(e.document.uri);
        }),
        commands.registerCommand('handlebars.preview', () => PreviewPanel.createOrShow(context.extensionUri)),
        commands.registerCommand('handlebars.loadPartials', async () => {
            const uris = await window.showOpenDialog({
                canSelectMany: true,
                canSelectFiles: true,
                canSelectFolders: false,
            });

            if (!uris) {
                return;
            }

            const config = workspace.getConfiguration("handlebars");
            const uriStrings = uris.map((uri: Uri) => uri.toString());
            await config.update("partials", uriStrings, ConfigurationTarget.Workspace);
            PreviewPanel.update();
        }),
        commands.registerCommand('handlebars.enableUnsafeHelpers', async () => {
            const choice = await window.showWarningMessage(
                'Custom Handlebars helpers execute JavaScript from this workspace in the extension host. Enable only for workspaces you trust.',
                { modal: true },
                'Enable'
            );

            if (choice !== 'Enable') {
                return;
            }

            const config = workspace.getConfiguration('handlebarsPreview.unsafeHelpers');
            await config.update('enabled', true, ConfigurationTarget.Workspace);
            PreviewPanel.updateConfiguration();
        })
    );

    PreviewPanel.activate(context);
}

export function deactivate() {
}
