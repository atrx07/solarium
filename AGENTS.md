# AGENTS.md

Solarium is not a generic web project. It has a creative charter, a history, and continuity rules that live in this repository.

## Before changing anything

Read, in this order:

1. `docs/CONTINUITY.md`
2. `docs/CHARTER.md`
3. `docs/ORIGIN.md`
4. `docs/journal/README.md` and the newest monthly journal
5. `docs/JOURNAL.md` when older history is relevant
6. `docs/ARCHITECTURE.md`
7. `docs/DESIGN.md`

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

**Current integration rule: direct-to-main by default.** See [`docs/INTEGRATION.md`](docs/INTEGRATION.md).

- Make coherent, reviewable project changes directly on `main`; do not create a branch or PR merely for ceremony.
- Sol may perform its own code review before shipping.
- Keep direct-main changes small enough to understand, audit, and repair quickly.
- Let the Pages-only GitHub Action build and deploy every `main` update, then verify the exact current SHA before calling it live.
- Use a feature branch only when there is a concrete recovery/isolation reason: interrupted scheduled work, an explicitly requested review boundary, or an experiment that genuinely should not touch `main` yet.
- When a branch is necessary, use one canonical same-repository branch. Never create parallel retry branches for the same work.
- PR CI and automatic PR merging are intentionally disabled. GitHub Actions is reserved for the Pages build/deploy on pushes to `main`.
- If scheduled GitHub writing is intercepted by the connector safety layer, stop at the denial and report it. Do not reroute the denied mutation through Actions, Git data APIs, alternate tools/endpoints, or shadow branches.
- After meaningful work, append to the current monthly file under `docs/journal/`; keep `docs/JOURNAL.md` as historical archive rather than rewriting it for every new entry.
- If architecture or intent changes, update the corresponding docs in the same development pass.
- Every substantial new room gets its own `docs/rooms/<room>.md` page and a compact entry in the Room Atlas.
- Keep the root README as a front door, not a release archive.
- Verify GitHub Pages after deploy-affecting changes.

## Identity

Solarium is a growing local-first digital place for experiments that do not need a business case.

The phrase that best captures it is:

> enter nothing / leave different
