---
name: maintenance
description: Bring repository health back to target state by checking dependencies, tests, docs, specs, extension behavior, and cleanup opportunities.
user_invocable: true
---

# Maintenance

Use this skill when the user asks for maintenance, repository health work, a
pre-release maintenance pass, or dependency and docs cleanup.

## Goal

The repository is healthy enough for continued feature work or release
preparation: dependencies are understood, checks are green, docs/specs match
the extension, and avoidable code drift has been removed.

## Outcomes

- Dependencies are current enough for the release target, with advisories
  resolved or explicitly tracked.
- `npm run compile`, `npm run lint`, and `npm test` pass.
- `README.md`, `CHANGELOG.md`, `package.json`, and `specs/` agree with the
  current extension behavior.
- The preview command and sample Handlebars rendering have been smoke tested
  when the pass touches runtime behavior.
- Dead code, stale comments, unused dependencies, and needless abstractions in
  touched areas are removed.
- Deferred work is recorded with scope, reproduction steps, and rationale.

## Guidance

- Treat each maintenance area as a desired state, not a rigid script.
- Prefer fixing small issues immediately over collecting them into a report.
- Keep dependency upgrades incremental enough to review.
- Split large breaking upgrades or broad refactors into tracked follow-up work
  when they would obscure the maintenance pass.
- Verify after each meaningful fix so regressions stay local.
- Report any remaining risk plainly, including checks that could not be run.

## Useful Commands

```bash
npm outdated
npm audit
npm install
npm run compile
npm run lint
npm test
npm run package
```
