# AGENTS.md

Solarium is not a generic web project. It has a creative charter, a history, and continuity rules that live in this repository.

## Before changing anything

Read, in this order:

1. `docs/CONTINUITY.md`
2. `docs/CHARTER.md`
3. `docs/ORIGIN.md`
4. the newest entries in `docs/JOURNAL.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DESIGN.md`

Do not rely on chat memory when the repository can answer the question.

## Non-negotiable constraints

- No paid services are required to build, run, host, or experience Solarium.
- No metered API is a required dependency.
- Prefer local-first/browser-native behavior.
- No analytics, trackers, or hidden telemetry.
- Keep the project understandable enough that future maintainers can inspect it without archaeology.
- Preserve the playful, exploratory character. Utility is optional; curiosity is not.
- If a change introduces a recurring cost, paid account, secret, or vendor lock-in, stop and ask the human owner first.
- If a change requires a human-only GitHub/account action, make the code ready first, then ask only for the exact manual step.

## Creative authority

Arppith created the repository and explicitly delegated broad creative freedom for Solarium. The assistant may choose the direction, rooms, interactions, names, architecture, visual language, and experiments without asking for approval for every detail, as long as the constraints above are respected.

This is creative freedom, not authority over the user's GitHub account or money. Irreversible account-level actions, costs, secrets, or external commitments still require the user.

## Working style

**Current integration rule: self-merged PRs with post-deploy human audit.** Routine development happens on one same-repository feature branch and PR. Sol may merge its own completed PRs without waiting for pre-merge approval; Arppith audits the finished live build afterward. There is no PR CI gate and no auto-merge bot. See [`docs/INTEGRATION.md`](docs/INTEGRATION.md).

- Routine development uses one same-repository feature branch and one pull request into `main`.
- Keep each scope small and coherent. Reuse unfinished canonical work instead of creating parallel retry branches.
- Once a development PR is complete and internally coherent, Sol may merge the exact PR head manually (normally squash) without waiting for a separate approval message.
- Arppith audits the final deployed build afterward and may request fixes or reversions.
- PR CI is intentionally disabled. Use careful local/static reasoning while building; GitHub Actions is reserved for the post-merge Pages build/deploy on `main`.
- Workflow-policy changes remain deliberate repository changes, but no auto-merge exclusion is needed because the bot has been removed.
- If scheduled GitHub file/PR writing is intercepted by the connector safety layer, stop at the denial and report it. Do not reroute the denied mutation through Actions, Git data APIs, alternate tools/endpoints, or retry branches. Preserve and recover the single canonical branch next time.
- After each merge, verify `main` and the GitHub Pages deployment before calling the change live.
- After meaningful work, update `docs/JOURNAL.md`.
- If architecture or intent changes, update the corresponding docs in the same change.
- Every substantial new room gets its own `docs/rooms/<room>.md` page and a compact entry in the Room Atlas.
- Keep the root README as a front door, not a release archive. Do not add long per-room sections back to it.
- Verify GitHub Pages after deploy-affecting changes.

## Identity

Solarium is a growing local-first digital place for experiments that do not need a business case.

The phrase that best captures it is:

> enter nothing / leave different
