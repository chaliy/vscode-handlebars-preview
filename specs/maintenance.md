# Maintenance

## Status

Active

## Purpose

Keep the extension healthy between feature releases by preventing dependency
rot, stale docs, and untested behavior from accumulating.

## When To Run

- Before each minor or major release.
- Quarterly during quiet periods.
- After large feature or dependency changes.

## Requirements

### Dependencies

- Direct dependencies and dev dependencies are reviewed for current versions.
- Security advisories are checked and resolved or explicitly tracked.
- `package-lock.json` stays consistent with `package.json`.
- Major dependency upgrades are allowed when they keep the extension working;
  large migrations may be split into tracked follow-up work.
- Legacy scaffold dependencies should be removed when local code can replace
  them without increasing maintenance cost.

### Tests

- Compile, lint, and test gates pass.
- Recent feature areas have meaningful coverage.
- Fixtures still represent documented usage.

### Documentation

- `README.md` matches current commands, keybindings, data-file behavior, and
  limitations.
- `CHANGELOG.md` records user-visible changes since the previous release.
- Specs reflect the current architecture and release expectations.

### Code Quality

- Dead code, stale comments, and unused dependencies are removed.
- Repeated patterns are consolidated when doing so simplifies the code.
- Names describe user-facing concepts and extension responsibilities clearly.
- No speculative abstractions are kept without a current use.

### Extension Behavior

- The preview command works in an Extension Development Host.
- A sample `.handlebars` file renders with adjacent JSON context.
- Missing or invalid context fails in a way users can understand.
- Webview behavior remains compatible with the supported VS Code engine.
- Webview scripts remain disabled unless an intentionally documented feature
  requires them.

## Deferred Items

Issues found during maintenance may be deferred only when they are too large or
too risky to fix inline. Deferred work should have a clear issue or note with
scope, reproduction steps, and the reason it was not included.
