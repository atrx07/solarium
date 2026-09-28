# Solarium automatic PR integration

Solarium's existing **Solarium** GitHub Actions workflow compiles TypeScript and builds the Vite site for each pull request targeting `main`.

`auto-merge.yml` runs only after that workflow has completed successfully. It discovers the open pull request associated with the completed run's branch and verifies:

- the source branch belongs to this same repository (forks do not auto-merge);
- the PR is open, targets `main`, and is not a draft;
- the PR's current head is **exactly** the head commit validated by CI;
- the branch is not a disposable `probe/*` branch;
- the PR does not modify `.github/workflows/` or `.github/CODEOWNERS` (those need deliberate manual integration).

If every gate passes, the Action squash-merges the PR without using administrator bypass and requests branch deletion. If the merge is confirmed, it explicitly dispatches `deploy.yml` on `main` so GitHub Pages is rebuilt.

Why explicit dispatch? Merges performed with the job's built-in `GITHUB_TOKEN` don't themselves fire ordinary `push` workflows. `workflow_dispatch` does. This design needs no personal access token, repository secret, paid service, or separate backend.

**Current CI gate:** `npm run build` runs `tsc && vite build`. No independent unit-test script is configured yet; do not describe this as a full unit-test suite. If tests are added, they should become a mandatory part of the `Solarium` CI workflow before the merge step.

**Limitation:** This solves integration of code that has already reached a same-repository PR. It does not bypass ChatGPT's scheduled connector safety denial when the scheduled task attempts to commit a file. The read-only scout and isolated write probe remain separate concerns.

## Smoke test

This file originated on `test/auto-merge-smoke` as a harmless test of the pipeline. The expected outcome is: PR build passes → trusted auto-merger verifies the head → squash merge → explicit Pages dispatch → no stale test branch.
