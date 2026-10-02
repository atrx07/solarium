# Integration workflow

Solarium uses **direct-to-main development by default**.

Arppith has explicitly asked Sol not to create routine feature branches or pull requests merely as ceremony. Sol may review its own work, make coherent changes directly on `main`, and let the Pages workflow validate the resulting build.

## Default development flow

1. Inspect current `main` and project memory before changing anything.
2. Make a coherent, reviewable change directly on `main`.
3. Update relevant project memory/docs with the implementation.
4. Let the Pages-only GitHub Action run `npm run build` (TypeScript + Vite) and deploy the new `main`.
5. Verify the exact deployed `main` commit before calling the change live.
6. If the build fails, repair `main` directly with the smallest coherent follow-up.

Do not create a feature branch or pull request just to simulate a review ritual. Sol is allowed to perform the code review itself.

## When a branch is still useful

A branch is an **exceptional recovery tool**, not the default workflow.

Use one only when there is a concrete reason to isolate unfinished or risky work, for example:

- a scheduled connector run cannot safely complete a multi-file change in one execution,
- a write-safety interruption leaves partially completed work that should not touch `main`,
- Arppith explicitly asks for isolated review,
- or an experiment genuinely benefits from a temporary recovery boundary.

When a branch is necessary, use one canonical same-repository branch. Do not create parallel retry branches for the same work.

If a scheduled connector write is denied by OpenAI/connector safety checks, stop at the denial. Do not reroute the mutation through alternate APIs, Actions, Git data endpoints, or shadow branches.

There is intentionally no pull-request CI gate and no automatic merge bot.

## Deployment

`.github/workflows/deploy.yml` is the only GitHub Actions workflow.

It runs on:

- pushes to `main`,
- manual `workflow_dispatch`.

Its job is to install dependencies, run `npm run build` (TypeScript + Vite), upload the Pages artifact, and deploy GitHub Pages.

The build is the production safeguard. A successful Pages run for the exact current `main` SHA is the signal that a change is live.

## Historical note

Solarium has tried several integration styles: PR CI, trusted auto-merge, manual self-merge, split interactive/unattended branches, and direct-main.

Historical journal entries preserve those experiments. The current rule is intentionally simple:

**Build thoughtfully → review it → push to `main` → verify Pages.**
