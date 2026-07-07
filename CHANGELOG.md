# Changelog

## [Unreleased]

## [2.0.0] - Unreleased

### Highlights

- **VS Code Web and virtual workspace support** - the extension now uses VS Code
  URI and workspace filesystem APIs, exposes a browser entry point, and includes
  browser-based tests with `npm run test:web`.
- **Richer live preview inputs** - previews can load selected partials, read a
  configurable data-file suffix, watch template/data/partial edits, and load
  local `@font-face` assets from the template directory.
- **Safer preview rendering** - webviews run with scripts disabled, use a
  restrictive content security policy, and escape renderer error output before
  showing it in the preview.
- **Helper compatibility** - built-in `compare`, `eq`, and safe identity `eval`
  helpers are available by default, with opt-in custom helper loading for
  trusted desktop workspaces.
- **Source preview mode** - `Handlebars: Open Source Preview` shows escaped
  generated output while preserving whitespace for non-HTML text/code rendering.
- **Modern maintenance and release automation** - the project now builds with
  esbuild, runs GitHub Actions CI for compile/lint/tests/audit/package
  validation, and creates tagged GitHub Releases with automatic Marketplace
  publishing.

### Breaking Changes

- **Minimum supported VS Code version is now 1.125.0.** Users on older VS Code
  versions must upgrade before installing this release.

### What's Changed

* build: upgrade TypeScript, ESLint, VS Code test tooling, and VS Code API types
* build: replace webpack with an esbuild bundle and VS Code Web browser entry
* feat(preview): support VS Code Web and virtual workspaces
* feat(preview): add `.handlebars` and `.hbs` language contributions
* feat(preview): add configurable preview data suffix
* feat(preview): refresh when templates or adjacent JSON data files change
* feat(preview): load selected workspace partial files and refresh on edits
* feat(preview): support local `@font-face` fonts from the template directory
* feat(preview): add configurable preview webview background color
* feat(preview): add opt-in trusted workspace custom helper loading
* feat(preview): add source preview mode for escaped generated output
* fix(preview): disable webview scripts and add a restrictive content security policy
* fix(preview): escape renderer error output before showing it
* fix(preview): add built-in `compare`, `eq`, and safe identity `eval` helpers
* test: add browser-based VS Code Web tests
* test: add regression coverage for JSON context, escaped render errors, command wiring, and rendered preview output
* test: replace the legacy `glob` dependency with a local test-file loader
* test: remove the legacy custom `@vscode/test-electron` runner entrypoint
* ci: add GitHub Actions CI for compile, lint, desktop tests, web tests, audit, and package validation
* ci: add tagged GitHub Release and Marketplace publishing workflows

**Full Changelog**: https://github.com/chaliy/vscode-handlebars-preview/compare/v1.3.2...v2.0.0

## [1.3.2] - 2026-07-04

### What's Changed

* chore(release): refresh package metadata for Marketplace publishing

**Full Changelog**: https://github.com/chaliy/vscode-handlebars-preview/compare/v1.3.1...v1.3.2

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
