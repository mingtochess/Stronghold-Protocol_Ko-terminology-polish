# Cloudflare Containers deployment

## Current status: container disabled

The game moved to EC2 at `https://web.ming.party`. The Cloudflare container was stopped and verified `inactive` on 2026-10-03. Cron triggers and keep-warm behavior are disabled, and game requests cannot start the container. The existing Workers address redirects visitors to EC2; `/healthz` only confirms container deactivation. The retained Durable Object binding, storage, and container application support a future rollback. The deployment details below describe the previous active container setup; redeploying the current code keeps it disabled.

This deployment serves the public client through Workers Assets and routes `/ws`, `/healthz`, `/data/`, `/shared/`, `/sim/`, and `/data.js` to one Node.js container. Every player uses the same game process; there is no per-user container or load balancing across independent in-memory rooms.

## Prepare and deploy

Node.js 22+ (24 recommended), a Docker-compatible engine, and a Cloudflare Workers Paid account are required. Run from the repository root:

```sh
npm ci
node tools/build-browser-resources.mjs
cd deploy/cloudflare
npm ci
npx wrangler login
npm run check
npm run deploy
```

Alternatively, securely configure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` for the deployment account. The token must authorize Workers and Containers deployment. Never put token values in this repository or send them in chat. `wrangler login` is for a machine where you can complete browser authentication.

Use the HTTPS `workers.dev` address reported by Wrangler. No custom domain is required. A custom domain can be attached later in the Cloudflare dashboard. Run the first real game connection from the region where your players are concentrated. The Durable Object uses `apac-ne`, a best-effort Northeast Asia location hint, but this does not guarantee Seoul or the container's location.

## First visit and resources

The browser shows a Korean notice before downloading roughly 250 MB of images, Spine models, audio and fonts. The user chooses **다운로드 후 시작**; progress and retry/resume are provided. Sources are the public repositories and jsDelivr mirrors already used by the project's asset tooling. Voice/audio files use GitHub raw when jsDelivr has no usable mirror. Four enemy variant icons use the same base-icon alternatives as the existing downloader.

The resources are stored in versioned browser Cache Storage and served under the original local paths by a service worker. No game-art package is hosted in the container or uploaded to Workers. Atlas page sizes and premultiplied-alpha flags are normalized as in the existing asset pipeline. The game boots only after the complete cache is prepared. A subsequent visit reuses the files. A browser storage eviction, site-data deletion or resource version update triggers another preparation; partial downloads are reused for retries within that version. Cache Storage may be unavailable in private browsing or subject to device storage limits. Previous cache versions are retained to avoid deleting resources used by another open tab; clearing site storage removes them.

`tools/build-browser-resources.mjs` writes only ignored `public/vendor/` files. It resolves the committed `data/assets.json` against the existing upstream plan, verifies complete URL coverage, and does not download art or rewrite game manifests. Run it before every deployment. Building without this generated index retains the original self-hosted workflow. Do not deploy the Cloudflare configuration without generating the index.

## Availability and cost

The Worker uses `placement.region: "aws:ap-northeast-2"` to request execution near AWS Seoul. This affects Worker fetch handling; it does not relocate the existing Durable Object or force its container into Seoul. The existing `stronghold-main` singleton is retained. Measure player WebSocket latency after deployment to assess this placement experiment.

After removing the APAC constraint, the existing container was restarted through a temporary one-time Container `destroy()` call on 2026-10-03. Health returned with uptime of one second and WebSocket pong succeeded. Placement remained `bom06` (Mumbai). The temporary restart code was removed afterward; the singleton and persistent Durable Object storage were retained.

After the first game-server request, a Durable Object alarm checks the container every minute. A five-minute Worker cron provides recovery, and the 15-minute idle timer is renewed. The cron does not start an unused deployment before its first player connection. This is intended to keep the game process warm continuously, including between player visits; it incurs continuously running container charges plus Workers/Durable Objects usage. Workers Paid's base fee alone does not cover continuous operation.

Keep-warm does not guarantee uninterrupted uptime. Deployment, platform maintenance, crashes or restarts can end games because this project stores rooms and matches in process memory. Container placement is unrestricted; the earlier APAC restriction was removed while retaining the Seoul Worker placement hint. Container placement can change on restart, and neither this hint nor unrestricted placement guarantees Seoul or Tokyo. Measure WebSocket round-trip time from the actual player region after deployment. The Durable Object location hint is applied only on the first creation of a Durable Object; changing the hint for an existing object does not relocate it.

## Validation

```sh
# From the repository root
node --test test/browser-resources.test.js test/client-static.test.js
cd deploy/cloudflare
npm test
npm run check
```

The browser fixture test exercises consent, interrupted download, resume, cache reuse, cache eviction, resource updates, atlas normalization and cached audio paths. It uses deterministic resource fixtures and a system Chromium (`CHROME_PATH` can override the executable). Existing `npm test` covers the game server and simulation. Five existing documentation tests expect Chinese wording in the Korean README and are known to fail.

After deployment, verify `/healthz` reports `ok: true`, download all resources in a fresh browser profile, create and join the same room from two browsers, complete a representative battle, reload to confirm cache reuse, and measure latency. A local dry run or container smoke test does not validate the production Cloudflare routing or placement.

Current-workspace validation completed:

- All 3,962 resource files were retrieved from the public sources, including four existing base-icon alternatives.
- Real Chromium completed the first-visit download, stored 3,964 cache entries (files, font CSS and readiness marker), and booted immediately from cache on reload.
- A browser started a solo match through WebSocket. A representative battle demo rendered 21 units with 11 Spine models ready and no failed Spine loads. Headless software rendering performance is not representative of player hardware.
- The production Docker image ran healthy as the `node` user and served HTTP/WebSocket room creation. TypeScript and Wrangler deployment dry run passed.
- Final repository suite: 3,348 tests, 3,317 passed, five known Chinese-documentation assertions failed, 26 skipped. Targeted client/download tests: 215 passed. Deployment routing tests: two passed.

Public deployment: https://stronghold-ko.furtive-paprika-1c0.workers.dev

APAC placement restriction deployed on 2026-10-03 (Worker version `da627022-0dd8-462e-8ac5-0c8a17cc962a`). The existing instance moved from `lax13` to `bom06` (Mumbai), and public health returned `ok: true`. APAC includes South Asia; this setting does not ensure Northeast Asia placement or a particular player latency. Re-measure from Korea before judging the improvement.

Production validation completed: homepage and `/healthz` return HTTP 200; a fresh Chromium profile downloaded all 3,962 resources, then reloaded from cache; a solo match started through WebSocket; two distinct players joined the same co-op room and both received the match start. Test rooms were removed afterward. Player-region latency and uninterrupted 24-hour uptime have not been measured.

Keep the `CLOUDFLARE_API_TOKEN` secret's delivery destination limited to `api.cloudflare.com`. `registry.cloudflare.com` needs network access, but must not receive that API token: Wrangler obtains separate short-lived image push credentials. Injecting the API token into registry requests caused an authentication conflict during the initial deployment attempt; the corrected destination setting resolved it.

## Builds behind an inspection proxy

Docker builds must use the normal TLS trust chain. If an authorized environment uses an HTTPS inspection proxy, the Dockerfile supports a BuildKit CA secret without disabling verification:

```sh
docker build --build-arg HTTPS_PROXY --build-arg HTTP_PROXY --build-arg NO_PROXY \
  --secret id=build_ca,src=/etc/ssl/certs/ca-certificates.crt -t stronghold-ko .
```

If the proxy hostname is supplied through the host's `/etc/hosts`, Docker also needs a corresponding `--add-host` entry. Do not embed environment-specific proxy addresses or CA certificates in the image or repository. This cloud workspace uses a local Docker wrapper under `/workspace/.cloudflare-tools/` to pass those build-only options to Wrangler. Its runtime proxy values are not saved in the repository. The image runs as the non-root `node` user and copied application files belong to that user.
