# Architecture

## Status

Active

## Purpose

Define the durable boundaries of the Handlebars Preview extension so feature
work stays small, testable, and aligned with VS Code extension behavior.

## Requirements

- Extension activation remains command-driven through `handlebars.preview`.
- Command wiring and VS Code API integration belong near `src/extension.ts`.
- Preview panel state, lifecycle, editor subscriptions, and webview updates
  belong in `src/lib/PreviewPanel.ts`.
- Template rendering and data loading belong in focused library code under
  `src/lib/`.
- Rendering code must be usable from tests without requiring a running VS Code
  window when practical.
- The preview data file convention remains `template.handlebars.json` unless a
  behavior change updates docs, tests, and this spec together.
- Webview output should be generated from compiled Handlebars and the matching
  JSON context; missing or invalid context should fail predictably and be
  covered by tests.

## Design Principles

- Keep the extension surface small: command, preview panel, renderer.
- Prefer direct TypeScript types over ad hoc stringly APIs.
- Keep VS Code-specific objects at the boundary so rendering remains easy to
  test.
- Avoid speculative extension points until a real feature needs them.
