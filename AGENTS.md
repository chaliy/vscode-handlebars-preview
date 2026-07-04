## Coding Agent Guidance

### Style

Be concise. Read the relevant code before changing it. Prefer small,
reviewable changes that leave the extension runnable locally.

### Critical Thinking

- Fix root causes instead of hiding symptoms.
- If behavior is unclear, read more code and tests first; ask only when the
  next step would be risky.
- Treat unrecognized working-tree changes as user-owned. Work around them and
  do not revert them unless explicitly asked.
- Keep implementation, tests, docs, and specs in sync.

### Project Shape

This is a VS Code extension that renders a live Handlebars preview. The
runtime code lives in `src/`, tests live in `src/test/`, and extension metadata
and commands live in `package.json`.

### Specs

`specs/` contains durable project expectations. New work should follow the
specs or update them in the same change when behavior intentionally changes.

| Spec | Description |
| --- | --- |
| architecture | Extension boundaries, preview lifecycle, rendering flow |
| testing | Unit and integration test expectations |
| release-process | Packaging, publishing, and release checks |
| maintenance | Periodic health requirements for dependencies, docs, tests, and CI |

### Local Development

```bash
npm install
npm run compile
npm run lint
npm test
```

Use `npm run watch` while iterating on the extension bundle.

### Quality Bar

- Run `npm run compile`, `npm run lint`, and `npm test` before shipping code
  changes.
- Add or update tests when rendering behavior, preview panel behavior, command
  activation, file watching, or data loading changes.
- Smoke test user-facing extension behavior when a change affects commands,
  preview rendering, or VS Code integration.
- Keep `README.md`, `CHANGELOG.md`, `package.json`, and specs accurate when
  public behavior changes.

### Testing Notes

- Rendering logic belongs in focused tests under `src/test/suite/lib/`.
- Extension command and VS Code integration behavior belongs in
  `src/test/suite/`.
- Prefer observable results over implementation-detail assertions.
- When fixing a bug, add a regression test that would have failed before the
  fix when practical.

### Security And Robustness

- Treat template contents and adjacent JSON data files as user input.
- Avoid script execution or filesystem access beyond the files needed for the
  preview.
- Escape or constrain webview content according to VS Code webview guidance.
- Report errors in a useful way without exposing unnecessary internals.

### Pull Requests

- Keep PRs focused on one concern.
- Use conventional commit-style titles when possible, for example
  `fix(preview): handle missing data files`.
- Do not merge while required checks are failing.
- If a change only completes part of an issue, avoid closing keywords until the
  whole issue is actually complete.
