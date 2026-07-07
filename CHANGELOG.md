# Change Log

## [2.0.0] - Unreleased
- Breaking change: minimum supported VS Code version is now 1.125.0.
- Upgrade TypeScript, ESLint, VS Code test tooling, and VS Code API types.
- Replace webpack with an esbuild bundle that also exposes a VS Code Web `browser` entry.
- Use VS Code URI and workspace filesystem APIs so previews work in web and virtual workspaces.
- Add browser-based VS Code Web tests with `npm run test:web`.
- Add `.handlebars` and `.hbs` language contributions and a configurable preview data suffix.
- Refresh previews when the template or adjacent JSON data file changes on disk.
- Harden preview webviews by disabling scripts and adding a restrictive content security policy.
- Support local `@font-face` fonts referenced from the active template directory.
- Escape renderer error output before showing it in the preview.
- Replace the legacy `glob` test dependency with a local test-file loader.
- Remove the legacy custom `@vscode/test-electron` runner entrypoint.
- Add regression coverage for missing/invalid JSON context, escaped render errors, preview command wiring, and rendered preview output.
- Add GitHub Actions CI for compile, lint, desktop tests, web tests, audit, and package validation.
- Add `Handlebars: Load Partials` for workspace-configured partial files.
- Add opt-in custom helper loading for trusted desktop workspaces through
  `handlebarsPreview.unsafeHelpers.*` settings.
- Add `handlebarsPreview.backgroundColor` to override the preview webview background.
- Add built-in `compare`, `eq`, and safe identity `eval` compatibility helpers.

## [1.3.1] - 2022-07-19
- Extension now contributes to Explorer context menu

## [1.3.0] - 2022-07-19
- Breaking change, default key bindings now `ctrl+k h`, addressing [#11](https://github.com/chaliy/vscode-handlebars-preview/issues/11)
- Extension now uses webpack to bundle files and therefore it should run faster


## [1.2.0] - 2022-07-11
- Preview extension reimplemented using Webview API

## [1.0.0] - 2017-02-24
- Initial release
- Preview simple Handlebars
- Keybindings `ctrl+p j`
