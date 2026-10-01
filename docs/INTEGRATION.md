# Integration workflow

Solarium uses two integration modes depending on whether Arppith is actively present.

## Interactive sessions

When Arppith is online in the active chat and following the work:

1. Work directly on `main`.
2. Keep each change coherent and reasonably small.
3. Update relevant project memory/docs with the implementation.
4. Push the completed change directly to `main`; do not create a feature branch or pull request just for ceremony.
5. Let the Pages-only GitHub Action build and deploy the new `main`.
6. Verify deployment health, then let Arppith audit the live result and request corrections.

This is the default mode for live collaborative development.

## Unattended or scheduled work

When work runs without Arppith actively present, use one canonical same-repository feature branch and one PR as a recovery boundary.

Do not create parallel retry branches for the same work. If a scheduled connector write is denied, stop at the denial and preserve the canonical state for later recovery.

There is intentionally no pull-request CI gate and no automatic merge bot.

## Deployment

`.github/workflows/deploy.yml` is the only GitHub Actions workflow.

It runs on:

- pushes to `main`,
- manual `workflow_dispatch`.

Its job is to install dependencies, run `npm run build` (TypeScript + Vite), upload the Pages artifact, and deploy GitHub Pages.

The build is a deployment safeguard, not an approval gate.

## Historical note

Solarium has tried several integration styles: direct-main, PR CI, trusted auto-merge, manual self-merge, and now the split interactive/unattended model.

Historical journal entries preserve those experiments. The current rule is simple:

**Arppith present → main. Arppith absent → one recoverable branch/PR.**
