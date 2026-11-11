# Responsive neumorphic redesign

The November 2026 visual refresh uses the owner's sculpted-interface references to make WhichCVFits denser, more distinctive, and easier to scan. Evaluation, document processing, account security, and persistence contracts remain unchanged.

## Research and design decisions

Neumorphism works best here as surface treatment rather than the only signal that a control exists. Soft dual shadows suggest raised cards; inset surfaces distinguish editable fields and scoring controls. Labels, explicit borders, selected states, text, and focus rings carry meaning independently of decorative shadows.

- [W3C non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast) informed visible field boundaries and selected states. The standard field boundary is #71819A against #E6ECF5 (3.33:1); placeholder text is #5C6980 (4.67:1 against the base field fill). Decorative contours do not convey information.
- [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) informed generous controls. Primary buttons, icon controls, mobile tabs, and interactive skill chips retain at least 44px height, beyond the 24px WCAG minimum in the general case.
- [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) informed the 320px checks, equivalent to the reflow width at 400% zoom from a 1280px viewport. Responsive layouts change composition, not just font size.
- [W3C modal-dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) supports the existing shared native dialog, keyboard containment, Escape, focus restoration, and independent body scrolling. Mobile sheets keep their close control above scrollable content.
- [web.dev animation performance](https://web.dev/articles/animations-and-performance) informed short transform/opacity transitions. Decorative artwork stays static; there are no continuous animation loops or layout animations.
- [web.dev reduced-motion guidance](https://web.dev/articles/prefers-reduced-motion) informed the global reduced-motion override, including smooth scrolling and dialog/detail transitions.

These choices adapt the supplied references to readable recruiter workflows. They do not establish universal accessibility conformance or physical-device performance.

## Brand and surfaces

The shared wordmark always renders **WhichCV #0F172A** and **Fits #10B981**. The existing indigo/navy W-check mark remains intact. There is no palette switch or dark page theme.

- Canvas: #E8EDF5, with raised gradients #F1F5FB → #E5ECF5 and white highlights.
- Navy and tonal blue (#3457B1 / #253D83): headings, navigation, primary actions, field focus, role configuration, strong-fit results.
- Emerald (#10B981): CV configuration, evidence accents, positive outcomes. Dark emerald (#08745C) supplies readable green text.
- Amber and rose retain their status meaning for uncertainty and unmet requirements. Scores and explicit labels accompany the colors.

BrandCanvas and ReliefArt provide reusable code-native orbit, wave, pebble, and dot relief. They are hidden from assistive technology, clipped to bounded containers, and cannot receive pointer input. Opaque content surfaces keep the decoration from competing with forms. No artwork bitmap, remote font, animation library, canvas loop, or SVG filter is loaded.

## Layout and workflow

The landing page now leads with the purpose, two clear actions, and an interactive sample labeled as illustrative. A compact capability rail, three-step explanation, criteria/evidence benefits, FAQ, and closing action replace large empty promotional areas.

At desktop widths, the landing introduction sits beside the sample. At 768–1023px, the introduction spans the width with separate text/action areas; the sample becomes a two-column candidate/evidence console underneath. Phones use one column, horizontal step cards, compact controls, and smaller bounded artwork.

Authentication uses a two-column introduction/form layout on desktop and tablet; phones show the focused form. Onboarding clearly separates provider selection from key connection. Settings places three provider cards above defaults and history on desktop, with single-column sections on phones.

The desktop studio retains the 5/7 configuration/results split. Tablet configuration uses two columns above results. Result cards use two columns on tablet and wide desktop, and one column on intermediate desktop and phones. Mobile has exactly one sticky Job/CVs/Results switcher and one safe-area-aware evaluation bar; the switcher is hidden from tablet upward. Candidate actions align at the bottom of each card. Provider connection status appears below the provider selector to avoid crowded option labels.

Results use green for top matches, blue for strong matches, and explicit warning/error tiers. Detailed evidence retains readable quote panels and alternating score-bar accents. Comparison starts with a compact name/rank/gauge heading, supports up to three candidates, and stacks on phones. CSS subgrid aligns scoring rows across different name lengths in supporting browsers; the normal grid remains a fallback. Guide/data pages use balanced reading columns on desktop and a continuous reading flow on narrower screens.

## Reproducing verification

Start `node scripts/qa-server.mjs` after `npm run build`. It creates a disposable database and enables mocked provider transport only in that process. Keep the owner's development server and original database separate.

- `npm test`: isolated business/security/persistence regression suites.
- `npm run test:browser`: account/workflow tests, eight viewport widths, keyboard/modal checks, axe reports, SEO, and cross-engine smoke.
- `npm run test:design`: 67 screenshots and boundary checks at 320, 390, 768, 1024, and 1440px, including every dialog, three-way comparison, short viewport, landscape, and mobile navigation visibility. Accepts only loopback QA ports 3107/3108.
- `node scripts/performance.mjs`: production-mode Lighthouse on mobile/desktop home and mobile public guides.

Screenshots and machine reports remain in ignored artifacts/qa and artifacts/redesign. Synthetic candidate names and provider responses in screenshots are test fixtures. The design check waits for lazy dialog content and entry animations before measuring; dialog captures show the actual viewport rather than a misleading full-page modal montage.

## Verification results

Local release checks passed on 11 November 2026: TypeScript, formatting, the Node production build, 21 regression suites, and 89 Chromium responsive/workflow scenarios across 320, 360, 390, 430, 768, 1024, 1280, and 1440px. The 13 axe reports contain no unreviewed violations; the exact green wordmark uses the narrowly documented [W3C logotype exception](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). WebKit passes document processing, evaluation, modal focus/keyboard, and responsive smoke checks. The installed Firefox runtime cannot launch its temporary profile, including with an alternate temporary directory, and is recorded as unavailable rather than passed. The additional 67 visual checks pass, including all dialog bounds/close controls, three-way comparison alignment, short viewport, landscape, reduced motion, and the desktop visible-label/accessibility-name check. A desktop navigation accessible-name mismatch found by Lighthouse was corrected and added to the design check. Live AI-provider verification requires valid owner-supplied keys and was not part of this visual refresh. Physical phone keyboards, screen readers, and field performance remain separate checks; a shortened browser viewport is a layout simulation.

### Final production lab measurements

Lighthouse 13.6 on the isolated production server, using the script’s mobile/desktop profiles. These single local lab runs do not establish field performance or a guarantee for every device.

| Page | Profile | Performance | SEO | Best practices | Accessibility | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| / | mobile | 100 | 100 | 100 | 95 | 0.75s | 55ms | 0 |
| / | desktop | 100 | 100 | 100 | 95 | 0.21s | 0ms | 0 |
| /how-it-works | mobile | 100 | 100 | 100 | 96 | 0.75s | 33ms | 0 |
| /privacy | mobile | 100 | 100 | 100 | 96 | 0.75s | 72ms | 0 |

All four profiles score 100 for performance, SEO, and best practices, with zero measured layout shift. The remaining scored Lighthouse accessibility finding is the exact emerald wordmark; the reviewed logotype exception does not apply to ordinary content or controls.

### Hosted release

Published on 11 November 2026 to [whichcvfits.grbulegoda.com](https://whichcvfits.grbulegoda.com), Worker version `cf85b695-3f70-4791-a15d-0b5f5765de3b`. The Cloudflare production build and upload pass. The 1,599 generated code/config files were scanned without finding configured private secret values, native SQLite imports, or the isolated provider-mock marker; generated Worker environment exports contain only public variables. Both existing production secret bindings remain present.

Hosted signup/login/logout, secure sessions, protected pages, origin checks, verified-key gating, D1 persistence, saved-model/legacy metadata, cross-owner read/delete isolation, atomic deletion, local PDF/DOCX/Unicode processing, dialog focus, and 320/390/768/1280px workspace reflow pass. The smoke test removed its uniquely scoped synthetic accounts and fixtures before reporting success. No live AI-provider call was made.

All 12 public/SEO/icon/document-asset checks pass over ordinary DNS and HTTPS. Live browser screenshots additionally confirm the final canvas and exact wordmark colors, no page overflow at 320/390/768/1440px, and the account-free sample interaction. No browser DNS override, DNS record update, new hosting resource, plan upgrade, or production schema migration was needed for this refresh. The existing database and secret values were preserved.

## Score spacing and desktop hero polish

Following the owner's screenshot review, score gauges place the value above /100 rather than squeezing both onto one line. The progress curve has a slightly larger radius and a thinner stroke, with circumference calculated from its actual radius. All existing 64/80/112px outer sizes and accessible score labels remain intact. This preserves the result-card and dialog layouts while creating a clear inner gap, including for 100/100.

The desktop sample sits in a recessed blue/green stage with more visible embossed contours and a restrained internal relief layer. Decorative shapes fill the right edge instead of adding another content panel. This additional layer is desktop-only; phones and tablets retain their compact composition. Artwork remains static CSS/SVG with no new runtime dependency, image download, or animation loop.

`npm run test:gauges` renders the real shared component and checks the four representative values at all three sizes across 320/768/1440px. The 36 checks measure the maximum radial extent of each label's bounding box against the curve's inner radius, requiring at least 4px clearance. Screenshots and measurements remain in ignored artifacts/polish. This is a browser lab check, not a guarantee for every installed system font or device.

The polish passes TypeScript, formatting, the Node production build, 89 responsive/workflow scenarios, 67 visual/dialog checks, and 36 gauge checks. Minimum measured radial label clearance is 4.24px. A separate desktop homepage axe check has no unreviewed violations, and 1920px reflow also passes. Chromium and WebKit pass; Firefox remains unavailable in the installed runtime. All four repeated Lighthouse profiles retain 100 performance/SEO/best-practices and zero layout shift (home LCP: 0.75s mobile, 0.20s desktop). These are local lab measurements; the earlier logo exception and physical-device/live-provider limits still apply.

The refinement is published on Worker version `6d9fb97c-1640-4047-82ae-41f088500f4a`. Live checks pass at 320/390/768/1024/1440/1920px, including score clearance, desktop-only art, and sample controls. The hosted application smoke also passes with synthetic fixtures cleaned up; no AI-provider calls were made.

## Artwork across the application

The follow-up extends the same visual language beyond the hero. BrandCanvas now supplies complementary, softly masked edge compositions on every route; visible artwork stays consistent as the user scrolls. The desktop introduction has its own faded rings and waves above and below the copy. Shared ReliefArt has compact rings/waves variants so primary sections do not duplicate the full decorative composition.

Cropped relief details now appear in landing step cards, workflow/FAQ areas, authentication forms, onboarding panels, studio configuration/results headers, settings/history sections, public guides, fallback pages, and dialog headers. Isolated, bounded surfaces keep decorations behind content and out of input fields. Mobile uses smaller artwork, and page-heading/FAQ treatments preserve control focus and card shadows. Forced-colors or increased-contrast preferences hide all decorative art while leaving functional score gauges visible. No image download, continuous animation, new dependency, database change, or scoring change is introduced.

The score-ring refinement retains the existing outer component sizes and accessible values. It uses a 45-unit radius, a 5-unit stroke, and a smaller compact score label. The 36 production gauge measurements confirm a minimum 4.19px radial clearance from label bounds to the inner curve, including 100/100; the check can be run directly with `node scripts/gauge-check.mjs` against the isolated QA server.

TypeScript, formatting, the Node production build, all 89 workflow/responsive scenarios, and all 67 visual/dialog captures pass for this update. Chromium and WebKit pass; the existing Firefox-runtime limitation remains. High-contrast suppression preserves the functional gauge, and the 404 page reflows at 320/1440px. Scrolled viewport inspection confirms the background remains visible in lower sections. Lighthouse again measures 100 performance, SEO, and best practices on all four public-page profiles, with zero layout shift (home LCP 0.76s mobile / 0.20s desktop). Accessibility remains 95–96 with the existing logo-only finding. These are local lab results; earlier physical-device and live-provider verification limits still apply.
