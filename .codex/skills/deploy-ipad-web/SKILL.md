---
name: deploy-ipad-web
description: Build, test, and publish the current Miragine game source to its existing Cloudflare iPad/PWA URL. Use when the user asks to upload, update, release, or redeploy the latest web version of this project.
---

# Deploy the latest iPad web version

Publish the current source in `D:\milaqi` to the existing Worker `miragine-war-ipad` at <https://miragine-war-ipad.miragine-war.workers.dev>. One invocation updates this fixed production URL; do not create a second Worker, Pages project, custom domain, or preview deployment unless the user explicitly asks.

## Release contract

- Treat an explicit invocation or a direct request to upload the latest version as authorization to update the existing production Worker.
- Deploy the browser build from the current working tree. Never upload the Windows executable or `dist\MiragineWar-win32-x64`.
- Keep source files, caches, build output, screenshots, and temporary files under `D:\milaqi`. Use the project's existing environment helpers or set npm and Playwright caches to folders below the repository.
- Preserve unrelated uncommitted and untracked files. Do not clean, reset, stash, commit, or tag unless the user separately requests it.
- Do not change `wrangler.jsonc`'s Worker name, `workers_dev` setting, or public URL as part of an ordinary release.
- If Cloudflare requires a new login or OAuth grant, prepare everything else first and obtain the required confirmation at the final authorization control. Reuse a valid Wrangler session when available.

## Deployment workflow

1. Inspect `git status --short`, `package.json`, `wrangler.jsonc`, and the relevant source changes. Confirm that the config still targets `miragine-war-ipad` and `dist/web`.
2. Run `npm.cmd test`. Fix failures caused by the current changes before deployment; do not publish a known-broken build.
3. Run `npm.cmd run test:web`. This builds `dist\web` and verifies the iPad landscape viewport, touch navigation, match startup, unit selection, Service Worker installation, and offline reload.
4. Run `npx.cmd wrangler deploy --dry-run`. Stop and resolve configuration or asset errors before mutating production.
5. Run `npx.cmd wrangler whoami` and verify that the authenticated account contains the existing Worker. If authentication is missing, use `npx.cmd wrangler login` and complete its OAuth flow.
6. Run `npm.cmd run deploy:web`. Capture the deployed URL and Cloudflare Version ID from Wrangler output.
7. Verify the production URL after deployment:
   - `/`, `/manifest.webmanifest`, `/sw.js`, and `/src/app.js` return HTTP 200.
   - A browser with an iPad-sized landscape viewport reaches the main menu and can enter a battle by touch without page errors.
   - `navigator.serviceWorker.controller` becomes active after installation or reload.
8. If the new `workers.dev` hostname is temporarily waiting for DNS or TLS provisioning, retry for a few minutes with bounded waits. Do not report success until the public URL loads over HTTPS.

## Completion report

Report the fixed public URL, deployed Cloudflare Version ID, tested Git commit or working-tree state, and the checks that passed. Remind the user that an iPad receives the update after it reconnects and reopens or refreshes the installed web app; an offline iPad continues using its cached older version until then.
