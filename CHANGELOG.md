# Change Log

## [2.0.0] - Unreleased
- Breaking change: minimum supported VS Code version is now 1.125.0.
- Upgrade TypeScript, ESLint, VS Code test tooling, webpack CLI, and VS Code API types.
- Harden preview webviews by disabling scripts and adding a restrictive content security policy.
- Escape renderer error output before showing it in the preview.
- Replace the legacy `glob` test dependency with a local test-file loader.
- Add regression coverage for missing/invalid JSON context, escaped render errors, and preview command wiring.
- Add GitHub Actions CI for compile, lint, test, audit, and package validation.
- Add `Handlebars: Load Partials` for workspace-configured partial files.

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
