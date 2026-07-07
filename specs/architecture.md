# Architecture

## Status

Active

## Purpose

Define the durable boundaries of the Handlebars Preview extension so feature
work stays small, testable, and aligned with VS Code extension behavior.

## Requirements

- Extension activation remains command-driven through `handlebars.preview`.
- The extension remains web-compatible and exposes a `browser` entry in
  `package.json`.
- Command wiring and VS Code API integration belong near `src/extension.ts`.
- Preview panel state, lifecycle, editor subscriptions, and webview updates
  belong in `src/lib/PreviewPanel.ts`.
- Template rendering and data loading belong in focused library code under
  `src/lib/`.
- Runtime code must use `vscode.Uri` and `vscode.workspace.fs` for workspace
  file access instead of Node `fs` or `path` APIs.
- Rendering code must be usable from tests without requiring a running VS Code
  window when practical.
- The default preview data file convention remains `template.handlebars.json`;
  the appended suffix is configurable with `handlebarsPreview.dataFileSuffix`.
- Webview output should be generated from compiled Handlebars and the matching
  JSON context; missing or invalid context should fail predictably and be
  covered by tests.
- Preview updates should refresh when the active template, its open text
  document, or its adjacent data file changes.
- Configured partial files are loaded by the preview panel and passed into the
  renderer by basename without requiring VS Code APIs in renderer tests.
- Custom helper modules are disabled by default and must require explicit
  workspace configuration or the enable command before workspace JavaScript is
  executed.
- Custom helper loading is allowed only in trusted desktop workspaces and only
  from the configured helper file or the active template's adjacent
  `template.handlebars.js`/`template.hbs.js` convention.
- Custom helpers are registered on the isolated Handlebars instance created for
  the current render, not on the global Handlebars singleton.
- Preview webviews must keep scripts disabled unless a feature explicitly needs
  them and ships with matching tests and documentation.
- Preview webviews must include a restrictive content security policy.
- Preview webviews may load local font files from the active template directory
  after rewriting eligible stylesheet references to VS Code webview resource
  URIs. This must not enable scripts or broaden local resource roots beyond the
  extension media directory and the active template directory.

## Design Principles

- Keep the extension surface small: command, preview panel, renderer.
- Prefer direct TypeScript types over ad hoc stringly APIs.
- Keep VS Code-specific objects at the boundary so rendering remains easy to
  test.
- Avoid speculative extension points until a real feature needs them.
- Prefer VS Code-native extension APIs over Node-specific runtime APIs so the
  preview works in desktop, remote, virtual, and web workspaces.
