# Namecheap custom subdomain

Requested hostname: **https://whichcvfits.grbulegoda.com**.

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

Before DNS cutover, gateway checks can keep the existing Worker canonical origin:

```sh
DEPLOYMENT_SMOKE_URL=https://whichcvfits-domain.pages.dev DEPLOYMENT_EXPECTED_CANONICAL=https://whichcvfits.gayanukabulegoda.workers.dev node scripts/deployment-smoke.mjs
```

The hosted checks use synthetic accounts/documents and remove only their uniquely named fixtures. Never point the local mocked-provider browser suite at production. The cleanup path retries its idempotent fixture deletion once, and reports success only after cleanup completes.

After DNS and HTTPS are active, rebuild/redeploy the app with `NEXT_PUBLIC_SITE_URL=https://whichcvfits.grbulegoda.com`, update its public configuration/docs, and run the hosted smoke against the custom hostname. Verify canonical URLs, sitemap, public pages, session cookies, private pages, document assets and owner isolation. Keep the same database and secrets; do not create a replacement database or rotate secrets for a hostname change.

Pages Functions and service calls use Cloudflare runtime quotas. This setup creates no paid subscription; it does not promise unlimited free capacity.

## Status

The Pages gateway is deployed and its full functional checks passed through the existing Worker, including authentication, private/no-store responses, PDF/DOCX, mobile reflow, historical model metadata and cross-owner read/delete isolation. A transient remote cleanup request failed; its uniquely scoped recovery SQL was retried successfully and removed both synthetic fixture accounts.

The custom hostname is registered with Cloudflare. Namecheap CNAME propagation and certificate activation are pending. The live app's canonical origin remains the existing Worker address until the custom hostname is verified.

## References

- [Workers custom-domain requirements](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Pages custom subdomains with external DNS](https://developers.cloudflare.com/pages/configuration/custom-domains/#add-a-custom-subdomain)
- [Pages service bindings](https://developers.cloudflare.com/pages/functions/bindings/#service-bindings)
- [Pages Functions pricing and quotas](https://developers.cloudflare.com/pages/functions/pricing/)
