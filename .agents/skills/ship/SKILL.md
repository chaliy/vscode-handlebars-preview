---
name: ship
description: Bring a change to shippable quality for this VS Code extension, including verification, docs/spec alignment, packaging confidence, and PR readiness.
user_invocable: true
---

# Ship

Use this skill when the user asks to ship, ship it, prepare a PR, or take a
finished change through final verification.

## Goal

The current change is safe to publish or review: behavior is implemented,
tests pass, docs and specs match reality, packaging works when relevant, and no
known blocker is hidden.

## Outcomes

- The branch contains one focused, reviewable change.
- Changed behavior is covered by tests or an explicit smoke test.
- `npm run compile`, `npm run lint`, and `npm test` pass.
- User-facing behavior changes update `README.md` and `CHANGELOG.md`.
- Durable behavior changes update the relevant file in `specs/`.
- `package.json` and `package-lock.json` remain consistent.
- Security and robustness risks from template input, JSON data, and webview
  output have been considered.
- The extension has been smoke tested when commands, preview lifecycle, or
  rendering behavior changed.
- The PR or handoff summary clearly states what changed, why, risk, and tests.

## Guidance

- Start by understanding the diff against the default branch and the user's
  requested scope.
- Fix issues as they are found instead of reporting a checklist.
- Add missing tests before declaring the change ready.
- Keep simplification scoped to changed areas unless the user asked for a
  broader cleanup.
- If local verification cannot run, explain the blocker and what remains
  unverified.
- Never claim an issue is fully closed unless every relevant task is complete.

## Useful Commands

```bash
git status --short --branch
git diff --stat
npm run compile
npm run lint
npm test
npm run package
```
