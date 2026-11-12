# Cloudflare deployment

The deployment target is the owner's Cloudflare account, using Workers and D1 on the Free plan initially. The owner selected an **Asia-Pacific location hint** for the database. This is a placement hint, not a contractual jurisdiction restriction.

## Initial setup

1. Create the Cloudflare account, verify the email, and authorize Wrangler through Cloudflare's OAuth page. Do not put login passwords or API tokens into the repository or chat.
2. Verify the active account with `wrangler whoami`. Select the intended account explicitly if more than one is available.
3. Check for existing resources before creating `whichcvfits-db`. Create a new database with `wrangler d1 create whichcvfits-db --location apac`, then replace the placeholder UUID in `wrangler.jsonc`. Do not replace an existing populated database.
4. Apply the versioned migrations to that newly selected database using `wrangler d1 migrations apply whichcvfits-db --remote`.
5. Configure independent, randomly generated production values for `WHICHCVFITS_JWT_SECRET` and `WHICHCVFITS_ENCRYPTION_SECRET` as Worker secret bindings. Keep an encrypted/private recovery copy; any local recovery material in `.secrets/` is ignored. Preserve these values across redeployments. Local development secrets and local databases remain separate.
6. Determine the actual free `workers.dev` origin for this account and Worker.
7. Run `NEXT_PUBLIC_SITE_URL=https://whichcvfits.YOUR-SUBDOMAIN.workers.dev npm run deploy:cloudflare` with the real origin. The deployment command refuses missing/unsafe origins and placeholder database IDs, rebuilds the app, strips private dotenv values from generated Worker configuration, and publishes the resulting artifact.

Resource creation, remote migrations, secret upload and deployment affect the selected Cloudflare account. These operations were explicitly authorized for this deployment; the deployment command does not upgrade the account or purchase a domain.

## Hosted verification

Use only synthetic data for initial verification:

```sh
DEPLOYMENT_SMOKE_URL=https://whichcvfits.YOUR-SUBDOMAIN.workers.dev node scripts/deployment-smoke.mjs
```

This creates a temporary synthetic account, checks authentication, secure cookies, ownership/access boundaries, missing-key gating, device-side PDF/DOCX parsing, modal focus, basic responsive reflow and rendered SEO. It removes only its own uniquely named fixture account from the selected remote D1 database. Results are written to ignored `artifacts/deployment/`. Do not use the local mocked-provider browser suite against the live deployment.

Real AI evaluations remain unverified until a valid user-supplied key is used. The hosted smoke test makes no AI-provider calls and does not upload the owner's local database or original account.

## Free-plan operation

Cloudflare's Free plan has daily request/database allowances and a 10ms Worker CPU limit per request. Local preview success does not establish hosted CPU compatibility. Check hosted authentication, server rendering and representative evaluation workloads before admitting real candidate data. If the free CPU limit is insufficient, investigate the measured failure before any paid upgrade; a paid subscription requires a separate owner decision.

Keep production secrets stable, restrict account access, use two-factor authentication and manage database backups privately. CV text and saved results are personal data. The selected AI provider receives the text required for evaluations; Cloudflare hosting does not eliminate provider retention considerations.

## Current status

The owner’s pilot was first deployed on 10 November 2026. The responsive visual refresh was published on 11 November 2026:

- **URL:** https://whichcvfits.grbulegoda.com
- **Worker address:** https://whichcvfits.gayanukabulegoda.workers.dev
- **Worker:** `whichcvfits`
- **Version:** `0eebaa46-6320-4fba-b4a3-62e71d0314c4`
- **Database:** `whichcvfits-db`, created with the selected APAC location hint; all four migrations applied remotely.
- **Secrets:** two independent production secret bindings verified after publishing; values are absent from generated Worker/browser code and Git.
- **Account changes:** no plan upgrade or domain purchase was requested or performed. Additional version-preview URLs are disabled.
- **Local verification:** 21 regression suites, TypeScript and formatting pass; the production Cloudflare build passes.
- **Public hosted verification:** all 12 checked pages/SEO endpoints/icons/PDF assets return HTTP 200 with appropriate content types. Canonical URLs and sitemap point to the actual deployed origin.
- **Hosted application verification:** synthetic signup/login/logout, secure session flags, protected pages, private/no-store responses, onboarding skip, origin rejection, missing-key gating, PDF/DOCX parsing, dialog focus, and 320/390/768/1280px workspace reflow pass. Saved model metadata, cross-owner read/delete isolation and atomic run/candidate deletion are verified using uniquely scoped synthetic fixtures.

The original native database/account remain local. Hosted fixtures are deleted after verification. Production is a separate database: the owner should create a new account on the hosted site. No real candidate CVs or provider keys were supplied during these checks, and no AI-provider request was made. These hosted checks passed without an observed CPU-limit failure; representative live-provider batches and broader load remain unverified. No claim of unlimited free capacity is made.

The hosted smoke’s final JSON report and public health checks are kept locally under ignored `artifacts/deployment/`.

## Namecheap subdomain

The active `whichcvfits.grbulegoda.com` hostname uses a Pages gateway so authoritative DNS can stay at Namecheap. See [custom-domain setup](CUSTOM-DOMAIN.md) for the exact CNAME, gateway deployment and cutover verification. The original Worker/database/secrets are retained.

The custom hostname and its Google-issued HTTPS certificate are active. Both Namecheap authoritative nameservers and Google Public DNS return the correct CNAME. The full hosted application smoke and all 12 public/SEO/document-asset checks passed on the custom hostname. Initial cutover checks used a process-only DNS mapping because the local resolver cached the previous NXDOMAIN response. By the 11 November visual refresh, ordinary DNS and HTTPS resolved successfully without an override or OS DNS change. No additional Namecheap record is required.

## 11 November visual refresh

The responsive neumorphic redesign is live on Worker version `cf85b695-3f70-4791-a15d-0b5f5765de3b`. The Cloudflare build, public-only environment artifact scan, hosted synthetic account/persistence/ownership smoke, all 12 public/SEO/document-asset checks, and live 320/390/768/1440px visual checks pass over normal DNS and HTTPS. Both production secret bindings remain configured. Synthetic smoke fixtures were removed; no AI-provider call, schema migration, new resource, plan upgrade, or DNS change was made.

See [design research and verification](UI-REDESIGN.md) for the layouts, test scope, Lighthouse lab results, and remaining verification limits.

## Score and hero refinement

The score-label spacing and desktop hero relief refinement is live on Worker version `6d9fb97c-1640-4047-82ae-41f088500f4a`. The Cloudflare build and public-only environment check pass. Live browser checks confirm at least 4px score-label clearance, the desktop-only artwork, no overflow at 320/390/768/1024/1440/1920px, and working sample controls. The hosted authentication/persistence/ownership/document/modal smoke passes and removes its synthetic fixtures. Existing production data, secrets, DNS, and database schema remain unchanged.

## Application-wide artwork follow-up

Worker version `f26bd016-cc93-4529-9db1-a9f38033a5f5` publishes the shared page-edge artwork, cropped section/dialog relief, desktop left-side hero art, and refined gauge spacing. The Cloudflare build passes; the generated Worker retains only public environment exports, and the 1,599-file scan finds no configured private secret values, native SQLite import, or provider-mock marker.

Thirty live public-page/viewport checks through 1920px verify global and section artwork, responsive bounds, the desktop-only hero layer, 100/100 ring clearance, scrolled lower sections, and sample controls over normal DNS. The hosted authentication/persistence/ownership/document/modal smoke also passes and removes its uniquely scoped synthetic fixtures before reporting success. Existing production data, secret bindings, DNS, and database schema are preserved; no AI-provider call or new resource is involved.

## Left-background removal

Worker version `af23864e-0149-44a7-8657-6783ed39bd38` removes the left page-edge, hero, and left-aligned section-wave layers, retaining the right-side canvas and section details. The production Cloudflare build passes. Twelve read-only live layout checks through 1920px confirm the removed layers are absent, right-side artwork remains visible, and pages have no horizontal overflow. Production data, secrets, DNS, and schema were not changed.

## Plain sample container

Worker version `7c957432-8880-4886-b4bc-5a416035a551` removes both the inner and surrounding decorative relief from the sample-preview container. Its neumorphic surface and page-level right background remain. The production build and six live viewport/interaction checks through 1920px pass. Data, secrets, DNS, and schema were not changed.

## Standalone sample — 12 November 2026

Worker version `a1e3c614-2566-4c78-9138-8f2c078d98f9` publishes the public `/sample` route and a compact landing hero. All sample entry links now use the dedicated page. The Node/Cloudflare builds pass. Twelve live Chromium/WebKit layouts through 1920px verify landing-to-sample/back navigation, candidate selection, ranking/reset, auth-page entry links, plain preview surfaces, no overflow, SSR/SEO/sitemap, and no API requests. The 1,602-file artifact scan finds no configured private secret values, native SQLite import, or provider-mock marker; generated environment exports remain public-only. Production data, secret bindings, DNS, and schema were preserved. No new hosting resource or AI-provider call was involved.

## Compact hero and raised headings — 12 November 2026

Worker version `0eebaa46-6320-4fba-b4a3-62e71d0314c4` publishes the tighter desktop hero and shared static heading relief. Node and Cloudflare production builds pass. Twelve live Chromium/WebKit homepage layouts through 1920px verify compact desktop proportions, no overflow, exact unshadowed wordmarks, and the separate sample. Additional live checks cover public-page headings, increased-contrast suppression, sample navigation/ranking/selection, and no API calls. Both production secret bindings remain configured. All 1,602 scanned generated code/config files exclude configured private values, native SQLite, and provider mocks; generated environment exports remain public-only. Production data, secrets, DNS, schema, and hosting resources were preserved.
