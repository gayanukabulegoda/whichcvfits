# WhichCVFits

A recruiter workspace for comparing CV evidence against job criteria, using your own Google Gemini, Anthropic Claude, or OpenAI API key.

## Run locally

Use Node.js 22.23.2 or later.

```sh
npm ci
npm run setup
npm run dev
```

Open the URL printed by Next.js. Setup creates two independent random secrets in ignored, permission-restricted `.env.local` and `.dev.vars` files and copies the pinned PDF.js browser engine/worker into `public/workers`. Existing secrets are never overwritten.

For production on Node:

```sh
npm run build
npm start
```

Keep `WHICHCVFITS_JWT_SECRET` and `WHICHCVFITS_ENCRYPTION_SECRET` stable and separate. They must each contain at least 32 characters. Changing the signing secret signs users out; changing the encryption secret makes previously saved API keys unreadable. No default production secrets are provided.

`WHICHCVFITS_DB_PATH` optionally changes the native SQLite path (default `./data/whichcvfits.db`). First access applies versioned migrations. Existing databases receive a SQLite-consistent backup before pending migrations; keep backups secure because they contain account and candidate data. The pre-redesign account remains compatible and can sign in with its existing password. Older sessions need a fresh sign-in.

## Workflow

1. Create an account and connect an AI key, or skip onboarding to explore.
2. Add a role, description, optional must-haves, scoring weights, and shortlist threshold.
3. Upload text PDFs, DOCX, TXT, or Markdown files, or paste text. Files are parsed on the device, one at a time. Inspect/edit extracted text before evaluation.
4. Select your provider, accessible supported model, and supported reasoning effort.
5. Evaluate, inspect evidence and interview questions, compare up to three candidates, export CSV, or reopen/delete saved runs in Settings.

The public sample is illustrative and makes no AI calls. Real evaluations always require a verified provider key. Provider failures never become synthetic scores. API access and usage charges are determined by the provider.

Limits: 20 CVs per queue, 5 MiB per file, 20 MiB per selection, 30 PDF pages, and 50,000 extracted characters per CV. Scanned or protected PDFs require pasted text; OCR is not included. Unevaluated queues are held in browser memory.

Scores use normalized nonnegative weights (40/30/20/10 by default). Unmet or unsubstantiated must-haves block shortlisting and cap the score at 45. Exact CV quotes are validated after whitespace normalization; this checks source correspondence, not whether the candidate's claims are true. Scores and model judgments can vary across runs.

## Cloudflare

The same app has a build-selected D1 adapter. The Worker bundle excludes native SQLite and database filesystem code.

```sh
npm run db:migrate:local
npm run build:cloudflare
npm run preview:cloudflare
```

Use the provided build/preview scripts: they strip private dotenv values from OpenNext’s generated environment module, retaining only `NEXT_PUBLIC_` configuration. Worker signing/encryption secrets must come from runtime bindings (`.dev.vars` locally); the generated bundle contains no configured secret values.

These commands use local D1 emulation and a local Worker preview. They do not create resources or deploy remotely. `wrangler.jsonc` now contains the owner’s account/database identifiers for the deployed pilot; these are public resource identifiers, not credentials. A separate installation must use its own account and D1 binding.

Cloudflare builds require actual local dependencies rather than a `node_modules` symlink to another project because standalone file tracing follows real paths. `npm ci` installs the required versions. The pinned compatibility date matches the tested local runtime. Hosting quotas and CPU limits apply; BYOK does not guarantee free hosting.

Native SQLite data is not automatically copied into D1. A later production migration must explicitly export/import the selected data and verify record counts. Local D1 sample accounts used for QA are separate from the native application database.

The site is live at **https://whichcvfits.grbulegoda.com**. See [deployment instructions and hosted verification](docs/DEPLOYMENT.md). Production secrets are independent of local secrets; the local account/database were not uploaded.

To redeploy into the configured owner account after signing in:

```sh
NEXT_PUBLIC_SITE_URL=https://whichcvfits.grbulegoda.com npm run deploy:cloudflare
```

This rebuilds, sanitizes private environment values, and publishes. It does not upgrade the hosting plan. Hosted verification with synthetic data does not establish live AI-provider access or unrestricted free-tier capacity.

## Verification

```sh
npm test
npm run typecheck
npm run build
npm run build:cloudflare
npm run format:check
```

The regression suite uses an isolated temporary database and mocked provider transports. It covers crypto, sessions, scoring, negations, evidence, limits, provider adapters, outages, concurrency, Unicode/DOCX, CSV safety, migration backups, atomic persistence, ownership, and deletion.

Browser verification uses an isolated QA server with provider responses mocked **only in that Node process**:

```sh
# First terminal, after npm run build
node scripts/qa-server.mjs
# Second terminal
npm run test:browser
npm run test:design
npm run test:gauges
```

For iterative UI QA, use `QA_PORT=3108 node scripts/qa-server.mjs --dev` and `QA_BASE_URL=http://127.0.0.1:3108 npm run test:browser`. The development QA server has its own `.next-qa` directory. Browser binaries must already be available to Playwright. The QA preload refuses to run without an isolated temporary database. It is never imported by application routes or packaged into the Worker.

Run `node scripts/performance.mjs` against the production QA server for local Lighthouse reports. Run `node scripts/worker-smoke.mjs` while the local Worker preview is running for disposable D1 persistence/ownership checks. Both require local browser/network permissions.

The browser suite records an unavailable browser runtime separately. Use `QA_REQUIRE_ALL_BROWSERS=1` to fail when any browser engine cannot launch. The 320px scenarios cover the reflow width equivalent to 400% zoom at 1280px. Physical-device keyboards and assistive technologies still need device testing.

Screenshots, responsive measurements, and accessibility reports are written to ignored `artifacts/qa`. The design suite adds screenshots and boundary checks for every dialog, three-candidate comparison, short viewports, and tablet/desktop navigation under ignored `artifacts/redesign`; it accepts only the isolated loopback QA ports. See [the design notes](docs/UI-REDESIGN.md) for research and layout decisions. Live Google/Anthropic/OpenAI smoke tests require valid user-supplied keys and may incur provider charges; they were not used for automated verification.

The gauge check renders the actual shared component at 0, 9, 94, and 100 in all three sizes, using the QA site's compiled stylesheet. It measures label clearance from the inner progress curve at 320/768/1440px and writes its gallery and measurements to ignored `artifacts/polish`.

## SEO and privacy

Public pages render their content on the server. Canonicals default to `https://whichcvfits.grbulegoda.com`; set `NEXT_PUBLIC_SITE_URL` before building for another origin. Metadata, sitemap, robots rules, social images, icons, semantic headings, and truthful application structured data are included. Authentication and private workspace pages emit `noindex`; server-side authentication protects private content.

See `/privacy` for the data flow. Keys use server-side AES-GCM encryption, not zero-knowledge storage. Saved successful CV text and results remain until the owner deletes the run. Backups and external provider retention are separate operator/provider responsibilities.

## Repository

One repository: **whichcvfits**. It contains the web app, API routes, database adapters/migrations, tests, and documentation. No frontend/backend repository split is needed.

See [implementation and verification report](docs/IMPLEMENTATION.md) for findings, research, measured results and remaining limits.

For the Namecheap subdomain, see [custom-domain setup and DNS record](docs/CUSTOM-DOMAIN.md). Authoritative DNS remains at Namecheap; the Pages gateway forwards to the existing Worker and database. The original Worker address remains available with the custom-domain canonical URL.
