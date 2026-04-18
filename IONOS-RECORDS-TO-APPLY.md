# IONOS DNS Records to Apply

**Purpose:** Paste-sheet for when Myles regains IONOS account access.
**Prepared:** 18 April 2026
**Canonical domain confirmed:** www.proluxetravels.com

---

## Before you touch anything in IONOS

Complete these two steps in the Cloudflare dashboard first, or confirm they are already done:

1. **Zone exists:** The `proluxetravels.com` zone must be added to the Cloudflare account (the same account that owns the `proluxe-travel` Pages project). If not yet added: Cloudflare dashboard > Add a site > `proluxetravels.com` > Free plan. Cloudflare will display two assigned nameservers once the zone is created.

2. **Custom domain attached to Pages:** Cloudflare dashboard > Workers and Pages > `proluxe-travel` > Custom Domains > Add `www.proluxetravels.com`. SSL will show as pending until DNS propagates, which is expected.

Both steps are safe to do before touching IONOS. They are dormant until the nameservers flip.

---

## Step 1: Flip nameservers at IONOS

In IONOS: Domains and SSL > proluxetravels.com > Nameservers > Use external nameservers.

Replace the current Chunky Frog nameservers with the two Cloudflare nameservers assigned to your zone. They will look like:

```
xxx.ns.cloudflare.com
yyy.ns.cloudflare.com
```

(The exact values are shown in your Cloudflare zone overview. Copy them from there.)

This is the only change you make in IONOS. Everything else below is configured inside Cloudflare DNS, not IONOS.

---

## Step 2: Records to configure inside Cloudflare DNS

Once nameservers are flipped and the zone activates (typically 15 to 60 minutes), confirm or manually add these records in the Cloudflare DNS dashboard for proluxetravels.com.

### WEB RECORDS (update after cutover to Pages)

| Type | Name | Content | Proxy | TTL | Notes |
|------|------|---------|-------|-----|-------|
| A | @ | 81.19.214.21 | DNS only (grey) | Auto | Keeps existing WordPress live during DNS migration. Replace in Phase D. |
| CNAME | www | proluxe-travel.pages.dev | Proxied (orange) | Auto | Points www to Cloudflare Pages. Set when attaching custom domain to Pages. |

When you are ready to cut over the website (Phase D of CUTOVER-IONOS-PATH.md):

- Change the apex A record: delete `@ A 81.19.214.21` and add `@ CNAME proluxe-travel.pages.dev` (Cloudflare supports apex CNAME via flattening)
- Or keep the apex A record temporarily and rely on the `_redirects` apex-to-www rule in the Pages project

---

### EMAIL RECORDS

**DO NOT CHANGE. Preserve exactly as shown. These records carry live IBA 2026 mail (approximately 2.5M GBP of bookings).**

| Type | Name | Content | Priority | Proxy | Notes |
|------|------|---------|----------|-------|-------|
| MX | @ | proluxetravels-com.mail.protection.outlook.com | 0 | DNS only (grey) | Microsoft 365 inbound. MUST be DNS only, never proxied. DO NOT TOUCH. |
| TXT | @ | `v=spf1 +a +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all` | n/a | n/a | SPF. Keep the `+a` token until the apex A record is changed to Pages in Phase D. |
| TXT | @ | `MS=ms14229968` | n/a | n/a | Microsoft 365 domain verification. Do not remove. |
| TXT | _dmarc | `v=DMARC1; p=none;` | n/a | n/a | DMARC monitoring record. |
| TXT | default._domainkey | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsF1B0zk/RDTaBAUGUvPj2c2M7KTnJe08vQUiaUpg9oAfQu2zL7wdMj+icKDkwAJAVY8p+QzkbRKxf/RJEtxXd2B2dxtEBON0fGfL+A3O955LIRyiMTa42oive4KOdkh/wHcDQjKVa31jtZqSgjnHaqFCOJe2hunFY7V6bA+tzEGZ5W3nNYdP9XV45xWmS39Z/tDdKMyIhqB25rIE7SmwnuUf0AIcBzKTaX96sL+ncM3sh56jentUxD+Ydrg/OTIStOhqgH9koCETuewqOGvVV3jOCnKzBKFMDFhAuGeh64MZIafNqUqblILRtvZJKjSl8pDPrIyeSak1lBmYC6EGHQIDAQAB;` | n/a | n/a | DKIM signing key. Paste as a single TXT value. Cloudflare handles the 255-char string split automatically. DO NOT MODIFY. |

> All email records must be DNS only (grey cloud). Cloudflare's orange-cloud proxy does not pass SMTP. Accidental proxying of MX or SPF records breaks mail immediately.

---

### SPF UPDATE (Phase D only, not now)

Once the apex A record has been changed from `81.19.214.21` to Cloudflare Pages, replace the SPF record with the version that removes the `+a` token:

```
v=spf1 +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all
```

Send a test email immediately after changing SPF and confirm headers show `spf=pass` before moving on.

---

## Verification sequence after nameserver flip

Run these checks until all pass.

```bash
dig +short NS proluxetravels.com
# Expected: your two Cloudflare nameservers, no chunkyfrog entries

dig +short MX proluxetravels.com
# Expected: proluxetravels-com.mail.protection.outlook.com

dig +short TXT proluxetravels.com
# Expected: SPF and MS= records visible

dig +short TXT default._domainkey.proluxetravels.com
# Expected: full DKIM v=DKIM1; k=rsa; p=MIIBIjAN...

dig +short A proluxetravels.com
# Expected: 81.19.214.21 (until Phase D)
```

Also check in Cloudflare: the zone status should flip from Pending to Active with a green tick. Until it does, the nameservers have not fully propagated.

---

## What is already staged and ready (no IONOS access needed)

- Cloudflare Pages project `proluxe-travel` is live at `https://proluxe-travel.pages.dev`
- `dist/_redirects` is shipped: apex-to-www 301, plus all slug redirects for /about/, /contact/, /services/, /approach/, /terms/, /privacy-policy/, /privacy/, /cookie-policy/
- `dist/terms-and-conditions.html` is built and matches the live terms content (sourced 18 April 2026)
- `dist/privacy-policy.html` exists
- `wrangler.toml` is configured with `pages_build_output_dir = "dist"`

---

## What remains blocked

- Zone creation at Cloudflare: requires dashboard access (no API token stored locally)
- Custom domain attachment on Pages: same requirement
- Nameserver flip at IONOS: requires IONOS account access (recovery in progress)

None of these require code changes. All three are dashboard clicks once access is restored.

---

**End of paste-sheet.**
