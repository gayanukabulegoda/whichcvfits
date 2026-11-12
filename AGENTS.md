# WhichCVFits — agent instructions

Read this file before modifying the project. CLAUDE.md points here.

## Authorization and scope

- Keep all work local unless the user explicitly requests deployment.
- Do not create repositories, initialize Git, commit, push, create cloud resources, apply remote migrations, or deploy without an explicit instruction.
- Local builds, isolated tests, and local Worker/D1 emulation are supported.
- The owner authorized the Cloudflare pilot in the configured account. See docs/DEPLOYMENT.md for its URL and deployment procedure. Production D1 contains user data; use the uniquely scoped deployment smoke fixtures, never the local mocked-provider suite against the live site.
- Do not upgrade the hosting plan or purchase domains without an explicit owner decision.
- The primary origin is https://whichcvfits.grbulegoda.com. The Namecheap hostname uses the Pages service-binding gateway in gateway/. Preserve the public Host/Origin, session cookies and private cache controls. Do not move the parent domain nameservers. Follow docs/CUSTOM-DOMAIN.md and verify DNS/HTTPS before changing the public canonical origin.
- Do not stop or replace another development server; use the isolated QA server on another port.
- No sub-agent or delegation requirement exists.

## Product and brand

WhichCVFits helps recruiters review professional CV evidence against job-related criteria. It uses the user's own provider key. It does not make hiring decisions or guarantee model accuracy.

Always use the shared Wordmark/BrandLogo:

- WhichCV: **#0F172A**.
- Fits: **#10B981**.
- Preserve the W-check icon, including its indigo/navy background and emerald check.
- Light blue porcelain canvas **#E8EDF5**, elevated gradient **#F1F5FB → #E5ECF5**, white highlights, balanced navy/blue and emerald accents.
- Keep exact wordmark colors above. Use tonal blue **#3457B1 / #253D83** for navigation, fields, and primary actions; emerald for CVs, evidence, and positive outcomes. Use darker emerald **#08745C** for readable small text. Do not use bright logo green for ordinary body text.
- No palette switching or dark page theme. Semantic warning/error colors are allowed for status.
- Use the shared light neumorphic classes and components in globals.css. Avoid layering unnecessary cards inside cards.
- Visible focus, readable contrast, accessible names, and 44px touch controls matter more than shadow effects.
- Background effects must remain bounded and respect reduced motion.
- Keep page-edge artwork on the right. Do not reintroduce left-side page/hero layers or left-aligned section waves; retain right-corner section details.
- Keep the /sample preview container free of internal or surrounding decorative artwork; use a plain neumorphic surface.
- Use BrandCanvas/ReliefArt for static CSS/SVG relief artwork. Keep decorations behind opaque content, hidden from assistive technology, and free of animation loops, raster downloads, or heavy filters. See docs/UI-REDESIGN.md for the design rationale and verification.

## Architecture

Next.js App Router, React, TypeScript, Tailwind CSS. Public pages are server-rendered; interactive forms/studio use client components. Protected segment layouts call requireUser server-side and seed WorkspaceProvider with sanitized account/key information.

The asynchronous SQL repository uses build-selected adapters:

- Native Node SQLite in src/db/node.ts, honoring WHICHCVFITS_DB_PATH.
- D1 in src/db/cloudflare.ts, selected by the Cloudflare build through a module replacement in next.config.ts.
- Never import native SQLite/filesystem modules into Worker code.
- Use the Cloudflare wrapper scripts; keep the generated Worker environment public-only. OpenNext otherwise copies private dotenv values into its bundle. Runtime bindings must provide secrets.
- Preserve pinned security overrides for glob/minimatch until compatible upstream patches remove the need; verify both builds after dependency updates.
- SQL migrations in migrations/ are authoritative; keep the Drizzle schema mirror synchronized.
- Native migrations back up existing databases before applying pending changes. Never reset the user's database to make a test pass.
- Successful results and their immutable configuration are saved atomically.
- Preserve old accounts, IDs, password hashes, and readable historical results. Missing legacy metadata must remain explicitly unavailable.

## Evaluation invariants

- Every real evaluation requires a verified saved key for the selected provider.
- No shared demo login, simulation keys, format-only verification, silent provider fallback, or local synthetic scores in production.
- Use catalog model IDs and documented per-model reasoning controls. Filter by discovered provider models where available. Never silently change the selected model.
- Validate requests and responses with shared Zod contracts.
- Normalize nonnegative weights to 100%; reject zero totals. Defaults: skills 40, experience 30, domain/impact 20, qualifications 10.
- Every must-have needs an assessment and affirmative source evidence. Unmet/unclear criteria cap the score at 45 and block shortlisting regardless of threshold.
- Verify evidence against the submitted text. A skill mentioned in a denial must not count as positive evidence.
- Fit tiers: top >=85, strong >=70, partial >=50, weak <50; disqualified overrides these.
- Rank eligible candidates first, then descending score, skills, and stable input ID.
- At most three concurrent provider calls; 90-second timeouts and one bounded retry for transient network/HTTP failures.
- Failures stay explicit and unscored. Retry only failed CVs under the original configuration, preserving earlier successful results.
- Display the saved run's provider, actual model, effort, criteria, and threshold rather than the current selector values.

## Documents and UX

- Normal file processing runs locally in the browser. Lazy-load self-hosted PDF.js as a native browser module and its worker. Do not route CVs through third-party parsers/CDNs.
- DOCX uses a bounded central-directory ZIP/XML reader. No heavy native parser addons.
- Supported: text PDF, DOCX, TXT, MD; no OCR.
- Limits: 20 CVs, 5 MiB/file, 20 MiB/selection, 30 PDF pages, 50,000 extracted characters/CV.
- Never accept binary garbage, silently truncate, or fabricate placeholder extraction. Show per-file failures and offer paste/edit recovery.
- The public /sample page is clearly illustrative, account-free, and makes no API/AI requests. The landing page links to it and must not mount the simulator.
- Desktop >=1024px: 5/7 configuration/results split. Tablet: stacked workspace and two-column results. Mobile <768px: one top step switcher and one safe-area-aware bottom action.
- The mobile step switcher must be hidden at >=768px; generic segmented-control styles must not override that rule. The landing hero is a compact introduction. The separate sample uses candidate/evidence columns on desktop and tablet, with compact candidate choices above the assessment on phones. Settings has three provider cards and two lower sections on desktop, stacked on phones.
- Preserve readiness, circular match gauges, skill spotlight, comparison (max three), safe CSV export, and history.
- All popups use Dialog with native modal semantics, Escape, focus containment/restoration, and scrollable content.

## Security and setup

Run npm ci then npm run setup. Do not copy dependencies from another project.

- WHICHCVFITS_JWT_SECRET and WHICHCVFITS_ENCRYPTION_SECRET must be independent configured secrets >=32 characters. Never print or commit them.
- AES-256-GCM encryption is server-side encryption, not zero knowledge.
- Keep password compatibility (PBKDF2-SHA256, 100,000 iterations); changing formats requires explicit compatibility handling.
- Sessions: signed HMAC, seven days, HttpOnly, SameSite Lax, Secure in production.
- Check origin against the public Host/scheme, not Next's internal reconstructed hostname.
- Maintain per-action limits, bounded bodies, ownership checks, sanitized errors, and no-store private responses.
- Do not log credentials, full prompts, CV text, or provider error bodies.

## Checks and documentation

- npm test
- npm run typecheck
- npm run test:design (while the isolated production QA server is running; never target production)
- npm run build
- npm run db:migrate:local
- npm run build:cloudflare
- npm run preview:cloudflare
- See README.md for the isolated QA server and browser suite. Never point automated mutating tests at the user's native database.
- Test widths: 320, 360, 390, 430, 768, 1024, 1280, 1440; include Job/CVs/Results, dialogs, landscape, zoom, reduced motion, keyboard navigation, and accessibility.
- Test original model labels/history, owner deletion, partial retries, negatives, fabricated quotes, malformed input, and real PDF/DOCX fixtures.
- Keep public SEO metadata, canonicals, social previews, sitemap, and truthful structured data. Private/auth routes need server-rendered noindex and server-side authorization.
- Do not claim live provider checks or field performance based on mocks/lab tests. Record verification limits candidly.
