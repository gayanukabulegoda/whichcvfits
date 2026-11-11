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
- **Version:** `cf85b695-3f70-4791-a15d-0b5f5765de3b`
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
