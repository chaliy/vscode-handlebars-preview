# Release Process

## Status

Implemented

## Purpose

Define the release expectations for publishing the VS Code extension.

## Release Workflow

Flow: **prepare -> verify-can-publish -> merge -> publish -> monitor**.

1. Prepare a release PR with `package.json`, `package-lock.json`, and
   `CHANGELOG.md` updated for `vX.Y.Z`.
2. Run `npm run release:check` before opening or merging the release PR.
3. Merge a commit titled `chore(release): prepare vX.Y.Z` to the default
   branch.
4. `.github/workflows/release.yml` creates or verifies tag `vX.Y.Z`, extracts
   release notes from `CHANGELOG.md`, creates the GitHub Release, then
   dispatches `.github/workflows/publish.yml` on the tag.
5. `.github/workflows/publish.yml` rebuilds from the tag, runs compile, lint,
   desktop tests, web tests, packages the VSIX, uploads the VSIX to the GitHub
   Release, publishes to the Visual Studio Marketplace, and verifies the
   Marketplace version.

The publish workflow uses the `VSCE_PAT` GitHub Actions secret. Keep the token
scoped to Marketplace publishing for publisher `chaliy`.

## Human Steps

1. Ask the agent to create a release, for example `Create release v2.1.0`.
2. Review the release PR, including changelog notes and verification output.
3. Merge the release PR to the default branch.
4. Monitor the release and publish workflows until the GitHub Release, VSIX
   asset, and Marketplace listing all show the new version.

## Agent Steps

1. Ensure git history and tags are available:
   `git fetch --tags --unshallow origin 2>/dev/null || git fetch --tags origin`.
2. Determine the release version from the requested scope and semantic
   versioning.
3. Update `package.json` and `package-lock.json` to the same version.
4. Move `CHANGELOG.md` entries from `[Unreleased]` into a dated
   `## [X.Y.Z] - YYYY-MM-DD` section.
5. Run `npm run release:check`.
6. Commit as `chore(release): prepare vX.Y.Z`, open a focused PR, and include
   the changelog excerpt plus verification results.
7. After merge, monitor `release.yml` and `publish.yml`; if publishing fails,
   fix the root cause in a follow-up patch release rather than leaving a
   partial release undocumented.

## Versioning

- Patch releases are for bug fixes and maintenance.
- Minor releases are for user-visible features or behavior improvements.
- Major releases are for breaking behavior or VS Code engine changes that may
  require user action.
- When the minimum VS Code engine changes, the release notes must call it out as
  a breaking change.

## Changelog Format

Use this structure:

```markdown
## [Unreleased]

## [X.Y.Z] - YYYY-MM-DD

### Highlights

- **Short user-facing summary** - impact and context.

### Breaking Changes

- **Short summary** - migration notes when needed.

### What's Changed

* type(scope): description ([#N](https://github.com/chaliy/vscode-handlebars-preview/pull/N)) by @author

**Full Changelog**: https://github.com/chaliy/vscode-handlebars-preview/compare/vA.B.C...vX.Y.Z
```

Omit `### Breaking Changes` when there are none. Keep `### Highlights` to the
few items users should notice first, and use `### What's Changed` for the
complete release body.

## Release Readiness

A release is ready when the package installs, the preview command opens, sample
templates render correctly, and docs describe the shipped behavior.

After publishing, smoke test the Marketplace-installed extension in an isolated
VS Code profile. Confirm the installed version matches `package.json`, the
preview command activates the extension, and a sample template opens a preview
panel.

## Rollback

Marketplace releases cannot be safely overwritten. If a bad version is
published, immediately prepare a patch release that fixes or reverts the issue,
then publish it through the same workflow.
