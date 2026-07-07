import * as vscode from 'vscode';

import { HelperRegistrations, normalizeHelperModule } from "./helpers";
import renderContent, { Partials } from "./renderContent";

const textDecoder = new globalThis.TextDecoder('utf-8');
const supportedFontExtensions = new Set(['.woff', '.woff2', '.ttf', '.otf', '.eot']);
const supportedStylesheetExtensions = new Set(['.css']);
const cssImportStringPattern = /@import\s+(["'])(.*?)\1/gi;
const cssUrlPattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi;
const refreshDebounceMs = 75;

type WebviewResourceAdapter = Pick<vscode.Webview, 'asWebviewUri' | 'cspSource'>;

type DynamicRequire = {
	(modulePath: string): unknown;
	resolve(modulePath: string): string;
	cache: Record<string, unknown>;
};

declare const require: DynamicRequire | undefined;

function uriEquals(left: vscode.Uri | undefined, right: vscode.Uri | undefined): boolean {
	return left?.toString() === right?.toString();
}

function uriFromConfigurationValue(value: string): vscode.Uri {
	return /^[a-z][a-z0-9+.-]*:/i.test(value) ? vscode.Uri.parse(value) : vscode.Uri.file(value);
}

export function getPartialUrisFromConfigurationValues(values: readonly string[]): vscode.Uri[] {
	return values
		.map(value => value.trim())
		.filter(Boolean)
		.map(uriFromConfigurationValue);
}

function basenameWithoutExtension(uri: vscode.Uri): string {
	const basename = uri.path.split('/').pop() ?? '';
	return basename.replace(/\.[^/.]+$/, '');
}

function getDirectoryUri(uri: vscode.Uri): vscode.Uri {
	const path = uri.path.replace(/\/?[^/]*$/, '') || '/';
	return uri.with({ path, query: '', fragment: '' });
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

function getUnsafeHelpersConfiguration(): { enabled: boolean; file: string } {
	const config = vscode.workspace.getConfiguration('handlebarsPreview.unsafeHelpers');

	return {
		enabled: config.get<boolean>('enabled') ?? false,
		file: config.get<string>('file')?.trim() ?? ''
	};
}

function getConfiguredPartialUris(): vscode.Uri[] {
	const config = vscode.workspace.getConfiguration("handlebars");
	return getPartialUrisFromConfigurationValues(config.get<string[]>("partials") ?? []);
}

export function sanitizeBackgroundColor(value: string | undefined): string | undefined {
	const color = value?.trim();

	if (!color) {
		return undefined;
	}

	if (/^#[\da-f]{3,4}(?:[\da-f]{3,4})?$/i.test(color)) {
		return color;
	}

	if (/^[a-z]+$/i.test(color)) {
		return color;
	}

	const number = String.raw`(?:\d+|\d*\.\d+)`;
	const rgbChannel = String.raw`${number}%?`;
	const alphaChannel = String.raw`${number}%?`;
	const hue = String.raw`${number}(?:deg|grad|rad|turn)?`;
	const percentage = String.raw`${number}%`;
	const rgbPattern = new RegExp(String.raw`^rgba?\(\s*${rgbChannel}\s*,\s*${rgbChannel}\s*,\s*${rgbChannel}(?:\s*,\s*${alphaChannel})?\s*\)$`, 'i');
	const hslPattern = new RegExp(String.raw`^hsla?\(\s*${hue}\s*,\s*${percentage}\s*,\s*${percentage}(?:\s*,\s*${alphaChannel})?\s*\)$`, 'i');

	return rgbPattern.test(color) || hslPattern.test(color) ? color : undefined;
}

function getBackgroundColor(): string | undefined {
	const configured = vscode.workspace
		.getConfiguration('handlebarsPreview')
		.get<string>('backgroundColor');

	return sanitizeBackgroundColor(configured);
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

async function uriExists(uri: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(uri);
		return true;
	} catch {
		return false;
	}
}

function resolveConfiguredHelperUri(templateUri: vscode.Uri, configuredFile: string): vscode.Uri {
	if (/^[a-z][a-z0-9+.-]*:/i.test(configuredFile)) {
		return vscode.Uri.parse(configuredFile);
	}

	if (/^(\/|[a-zA-Z]:[\\/])/.test(configuredFile)) {
		return vscode.Uri.file(configuredFile);
	}

	const workspaceFolder = vscode.workspace.getWorkspaceFolder(templateUri);
	const baseUri = workspaceFolder?.uri ?? getDirectoryUri(templateUri);

	return vscode.Uri.joinPath(baseUri, configuredFile);
}

export function getHelperUriForTemplate(templateUri: vscode.Uri, configuredFile = ''): vscode.Uri {
	if (configuredFile.trim()) {
		return resolveConfiguredHelperUri(templateUri, configuredFile.trim());
	}

	return templateUri.with({ path: `${templateUri.path}.js` });
}

function getNodeRequire(): DynamicRequire | undefined {
	if (typeof require !== "function" || !require.cache || typeof require.resolve !== "function") {
		return undefined;
	}

	return require;
}

export function getWebviewOptions(extensionUri: vscode.Uri, templateUri?: vscode.Uri): vscode.WebviewOptions {
	const localResourceRoots = [vscode.Uri.joinPath(extensionUri, 'media')];

	if (templateUri?.scheme && templateUri.scheme !== 'untitled') {
		localResourceRoots.push(getDirectoryUri(templateUri));
	}

	return {
		enableScripts: false,
		localResourceRoots
	};
}

export function getWatchDirectoriesForUris(uris: readonly vscode.Uri[]): vscode.Uri[] {
	const seen = new Set<string>();
	const directories: vscode.Uri[] = [];

	uris.forEach(uri => {
		if (uri.scheme === 'untitled') {
			return;
		}

		const directory = getDirectoryUri(uri);
		const key = directory.toString();

		if (!seen.has(key)) {
			seen.add(key);
			directories.push(directory);
		}
	});

	return directories;
}

function splitResourceReference(value: string): { path: string; query: string; fragment: string } {
	const hashIndex = value.indexOf('#');
	const withoutFragment = hashIndex === -1 ? value : value.slice(0, hashIndex);
	const fragment = hashIndex === -1 ? '' : value.slice(hashIndex + 1);
	const queryIndex = withoutFragment.indexOf('?');

	return {
		path: queryIndex === -1 ? withoutFragment : withoutFragment.slice(0, queryIndex),
		query: queryIndex === -1 ? '' : withoutFragment.slice(queryIndex + 1),
		fragment
	};
}

function getPathExtension(path: string): string {
	const basename = path.split('/').pop() ?? '';
	const extensionIndex = basename.lastIndexOf('.');
	return extensionIndex === -1 ? '' : basename.slice(extensionIndex).toLowerCase();
}

function isRelativeLocalReference(value: string): boolean {
	const trimmed = value.trim();
	return Boolean(trimmed)
		&& !trimmed.startsWith('#')
		&& !trimmed.startsWith('/')
		&& !trimmed.startsWith('//')
		&& !/^[a-z][a-z0-9+.-]*:/i.test(trimmed);
}

function isUriWithinRoot(uri: vscode.Uri, root: vscode.Uri): boolean {
	if (uri.scheme !== root.scheme || uri.authority !== root.authority) {
		return false;
	}

	const rootPath = root.path.replace(/\/+$/, '');
	const uriPath = uri.path.replace(/\/+$/, '');

	if (!rootPath || rootPath === '/') {
		return uri.path.startsWith('/');
	}

	return uriPath === rootPath || uri.path.startsWith(`${rootPath}/`);
}

function resolveTemplateResourceUri(templateDirectoryUri: vscode.Uri, value: string): vscode.Uri | undefined {
	const trimmed = value.trim();

	if (!isRelativeLocalReference(trimmed)) {
		return undefined;
	}

	const { path, query, fragment } = splitResourceReference(trimmed);

	let segments: string[];
	try {
		segments = path.split('/').map(segment => decodeURIComponent(segment));
	} catch {
		return undefined;
	}

	const uri = vscode.Uri.joinPath(templateDirectoryUri, ...segments).with({ query, fragment });
	return isUriWithinRoot(uri, templateDirectoryUri) ? uri : undefined;
}

function cssString(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function htmlAttribute(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function isCssImportUrl(css: string, offset: number): boolean {
	const beforeUrl = css.slice(0, offset);
	const statementStart = Math.max(
		beforeUrl.lastIndexOf(';'),
		beforeUrl.lastIndexOf('{'),
		beforeUrl.lastIndexOf('}')
	) + 1;

	return /@import\s*$/i.test(beforeUrl.slice(statementStart));
}

function rewriteResourceReference(
	value: string,
	templateDirectoryUri: vscode.Uri,
	webview: Pick<vscode.Webview, 'asWebviewUri'>
): string | undefined {
	const uri = resolveTemplateResourceUri(templateDirectoryUri, value);
	return uri ? webview.asWebviewUri(uri).toString() : undefined;
}

function rewriteCssImportStrings(
	css: string,
	templateDirectoryUri: vscode.Uri,
	webview: Pick<vscode.Webview, 'asWebviewUri'>
): string {
	return css.replace(cssImportStringPattern, (match, _quote: string, value: string) => {
		const { path } = splitResourceReference(value.trim());

		if (!supportedStylesheetExtensions.has(getPathExtension(path))) {
			return match;
		}

		const rewritten = rewriteResourceReference(value, templateDirectoryUri, webview);
		return rewritten ? `@import url("${cssString(rewritten)}")` : match;
	});
}

function rewriteCssUrls(
	css: string,
	templateDirectoryUri: vscode.Uri,
	webview: Pick<vscode.Webview, 'asWebviewUri'>
): string {
	return rewriteCssImportStrings(css, templateDirectoryUri, webview).replace(cssUrlPattern, (match, doubleQuoted: string | undefined, singleQuoted: string | undefined, unquoted: string | undefined, offset: number, currentCss: string) => {
		const value = doubleQuoted ?? singleQuoted ?? unquoted ?? '';
		const { path } = splitResourceReference(value.trim());
		const extension = getPathExtension(path);

		if (!supportedFontExtensions.has(extension)
			&& !(supportedStylesheetExtensions.has(extension) && isCssImportUrl(currentCss, offset))) {
			return match;
		}

		const rewritten = rewriteResourceReference(value, templateDirectoryUri, webview);
		return rewritten ? `url("${cssString(rewritten)}")` : match;
	});
}

function getHtmlAttribute(tag: string, name: string): string | undefined {
	const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
	const match = tag.match(pattern);
	return match?.[1] ?? match?.[2] ?? match?.[3];
}

function rewriteStylesheetLinks(
	body: string,
	templateDirectoryUri: vscode.Uri,
	webview: Pick<vscode.Webview, 'asWebviewUri'>
): string {
	return body.replace(/<link\b[^>]*>/gi, tag => {
		const rel = getHtmlAttribute(tag, 'rel');
		const href = getHtmlAttribute(tag, 'href');

		if (!rel || !href || !/\bstylesheet\b/i.test(rel)) {
			return tag;
		}

		const { path } = splitResourceReference(href.trim());

		if (!supportedStylesheetExtensions.has(getPathExtension(path))) {
			return tag;
		}

		const rewritten = rewriteResourceReference(href, templateDirectoryUri, webview);
		return rewritten
			? tag.replace(/\bhref\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, `href="${htmlAttribute(rewritten)}"`)
			: tag;
	});
}

export function rewriteLocalFontUrls(
	body: string,
	templateUri: vscode.Uri,
	webview: Pick<vscode.Webview, 'asWebviewUri'>
): string {
	const templateDirectoryUri = getDirectoryUri(templateUri);

	return rewriteStylesheetLinks(body, templateDirectoryUri, webview)
		.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_match, open: string, css: string, close: string) =>
			`${open}${rewriteCssUrls(css, templateDirectoryUri, webview)}${close}`
		)
		.replace(/(\sstyle\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi, (match, prefix: string, doubleQuoted: string | undefined, singleQuoted: string | undefined) => {
			const quote = doubleQuoted === undefined ? "'" : '"';
			const css = doubleQuoted ?? singleQuoted;

			if (css === undefined) {
				return match;
			}

			return `${prefix}${quote}${rewriteCssUrls(css, templateDirectoryUri, webview)}${quote}`;
		});
}

export function renderWebviewDocument(
	webview: WebviewResourceAdapter,
	body: string,
	templateUri?: vscode.Uri,
	backgroundColor?: string
): string {
	const renderedBody = templateUri ? rewriteLocalFontUrls(body, templateUri, webview) : body;
	const contentSecurityPolicy = [
		"default-src 'none'",
		`img-src ${webview.cspSource} https: data:`,
		`font-src ${webview.cspSource}`,
		`style-src ${webview.cspSource} 'unsafe-inline'`
	].join("; ");
	const safeBackgroundColor = sanitizeBackgroundColor(backgroundColor);
	const bodyAttributes = safeBackgroundColor ? ` style="background-color: ${safeBackgroundColor};"` : "";

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Handlebars HTML Preview</title>
</head>
<body${bodyAttributes}>
${renderedBody}
</body>
</html>`;
}

export class PreviewPanel {
	public static currentPanel: PreviewPanel | undefined;

	public static readonly viewType = 'handlebars';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _templateUri: vscode.Uri | undefined;
	private _dataUri: vscode.Uri | undefined;
	private _helperUri: vscode.Uri | undefined;
	private _partialUris: vscode.Uri[] = [];
	private _disposables: vscode.Disposable[] = [];
	private _fileWatcherDisposables: vscode.Disposable[] = [];
	private _refreshTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
	private _updateSequence = 0;

	public static activate(context: vscode.ExtensionContext) {
		if (vscode.window.registerWebviewPanelSerializer) {
			// Make sure we register a serializer in activation event
			vscode.window.registerWebviewPanelSerializer(PreviewPanel.viewType, {
				async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
					// Reset the webview options so we use latest uri for `localResourceRoots`.
					webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
					PreviewPanel.revive(webviewPanel, context.extensionUri);
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

		PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri);
		return PreviewPanel.currentPanel.update({ useActiveEditor: true });
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri);
	}

	public static update() {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.scheduleUpdate({ useActiveEditor: false });
		}
	}

	public static updateFromActiveEditor() {
		if (PreviewPanel.currentPanel) {
			void PreviewPanel.currentPanel.update({ useActiveEditor: true });
		}
	}

	public static refreshForUri(uri: vscode.Uri) {
		if (PreviewPanel.currentPanel?.tracksUri(uri)) {
			PreviewPanel.currentPanel.scheduleUpdate({ useActiveEditor: false });
		}
	}

	public static updateConfiguration() {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.refreshRelatedUris();
			void PreviewPanel.currentPanel.update({ useActiveEditor: false });
		}
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

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
		this.clearScheduledUpdate();
		this.disposeFileWatchers();

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private scheduleUpdate(options: { useActiveEditor: boolean }) {
		this.clearScheduledUpdate();
		this._refreshTimer = globalThis.setTimeout(() => {
			this._refreshTimer = undefined;
			void this.update(options);
		}, refreshDebounceMs);
	}

	private clearScheduledUpdate() {
		if (this._refreshTimer !== undefined) {
			globalThis.clearTimeout(this._refreshTimer);
			this._refreshTimer = undefined;
		}
	}

	private async update(options: { useActiveEditor: boolean }): Promise<string> {
		this.clearScheduledUpdate();
		const updateSequence = ++this._updateSequence;
		const body = await this.generateHtmlPreview(options.useActiveEditor);
		const html = renderWebviewDocument(this._panel.webview, body, this._templateUri, getBackgroundColor());

		if (updateSequence === this._updateSequence) {
			this._panel.webview.html = html;
		}

		return html;
	}

	private async loadPartials(): Promise<Partials> {
		const partials: Partials = {};

		await Promise.all(this._partialUris.map(async uri => {
			const partialName = basenameWithoutExtension(uri);

			if (partialName) {
				partials[partialName] = await resolveUriOrText(uri);
			}
		}));

		return partials;
	}

	private async loadHelpers(): Promise<{ helpers?: HelperRegistrations; error?: Error }> {
		const config = getUnsafeHelpersConfiguration();

		if (!config.enabled || !this._templateUri || !this._helperUri) {
			return {};
		}

		if (!vscode.workspace.isTrusted) {
			return {
				error: new Error("Custom Handlebars helpers are disabled until the workspace is trusted because loading helpers executes workspace JavaScript.")
			};
		}

		if (this._helperUri.scheme !== 'file') {
			return {
				error: new Error(`Custom Handlebars helpers can only be loaded from local file paths. Got ${this._helperUri.toString()}.`)
			};
		}

		const exists = await uriExists(this._helperUri);

		if (!exists) {
			return config.file
				? { error: new Error(`Configured Handlebars helper file was not found: ${this._helperUri.toString()}.`) }
				: {};
		}

		const nodeRequire = getNodeRequire();

		if (!nodeRequire) {
			return {
				error: new Error("Custom Handlebars helpers require the desktop extension host and are not available in VS Code for the Web.")
			};
		}

		try {
			const modulePath = this._helperUri.fsPath;
			const resolvedPath = nodeRequire.resolve(modulePath);
			delete nodeRequire.cache[resolvedPath];

			return { helpers: normalizeHelperModule(nodeRequire(modulePath)) };
		} catch (error) {
			return {
				error: new Error(`Failed to load Handlebars helpers from ${this._helperUri.toString()}: ${error}`)
			};
		}
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
			const partials = await this.loadPartials();
			const helpers = await this.loadHelpers();

			return renderContent(templateSource, dataSource, partials, helpers.helpers, helpers.error);
		}

		return `
            <p>No active text editor selected....</p>
        `;
	}

	private setPreviewSource(templateUri: vscode.Uri) {
		this._templateUri = templateUri;
		this._panel.webview.options = getWebviewOptions(this._extensionUri, templateUri);
		this.refreshRelatedUris();
	}

	private refreshRelatedUris() {
		if (this._templateUri) {
			this._dataUri = getDataUriForTemplate(this._templateUri, getDataFileSuffix());
			this._helperUri = getHelperUriForTemplate(this._templateUri, getUnsafeHelpersConfiguration().file);
			this._partialUris = getConfiguredPartialUris();
			this.updateFileWatchers();
		}
	}

	private tracksUri(uri: vscode.Uri): boolean {
		return uriEquals(this._templateUri, uri)
			|| uriEquals(this._dataUri, uri)
			|| uriEquals(this._helperUri, uri)
			|| this._partialUris.some(partialUri => uriEquals(partialUri, uri));
	}

	private getTrackedUris(): vscode.Uri[] {
		return [
			this._templateUri,
			this._dataUri,
			this._helperUri,
			...this._partialUris
		].filter((uri): uri is vscode.Uri => uri !== undefined);
	}

	private disposeFileWatchers() {
		while (this._fileWatcherDisposables.length) {
			const disposable = this._fileWatcherDisposables.pop();
			disposable?.dispose();
		}
	}

	private updateFileWatchers() {
		this.disposeFileWatchers();

		getWatchDirectoriesForUris(this.getTrackedUris()).forEach(directory => {
			const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(directory, '*'));
			this._fileWatcherDisposables.push(
				watcher,
				watcher.onDidChange(uri => PreviewPanel.refreshForUri(uri)),
				watcher.onDidCreate(uri => PreviewPanel.refreshForUri(uri)),
				watcher.onDidDelete(uri => PreviewPanel.refreshForUri(uri))
			);
		});
	}
}
