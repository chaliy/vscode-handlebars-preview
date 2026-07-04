# Testing

## Status

Active

## Purpose

Define the minimum confidence expected before changes are shipped.

## Requirements

- `npm run compile` must pass for TypeScript and bundling changes.
- `npm run lint` must pass for source changes.
- `npm test` must pass before shipping code changes.
- Rendering changes need focused tests that assert rendered output or expected
  failure behavior.
- VS Code command or panel lifecycle changes need integration tests when the
  behavior can be exercised by the extension test harness.
- Bug fixes should include regression tests when practical.
- CI must run compile, lint, test, audit, and package validation for pull
  requests and pushes.

## Smoke Testing

For user-facing changes, manually verify the extension in a VS Code Extension
Development Host:

- Open a `.handlebars` file.
- Run `Handlebars: Open Preview`.
- Confirm preview rendering uses the adjacent `.handlebars.json` file.
- Confirm edits to the template or data refresh the preview when the changed
  area is affected.

## Test Design

- Prefer tests based on observable output and state.
- Avoid assertions that only prove an internal helper was called.
- Keep test examples small and readable.
- Update fixtures in `src/test/examples/` when they clarify real user behavior.
