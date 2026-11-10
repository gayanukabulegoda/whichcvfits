# Namecheap custom subdomain

Primary hostname: **https://whichcvfits.grbulegoda.com**.

The domain's authoritative nameservers remain at Namecheap (`dns1.registrar-servers.com` and `dns2.registrar-servers.com`). The main WhichCVFits application remains the existing Cloudflare Worker with the existing D1 database and secret bindings.

## Connection

```text
whichcvfits.grbulegoda.com
  → Namecheap CNAME: whichcvfits-domain.pages.dev
  → Cloudflare Pages gateway: APP service binding
  → existing whichcvfits Worker and D1
```

Cloudflare Workers custom domains require an active Cloudflare zone. Cloudflare Pages supports external-DNS subdomains, so a small Pages gateway lets this domain keep Namecheap nameservers. This is a proxy through an internal service binding, not a browser redirect.

The gateway forwards the public host, original Origin, cookies and streamed body to the app. The app's origin validation and ownership checks remain active. Responses pass through without adding a cache for private data. The temporary `whichcvfits-domain.pages.dev` address emits `X-Robots-Tag: noindex, follow`; only the configured production Pages address and requested custom hostname are accepted. Unconfigured version-preview hosts are rejected.

## Namecheap record

In **Domain List → Manage grbulegoda.com → Advanced DNS → Host Records**, add:

| Type  | Host          | Value                          | TTL       |
| ----- | ------------- | ------------------------------ | --------- |
| CNAME | `whichcvfits` | `whichcvfits-domain.pages.dev` | Automatic |

The value contains no scheme or path. If another record already occupies the same `whichcvfits` host, resolve that conflict before adding the CNAME. Preserve all other domain records, including the website and email records.

The hostname has been registered in the Pages project's Custom domains settings. Cloudflare must verify the CNAME and finish certificate issuance before the HTTPS hostname is ready. If validation requires additional records, use the exact records returned by Cloudflare.

## Deployment and verification

The gateway lives in `gateway/public/_worker.js`, with its service binding configured in `gateway/wrangler.jsonc`.

```sh
npm run deploy:gateway
```

This targets the owner account configured in the main `wrangler.jsonc`. The Pages project must be created in that account first. For initial setup, use the Cloudflare dashboard or Pages API to create `whichcvfits-domain` with production branch `main`. The tested Wrangler version can automatically delegate new project creation to Workers when run by an agent; the documented Pages API was used to create this Pages project explicitly.

Run the full hosted check against the primary hostname:

```sh
DEPLOYMENT_SMOKE_URL=https://whichcvfits.grbulegoda.com node scripts/deployment-smoke.mjs
```

The hosted checks use synthetic accounts/documents and remove only their uniquely named fixtures. Never point the local mocked-provider browser suite at production. The cleanup path retries its idempotent fixture deletion once, and reports success only after cleanup completes.

For future application deployments, rebuild/redeploy with `NEXT_PUBLIC_SITE_URL=https://whichcvfits.grbulegoda.com`, update its public configuration/docs, and run the hosted smoke against the custom hostname. Verify canonical URLs, sitemap, public pages, session cookies, private pages, document assets and owner isolation. Keep the same database and secrets; do not create a replacement database or rotate secrets for a hostname change.

Pages Functions and service calls use Cloudflare runtime quotas. This setup creates no paid subscription; it does not promise unlimited free capacity.

## Status

The custom hostname is **active**, with both ownership verification and HTTPS validation active in Cloudflare. Both Namecheap nameservers and Google Public DNS return the expected CNAME. The Worker was rebuilt and published with the custom hostname as its canonical origin (version `ac9f5b72-1ebb-4562-accc-79cbba7b8882`). The database and production secrets were retained.

The full hosted application smoke passed on the custom hostname: authentication, secure cookies, private/no-store responses, origin rejection, PDF/DOCX, modal focus, mobile reflow, historical model metadata, cross-owner read/delete isolation and atomic deletion. Synthetic fixture cleanup completed. All 12 public pages/SEO endpoints/icons/document assets passed; canonical, Open Graph, structured data, robots and sitemap use the new public origin. Local regression verification passes 21 suites plus TypeScript and formatting.

The local recursive resolver still cached the earlier NXDOMAIN answer during these checks. Authoritative DNS and Google Public DNS were correct, and HTTPS was verified against Cloudflare’s known edge address. Hosted checks used a process-only DNS mapping while keeping normal hostname/TLS certificate validation enabled. No system DNS configuration was changed. A remaining cache elsewhere can take time to refresh; the Namecheap record should be left as configured.

The original Worker address remains available and serves the new canonical URL. The Pages address stays noindex. Real AI-provider calls still require a valid user key and were not made during these checks.

## References

- [Workers custom-domain requirements](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Pages custom subdomains with external DNS](https://developers.cloudflare.com/pages/configuration/custom-domains/#add-a-custom-subdomain)
- [Pages service bindings](https://developers.cloudflare.com/pages/functions/bindings/#service-bindings)
- [Pages Functions pricing and quotas](https://developers.cloudflare.com/pages/functions/pricing/)
