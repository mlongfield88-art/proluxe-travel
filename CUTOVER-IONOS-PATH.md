# ProLuxe Travel Cutover, IONOS-Led Path

**Drafted:** 16 April 2026
**Supersedes:** the chunkyfrog-led DNS steps in `GO-LIVE-PLAN.md` Sections 6.1 to 6.4
**Trigger:** Chunky Frog reported as no longer in operation. Customer control panel at `controlpanel.chunkyfrog.co.uk` is unreachable. Their authoritative DNS servers (ns1-4.chunkyfrog.co.uk) are still answering and the WordPress VPS at 81.19.214.21 is still serving the site, but we cannot rely on that lasting.

---

## 1. Reality check (verified 16 Apr 2026, 11:40 BST)

| Item | Status |
|---|---|
| Domain registrar | **IONOS SE** (whois.ionos.com). Registry expiry 13 Sep 2026, auto-renew status to confirm in IONOS panel |
| Domain transfer lock | `clientTransferProhibited` (normal registrar lock, not a problem) |
| Authoritative nameservers | ns1-4.chunkyfrog.co.uk, still resolving |
| Web A record | 81.19.214.21 (Apache VPS, third-party, still up) |
| MX | 0 proluxetravels-com.mail.protection.outlook.com (Microsoft 365, working) |
| SPF | `v=spf1 +a +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all` |
| DMARC | `v=DMARC1; p=none;` |
| DKIM | Captured in full at bottom of this doc, do not lose |
| MS verification TXT | `MS=ms14229968` |
| Chunky Frog corporate site | Up (chunkyfrog.co.uk responds 200) |
| Chunky Frog customer panel | Unreachable |
| New site preview URL | https://proluxe-travel.pages.dev (live, ready) |
| New site repo | github.com/mlongfield88-art/proluxe-travel, deploys via GitHub Actions |

The good news: the registrar (IONOS) is the only entity that controls where the domain points. As long as Myles can sign into the IONOS account, we can move DNS to Cloudflare without touching Chunky Frog at all.

The risk: if Chunky Frog's nameservers go dark before we move DNS, the entire domain (web AND email) goes dark with them.

This plan moves DNS first, then handles the website cutover separately.

---

## 2. What we need from Myles before starting

1. **IONOS login confirmed.** Sign in at https://login.ionos.com and confirm you can see proluxetravels.com under Domains. If the password is lost, IONOS recovery via the registrant email on file (which is presumably an info@proluxetravels.com or a personal address Myles owns).
2. **Decision on canonical domain.** `www.proluxetravels.com` (matches email signatures and IBA docs, recommended) or apex `proluxetravels.com` (matches current site code). Default to www unless told otherwise.
3. **Authority to switch nameservers.** This is a 2-second click in IONOS, but it kicks off the migration. No going back without re-touching IONOS.

That is the entire dependency list. Everything else I can do.

---

## 3. Phase A: Stand up the Cloudflare DNS zone (no risk, no downtime)

Done before touching IONOS. The zone sits dormant in Cloudflare until nameservers flip.

1. Sign in to Cloudflare (the same account that owns the `proluxe-travel` Pages project)
2. Top-right "Add a site" -> enter `proluxetravels.com` -> choose **Free** plan
3. Cloudflare auto-scans the existing DNS via chunkyfrog NS. Verify it imports these records. **Manually add any missing.**

| Type | Name | Content | Proxy | TTL |
|---|---|---|---|---|
| A | @ | 81.19.214.21 | DNS only (grey cloud) | Auto |
| CNAME | www | proluxetravels.com | DNS only (grey cloud) | Auto |
| MX | @ | proluxetravels-com.mail.protection.outlook.com (priority 0) | DNS only | Auto |
| TXT | @ | `v=spf1 +a +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all` | n/a | Auto |
| TXT | @ | `MS=ms14229968` | n/a | Auto |
| TXT | _dmarc | `v=DMARC1; p=none;` | n/a | Auto |
| TXT | default._domainkey | (full DKIM, see Section 8 of this doc, paste exactly) | n/a | Auto |

Notes:
- Keep the A record at 81.19.214.21 for now. WP stays live during the DNS migration so nothing visible changes. We'll flip it to Pages in Phase D.
- All MX/SPF/DKIM/DMARC must be DNS-only (grey cloud). Cloudflare's orange-cloud proxy does not handle email. If accidentally proxied, mail breaks instantly.
- The `+a` token in SPF stays IN this phase. We only remove it in Phase D step 2 once we know the A record is about to change.

4. Cloudflare displays your two assigned nameservers. They look like `xxx.ns.cloudflare.com` and `yyy.ns.cloudflare.com` (random per zone). **Copy these exactly.**
5. Do NOT click "Check nameservers" yet.

Time: 15 minutes if records auto-import cleanly, 30 minutes if any need manual entry.

---

## 4. Phase B: Flip nameservers at IONOS (the actual migration trigger)

This is the only step that requires IONOS account access.

1. Sign in to IONOS, go to Domains & SSL -> proluxetravels.com -> "Adjust DNS Settings" or "Manage Name Servers"
2. Choose "Use my own nameservers" (or "Use other nameservers", wording varies)
3. Replace the four chunkyfrog entries with the two Cloudflare nameservers from Phase A step 4
4. Save. IONOS may show a confirmation dialog warning that DNS is about to change, that is expected, confirm.

Time at IONOS: 2 minutes.
Propagation: 5 minutes to 24 hours (usually 15-60 minutes for a fresh zone). During this window some resolvers see chunkyfrog and some see Cloudflare. Both are serving identical records so there is **no visible impact on website or email**, that is the whole point of pre-staging Phase A.

---

## 5. Phase C: Verify the migration (5 min to 24 hours after Phase B)

Run these checks until they all pass.

1. `dig +short NS proluxetravels.com` should return the two Cloudflare nameservers (no chunkyfrog)
2. `dig +short MX proluxetravels.com` should still return `proluxetravels-com.mail.protection.outlook.com`
3. `dig +short TXT default._domainkey.proluxetravels.com` should return the full DKIM
4. `dig +short A proluxetravels.com` should still return `81.19.214.21`
5. Site loads at https://www.proluxetravels.com (still WordPress, no change)
6. Send a test email from info@proluxetravels.com to a personal Gmail. Open the message, "Show original" or "View headers", confirm `spf=pass`, `dkim=pass`, `dmarc=pass`
7. In Cloudflare, the zone status should flip from "Pending" to "Active" with a green tick

Once all 7 pass, the domain is fully under our control. Chunky Frog can disappear tomorrow and nothing breaks.

**Hold here.** The website cutover is a separate change window. Do not run Phase D back-to-back unless the staging checklist (Section 5.1 of GO-LIVE-PLAN.md) is fully green and the two pre-cutover blockers (Section 3 of GO-LIVE-PLAN.md, the _redirects file and the new terms-and-conditions.html page) are shipped.

---

## 6. Phase D: Website cutover (only when Phase C is green AND blockers are fixed)

Now identical to Sections 6.2 to 6.7 of GO-LIVE-PLAN.md, but every "chunkyfrog DNS panel" reads as "Cloudflare DNS dashboard". Quick recap:

1. In Cloudflare DNS, lower TTL on apex A and www CNAME to 300 (was Auto)
2. Update SPF: remove the `+a` token. New record: `v=spf1 +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all`. Send test email, confirm SPF pass
3. In Cloudflare Pages -> proluxe-travel -> Custom Domains, add `www.proluxetravels.com`. Cloudflare auto-creates the CNAME because we now own the DNS zone. Add `proluxetravels.com` apex too if you want apex-canonical (or leave apex pointing at WP and let it 301 to www, see Section 6.5 below)
4. Cloudflare provisions SSL automatically (1-5 minutes via Let's Encrypt)
5. Once SSL is green, change the apex A record from `81.19.214.21` to a CNAME to `proluxe-travel.pages.dev` (Cloudflare allows apex CNAME via CNAME flattening, this is one of the reasons Cloudflare DNS is the right home for this zone)
6. Smoke test: `curl -sI https://www.proluxetravels.com/` should now return `server: cloudflare` not `Apache`
7. Verify 301s for /about/, /contact/, /terms/, etc (assuming `_redirects` was shipped)
8. Verify form submission to Formspree
9. Raise TTLs back to 3600 after 24 hours of clean traffic

Total active cutover window: under 10 minutes once SSL provisions.

---

## 7. Why this plan is safer than the original

| Concern | Original GO-LIVE-PLAN.md | This plan |
|---|---|---|
| Chunky Frog disappears mid-cutover | Email and website both go dark | Already migrated off, no impact |
| DKIM key typo | Same risk if zone moves later | Pre-staged DKIM in Cloudflare and tested in Phase C before any visible change |
| Apex CNAME support | Worried about chunkyfrog support, fell back to risky pinned IP | Cloudflare supports apex CNAME via flattening, problem solved |
| Rollback if site cutover fails | Revert two records at chunkyfrog | Revert two records at Cloudflare (faster, same dashboard as Pages) |
| Visibility | Two dashboards (chunkyfrog + Cloudflare Pages) | One dashboard (Cloudflare for everything) |

---

## 8. Critical record values (do not lose, paste into Cloudflare exactly)

**SPF (current, with `+a`, use this for Phase A):**
```
v=spf1 +a +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all
```

**SPF (post-cutover, without `+a`, use this in Phase D step 2):**
```
v=spf1 +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all
```

**DMARC (no change needed):**
```
v=DMARC1; p=none;
```

**Microsoft 365 verification (no change needed):**
```
MS=ms14229968
```

**DKIM (full, paste as a single TXT record at name `default._domainkey`):**
```
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsF1B0zk/RDTaBAUGUvPj2c2M7KTnJe08vQUiaUpg9oAfQu2zL7wdMj+icKDkwAJAVY8p+QzkbRKxf/RJEtxXd2B2dxtEBON0fGfL+A3O955LIRyiMTa42oive4KOdkh/wHcDQjKVa31jtZqSgjnHaqFCOJe2hunFY7V6bA+tzEGZ5W3nNYdP9XV45xWmS39Z/tDdKMyIhqB25rIE7SmwnuUf0AIcBzKTaX96sL+ncM3sh56jentUxD+Ydrg/OTIStOhqgH9koCETuewqOGvVV3jOCnKzBKFMDFhAuGeh64MZIafNqUqblILRtvZJKjSl8pDPrIyeSak1lBmYC6EGHQIDAQAB;
```

Cloudflare's TXT input field handles long values. Paste as one line, it will store and serve correctly. The original record was split across two quoted strings (DNS protocol limit of 255 chars per string), Cloudflare reassembles automatically.

**Apex A (current, keeps WP alive during DNS migration):**
```
@ A 81.19.214.21
```

**www CNAME (current, keeps WP alive during DNS migration):**
```
www CNAME proluxetravels.com
```

---

## 9. Post-Phase-C maintenance items (deferred but tracked)

- WordPress site at 81.19.214.21 is not under our control and will eventually go away when its hosting bill stops being paid. Once we are on Cloudflare Pages (Phase D done), nothing references that VPS, so it can disappear safely
- IONOS auto-renew: confirm it is on, expiry 13 Sep 2026, lapse here would lose the domain
- Consider transferring the registrar from IONOS to Cloudflare Registrar later. Cloudflare is at-cost ($9.77/year for .com vs IONOS roughly £15-20). Not urgent, fold into a Q3 2026 housekeeping task

---

**End of plan.**
