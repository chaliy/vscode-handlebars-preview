# Release Process

## Status

Active

## Purpose

Define the release expectations for publishing the VS Code extension.

## Requirements

- Release changes must pass `npm run compile`, `npm run lint`, and `npm test`.
- Public behavior changes must be reflected in `README.md` and `CHANGELOG.md`.
- `package.json` metadata, commands, keybindings, and version must match the
  release being published.
- Package validation should run with `npm run package` before publishing.
- Publish with `npm run publish` only after checks pass and the package contents
  have been reviewed.
- After publishing, wait until Marketplace metadata and a fresh extension
  install both report the new version before considering the release complete.

## Versioning

- Patch releases are for bug fixes and maintenance.
- Minor releases are for user-visible features or behavior improvements.
- Major releases are for breaking behavior or VS Code engine changes that may
  require user action.

## Release Readiness

A release is ready when the package installs, the preview command opens, sample
templates render correctly, and docs describe the shipped behavior.

After publishing, smoke test the Marketplace-installed extension in an isolated
VS Code profile. Confirm the installed version matches `package.json`, the
preview command activates the extension, and a sample template opens a preview
panel.
