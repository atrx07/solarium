# Integration workflow

Solarium uses a human approval checkpoint.

## Development

1. Create or reuse one same-repository feature branch.
2. Keep the scope coherent and update relevant project memory/docs.
3. Open one pull request into `main`.
4. Present the completed change to Arppith.
5. **Do not merge until Arppith explicitly approves that change.**
6. After approval, manually merge the exact PR head, normally with a squash merge, and delete the source branch.
7. Verify `main` and the GitHub Pages deployment before calling the change live.

There is intentionally no pull-request CI gate and no automatic merge bot.

## Deployment

`.github/workflows/deploy.yml` is the only remaining GitHub Actions workflow.

It runs on:

- pushes to `main`,
- manual `workflow_dispatch`.

Its job is only to install dependencies, run `npm run build` (TypeScript + Vite), upload the Pages artifact, and deploy GitHub Pages.

This post-merge build is a deployment safeguard, not an approval gate.

## Historical note

From PR #14 through PR #25, Solarium used a trusted exact-head CI + automatic squash-merge pipeline. It worked, but became unnecessary after Arppith chose to explicitly review and approve each completed run before integration.

Historical journal entries may still mention that pipeline. They are history, not current policy.
