# AGENTS.md

Solarium is not a generic web project. It has a creative charter, a history, and continuity rules that live in this repository.

## Before changing anything

Read, in this order:

1. `docs/CONTINUITY.md`
2. `docs/CHARTER.md`
3. `docs/ORIGIN.md`
4. the newest entries in `docs/JOURNAL.md`
5. `docs/ARCHITECTURE.md`

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

- Small, meaningful commits.
- Keep `main` deployable.
- For substantial work, prefer a branch + PR + successful build gate before merge.
- Hotfixes may go directly to `main` when the issue is obvious and low-risk.
- After meaningful work, update `docs/JOURNAL.md`.
- If architecture or intent changes, update the corresponding docs in the same change.
- Verify GitHub Pages after deploy-affecting changes.

## Identity

Solarium is a growing local-first digital place for experiments that do not need a business case.

The phrase that best captures it is:

> enter nothing / leave different
