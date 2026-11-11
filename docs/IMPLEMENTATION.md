# Redesign and reliability verification

Implemented locally on 10 November 2026. One repository, `whichcvfits`, contains the frontend, API, migrations, tests, and documentation. The redesign and verification were completed locally before publication. The owner subsequently supplied the GitHub repository and authorized initialization, focused commits, and a push to `main`. No deployment or remote Cloudflare resource operation was performed during that initial phase. The owner later authorized a Cloudflare pilot; see [deployment status](DEPLOYMENT.md) for the subsequent hosted work.

The additional visual redesign on 11 November 2026 has its own [design research and verification record](UI-REDESIGN.md). The measurements below describe the initial overhaul; consult the newer record for the current layout and measurements.

## Audit findings and resulting behavior

| Area                 | Confirmed problem                                                               | Implemented behavior                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Brand and layout     | Alternate palettes, inconsistent wordmark colors, mobile overflow               | Fixed light porcelain/neumorphic system, shared exact navy/emerald wordmark, preserved W-check icon, bounded CSS backgrounds                                                                     |
| Recruiter workflow   | Dense configuration, duplicated mobile navigation, prominent technical controls | Desktop 5/7 workspace; stacked tablet layout; mobile Job/CVs/Results switcher and one safe-area action bar; progressive details                                                                  |
| Popups               | Missing consistent focus management and dismissal                               | Native shared modal, scroll locking, bounded scrolling body, Escape, focus containment and restoration; explicit Safari invocation tracking                                                      |
| Onboarding           | Shared demo credentials and test-key controls                                   | Account-free illustrative sample; real provider verification; obvious skip; optional model/effort defaults                                                                                       |
| Documents            | Binary/text guesses and fabricated extraction                                   | Sequential device parsing, self-hosted lazy PDF engine/worker, bounded DOCX ZIP/XML, Unicode native text decoding, editable text and explicit file errors                                        |
| Evaluations          | Provider outages could become local keyword scores                              | No production simulations or silent fallback; structured provider adapters, local schema validation, actual upstream model, visible per-candidate failures                                       |
| Mandatory criteria   | Dealbreakers did not prevent shortlisting                                       | Each criterion requires an affirmative source quote; unmet/unclear caps score at 45 and blocks shortlisting even at a zero cutoff                                                                |
| Evidence and ranking | Weak quote validation and ambiguous score tiers                                 | Exact normalized source checks, conservative negation checks, canonical fit tiers, eligible-first stable ranking                                                                                 |
| History              | Current model selectors could mislabel old runs                                 | Saved immutable model/provider/effort/rubric/criteria/threshold; missing old metadata remains unavailable                                                                                        |
| Exports              | Inconsistent CSV encoding/escaping                                              | UTF-8 BOM Blob download, consistent quoting, spreadsheet formula protection                                                                                                                      |
| Runtime              | Borrowed dependency symlink, filesystem-only database                           | Project-owned pinned dependencies/lockfile, asynchronous native SQLite and D1 adapters, explicit build-selected runtime                                                                          |
| Security             | Hardcoded secret fallbacks and permissive key verification                      | Independent configured secrets, compatible password verification, validated seven-day signed sessions, owner checks, bounded bodies, origin checks, action limits and private no-store responses |
| SEO                  | Interactive public shell and incomplete metadata                                | Server-rendered public pages, unique metadata/canonicals, social images/icons, sitemap/robots, truthful structured data, server-rendered private/auth noindex                                    |

## Document and scoring limits

The queue accepts 20 CVs, with 5 MiB per file, 20 MiB per selection, 30 PDF pages and 50,000 extracted characters per CV. Processing is sequential. Scanned, protected, corrupt and unreadable PDFs fail explicitly with paste-text recovery; OCR is deliberately excluded. Duplicate file fingerprints are detected. Queues are transient browser memory until successful evaluation results are saved.

Weights are nonnegative and normalized to 100%; all-zero weights are rejected. Defaults remain 40/30/20/10. Fit tiers are top at 85, strong at 70, partial at 50 and weak below 50; disqualified overrides the tier. Provider concurrency is three, with a 90-second timeout and one bounded retry for transient network/HTTP failures. Partial batches preserve successes and retry only failed input IDs under the original configuration. Request reservations prevent parallel duplicate billing for the same request ID.

A source-matching quote does not establish the truth of a candidate's claim. Negation detection is conservative and rule based; professional human review is still required. Model judgments and scores are not calibrated hiring probabilities.

## Persistence and migration safety

The original native database was checked read-only after implementation: **1 user, 0 keys, 0 evaluation jobs, 0 candidate evaluations**, matching the initial audit. Automated mutating Node tests use isolated temporary databases. The user's original account/data were not replaced.

Native first access honors `WHICHCVFITS_DB_PATH`, makes a SQLite-consistent backup before pending migrations, then applies versioned SQL migrations. Existing password hashes and record IDs remain compatible. Previous sessions require a new sign-in. Keep both configured secrets stable; changing encryption secrets prevents reading previously encrypted keys.

Local D1 is a separate emulator. All four migrations were applied locally. Native SQLite is not automatically exported to D1. A later production migration must export/import selected records and verify counts before cutover. No remote migration was run during the initial audit; the later authorized pilot applied these migrations to a newly created production D1 database (see [deployment status](DEPLOYMENT.md)).

## Verification results

| Check                     | Result                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Automated regressions     | **19 suites pass**: crypto, sessions, provider schemas, mandatory rules, negations, fabricated quotes, weights, ranking, concurrency, partial batches, unsupported models, provider/network failures and retries, bounded responses, DOCX/Unicode, CSV, migration backups, atomic persistence, ownership, deletion and Worker environment sanitization |
| TypeScript and formatting | Pass                                                                                                                                                                                                                                                                                                                                                   |
| Node production build     | Pass                                                                                                                                                                                                                                                                                                                                                   |
| OpenNext Cloudflare build | Pass; native SQLite/filesystem database code and QA transport excluded                                                                                                                                                                                                                                                                                 |
| Local D1 migrations       | All four applied successfully; no remote operations                                                                                                                                                                                                                                                                                                    |
| Local Worker/D1 smoke     | Authentication, onboarding skip, protected SSR, history, original model labels, legacy metadata, owner isolation and atomic run/candidate deletion pass                                                                                                                                                                                                |
| Production Chromium       | Full recruiter workflow and **89 responsive scenarios** pass                                                                                                                                                                                                                                                                                           |
| WebKit                    | Local text PDF/DOCX, evaluation, modal keyboard/focus and 320/390/1280px smoke checks pass                                                                                                                                                                                                                                                             |
| Firefox                   | Unavailable: installed binary cannot open a profile; not counted as passed                                                                                                                                                                                                                                                                             |
| Accessibility             | 13 axe reports, zero unreviewed violations; three reports retain the narrowly reviewed logotype contrast exception                                                                                                                                                                                                                                     |
| Dependency advisories     | Full tree **0**; production tree **0**, as reported by npm audit on the verification date                                                                                                                                                                                                                                                              |
| Bundle audit              | Configured secret values absent from Worker/browser JavaScript; private values stripped from generated environment modules                                                                                                                                                                                                                             |
| SEO output                | Public SSR headings/canonicals/structured data; private/auth noindex; robots/sitemap/social images/icons pass                                                                                                                                                                                                                                          |

The Chromium matrix covers 320, 360, 390, 430, 768, 1024, 1280 and 1440 CSS pixels across all eight public/auth/private routes, plus mobile workspace panels, navigation, dialogs and landscape. The 320px reflow width is equivalent to 400% zoom from 1280px; a physical browser zoom/OS matrix is not claimed. Reduced-motion and keyboard tab/modal behavior are checked. Real image-only, text-PDF, 31-page PDF, complete DOCX and Unicode fixtures verify mixed-success uploads and explicit recovery messages.

The isolated browser flow also checks signup/login/logout, onboarding skip, missing-key gating, real key-adapter verification through a mocked transport, inaccessible-model rejection, masked key responses, replacement/removal, evidence, comparison, CSV, immutable history labels, owner-only read/delete, partial retries and request replay.

### Production lab measurements

Measured locally using Lighthouse 13.6.0, a production Next server and Playwright Chromium. Mobile uses Lighthouse simulated mobile throttling; desktop uses the script’s desktop profile. These are single local lab runs, not deployed or real-user measurements.

| Page            | Profile | Performance | SEO | Best practices | Accessibility |   FCP |   LCP |  TBT | CLS |
| --------------- | ------- | ----------: | --: | -------------: | ------------: | ----: | ----: | ---: | --: |
| `/`             | mobile  |         100 | 100 |            100 |            95 | 0.76s | 0.76s | 72ms |   0 |
| `/`             | desktop |         100 | 100 |            100 |            95 | 0.21s | 0.21s |  0ms |   0 |
| `/how-it-works` | mobile  |         100 | 100 |            100 |            96 | 0.75s | 0.75s | 36ms |   0 |
| `/privacy`      | mobile  |         100 | 100 |            100 |            96 | 0.76s | 0.76s | 36ms |   0 |

Lighthouse’s only scored accessibility finding is the footer wordmark’s exact green. The logo retains the requested `#10B981`; other text and controls must meet normal contrast requirements. The logotype exception is narrowly reviewed in axe output rather than disabling the contrast rule.

Ignored `artifacts/qa/` contains screenshots at 390/1440px, responsive JSON, 13 axe reports with exceptions, cross-browser status, Lighthouse reports/summary, dependency audits and bundle-check results. Only synthetic candidate fixtures and mocked provider keys were used.

Provider transports in automated evaluation tests are mocked only in the isolated QA Node process. The application and Worker contain no mock-key or offline-scoring production path. The Worker smoke uses synthetic SQL fixtures and no provider calls; it removes its own account/run fixtures on completion.

## Research used

Implementation decisions were checked against primary documentation:

- [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): modal semantics, keyboard behavior, focus containment/restoration.
- [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): 320 CSS pixel layouts, including the layout equivalent of 400% zoom on a 1280px viewport.
- [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): readable content colors; exact requested wordmark colors have the logotype exception.
- [OpenAI reasoning](https://developers.openai.com/api/docs/guides/reasoning) and [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs): model-specific reasoning parameters and strict structured responses.
- [Anthropic effort](https://platform.claude.com/docs/en/build-with-claude/effort) and [structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs): adaptive reasoning and provider-specific supported JSON Schema constraints.
- [Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking) and [structured output](https://ai.google.dev/gemini-api/docs/structured-output): model-specific thinking levels/budgets and schema subset.
- [PDF.js examples](https://mozilla.github.io/pdf.js/examples/): browser document loading and a separate self-hosted worker.
- [OpenNext Cloudflare setup](https://opennext.js.org/cloudflare/get-started) and [bindings](https://opennext.js.org/cloudflare/bindings): local Worker packaging and request-scoped D1 access.
- [Cloudflare D1 batches](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch): transactional result persistence/deletion.
- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): public server-rendered content and canonical/indexing directives.

Provider wire schemas are intentionally adapted to each API subset. Anthropic rejects several numeric/string/array bounds accepted by Zod; those become descriptions on the wire and remain fully enforced on the server. The app never supplies replacement scores to repair malformed output.

A build artifact audit also found OpenNext copying private dotenv values into `cloudflare/next-env.mjs`. The provided build/preview wrappers now sanitize that module to `NEXT_PUBLIC_` values only. A regression test checks every environment mode and rejects unknown formats. Configured signing/encryption secret values were checked for absence in Worker and browser JavaScript; runtime bindings supply them.

The final dependency audit reports zero advisories for both the full and production trees. DOCX compression and Wrangler were patched; Lighthouse was updated; unused Drizzle migration tooling was removed because versioned SQL migrations are authoritative. Pinned `glob`/`minimatch` overrides address build-tool advisories and were validated through both builds. Retest these overrides when upgrading the adapter.

## Remaining limits and operation notes

- Live key verification and paid evaluations need valid user-supplied provider keys. Mocked adapter tests do not prove account-specific model access, quotas, current billing or provider latency.
- The installed Firefox runtime cannot launch a profile in this environment. This is recorded as unavailable, not a passed browser test. Chromium and WebKit results are recorded separately. Use `QA_REQUIRE_ALL_BROWSERS=1` to require every installed engine in another environment.
- Automated accessibility checks supplement manual keyboard/reflow inspection; they do not establish complete WCAG certification. The narrowly reviewed green wordmark contrast exception is retained to honor the exact logo color.
- Browser emulation covers layout and keyboard behavior; it does not replace physical-device checks of software keyboards, safe areas, assistive technology and every mobile OS version.
- Production lab performance is local and simulated; no real-user Core Web Vitals or deployed search indexing is claimed.
- The initial Cloudflare verification was local. The subsequently authorized hosted pilot and its actual checks are recorded in [deployment status](DEPLOYMENT.md). Free hosting capacity is not guaranteed.
- There is no OCR, password recovery email service, team/ATS integration or automatic native-to-D1 data transfer.
- Deleting runs removes active stored CV/results; operator backups and external AI provider retention require separate management. The public privacy page explains this data flow.

## Local handoff

See [README](../README.md) for setup and commands. Run `npm ci`, `npm run setup`, then `npm run dev`. Keep `.env.local`, `.dev.vars`, database files and backups private. Set `NEXT_PUBLIC_SITE_URL` before a production build if the intended origin differs from `https://whichcvfits.grbulegoda.com`.
