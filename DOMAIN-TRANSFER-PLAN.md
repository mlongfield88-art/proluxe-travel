# proluxetravels.com: Domain Transfer and Website Hosting Cutover Plan

**Document owner:** LX Sixty Group, Website Design Lead
**Created:** 2026-04-20
**Status:** Active plan - domain transfer in flight
**Myles holds the auth code separately** (received from Ade at Chunky Frog, 2026-04-20)

---

## Context: What Just Changed

**Registrar ambiguity resolved with a fresh whois query on 2026-04-20 at 15:09 UTC: the registrar of record is IONOS SE (IANA ID 83, WHOIS server `whois.ionos.com`), and Chunky Frog is an IONOS reseller.** Ade's unlock has cascaded correctly (WHOIS `Updated Date: 2026-04-20T13:10:26Z`, `Domain Status: ok`), so the April 2026 identification in `CUTOVER-IONOS-PATH.md` Section 1 was right all along. The "IONOS does not enter this plan" line that appeared in the original version of this Context section is therefore incorrect and has been removed: IONOS is the losing registrar, Cloudflare is the gaining registrar, and Ade acted as the reseller channel that lifted the transfer lock on IONOS's behalf. This does not change the transfer mechanics in Section C (the EPP code is an IONOS-issued registry code and Cloudflare will accept it against IONOS), but it does change who sends the ICANN approval email in Section C2: IONOS, not Chunky Frog, will dispatch the confirmation to the registrant email on file, which is GDPR-redacted from public WHOIS. Before pasting the auth code into Cloudflare, Myles must confirm which mailbox will receive the approval prompt during the 5 to 7 day window, either by logging into IONOS (the account recovery flagged in `IONOS-RECORDS-TO-APPLY.md` remains relevant) or by asking Ade to tell him the admin email currently on file for the domain. Also worth rechecking: the April record showed `ns1-4.chunkyfrog.co.uk`, but current WHOIS lists only `NS1.CHUNKYFROG.CO.UK` and `NS2.CHUNKYFROG.CO.UK`, so the authoritative nameserver set may have been reduced.

On 2026-04-20, Ade at Chunky Frog confirmed the domain `proluxetravels.com` is unlocked and supplied the transfer-out auth code (EPP code). This changes the situation materially.

**Previous assumption:** Registrar was IONOS. Plans `CUTOVER-IONOS-PATH.md` and `IONOS-RECORDS-TO-APPLY.md` (both dated April 2026) were built around that assumption, which the fresh whois above has now confirmed as correct (IONOS SE, IANA ID 83).

**Current confirmed state:** IONOS SE is the registrar of record. Chunky Frog operates as an IONOS reseller and holds the customer-facing account. The EPP code Ade supplied is a genuine IONOS-issued registry transfer code. The domain is being transferred out of IONOS (via Cloudflare's transfer-in flow) to Cloudflare Registrar, with Ade's reseller-side unlock having already propagated to IONOS earlier today.

**What this plan does not replace:** `CUTOVER-IONOS-PATH.md` Phases A through C (stand up the Cloudflare DNS zone, flip nameservers, verify migration) remain valid for the DNS side. The _website_ hosting cutover in Phase D of that document also remains unchanged. This plan focuses on the registrar transfer, the pre-transfer DNS capture, and the sequencing that keeps email alive throughout.

---

## Section A: Pre-Transfer DNS Capture (Myles, TODAY before anything else)

**Do this before initiating the transfer at Cloudflare.** Once the transfer-in process starts, the clock is running. You need a complete DNS record set captured and ready to enter into Cloudflare DNS before the nameservers change.

### A1. Get the full zone file if Chunky Frog offers it

Log into the Chunky Frog customer panel at `controlpanel.chunkyfrog.co.uk`. If the panel is reachable, look for a DNS management or zone editor section. If there is an option to "export zone file" or "download zone as BIND format", do that first. A zone file is a single text export of every record. Save it as `proluxetravels-zone-export-2026-04-20.txt` somewhere offline (not iCloud, not git).

If the panel is not reachable (it was unreachable on 2026-04-16 per `CUTOVER-IONOS-PATH.md`, but Ade has since been responsive by email), reply to Ade and ask him to email you the full zone file or a screenshot of every DNS record.

### A2. Records to capture individually (if no zone export is available)

If you cannot get a zone file, capture every record individually. Screenshot the DNS panel showing each of the following types. Do not assume you know the values: capture from the live panel as what is there right now may differ from what was recorded in April.

**Email records (critical, do not miss any):**

| Record type | Name / Host | What to look for |
|---|---|---|
| MX | @ (root domain) | The mail exchanger. Should point to `proluxetravels-com.mail.protection.outlook.com`. Note the priority value (0 or 10). |
| TXT | @ | SPF record. Starts with `v=spf1`. Copy the full string including all tokens and the ending `-all`. |
| TXT | @ | Microsoft 365 domain verification. Starts with `MS=`. |
| TXT | _dmarc | DMARC policy. Starts with `v=DMARC1;`. |
| TXT | default._domainkey | DKIM signing key. Starts with `v=DKIM1; k=rsa; p=`. This is a long string; capture it in full. If it is split across two rows or two quoted strings, capture both parts. |
| CNAME | autodiscover | Outlook autodiscover. Should point to `autodiscover.outlook.com`. |
| CNAME | selector1._domainkey | Microsoft DKIM selector. If present. |
| CNAME | selector2._domainkey | Microsoft DKIM selector. If present. |

Note: the previous April 2026 discovery found a `default._domainkey` DKIM key (not selector1/selector2 CNAMEs). Chunky Frog may use the older DKIM key method rather than the Microsoft CNAME rotation method. Capture whatever is there. Do not assume one form or the other.

**Web records:**

| Record type | Name | What to look for |
|---|---|---|
| A | @ (root domain) | The IP address the apex domain resolves to. |
| CNAME or A | www | The www record. May be a CNAME pointing to the apex, or a separate A record. |

**Third-party verification records (capture any TXT or CNAME you do not immediately recognise):**

Look for records that look like:
- `google-site-verification=...` (Google Search Console)
- `hubspot-...` or `hs-...` (HubSpot domain verification)
- Stripe domain verification records (they usually look like random strings)
- Mailchimp CNAME records (usually at subdomains like `k1._domainkey` or `k2._domainkey` for DKIM, or `mcdlv.net` CNAMEs)
- Any other TXT record with a hex or random string value that you do not recognise

Capture all of these. Unknown records are safer to carry over than to lose. You can delete them later if they turn out to be stale.

### A3. Cross-check against known values

The following values were captured during the April 2026 investigation and are the expected baseline. Verify the live panel shows these same values. If anything has changed, use the live panel value:

- MX: `proluxetravels-com.mail.protection.outlook.com` at priority 0
- SPF TXT: `v=spf1 +a +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all`
- DMARC TXT at `_dmarc`: `v=DMARC1; p=none;`
- MS verification TXT at `@`: `MS=ms14229968`
- DKIM TXT at `default._domainkey`: starts `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsF1B0zk/...`
- A record at `@`: `81.19.214.21`
- www: CNAME to `proluxetravels.com` (apex)

---

## Section B: Cloudflare Zone Setup (Before Initiating Transfer)

Set up the DNS zone in Cloudflare before you start the registrar transfer. The zone can hold records and be fully configured before the domain is transferred. Doing it in this order means there is no gap: when the transfer completes and Cloudflare takes over as registrar, the DNS zone is already populated and ready.

### B1. Add the zone to Cloudflare

1. Sign in to the Cloudflare account that already owns the `proluxe-travel` Pages project.
2. Dashboard > Add a site > enter `proluxetravels.com` > choose Free plan.
3. Cloudflare attempts an automatic DNS scan of the current records. It will query the Chunky Frog nameservers. Accept whatever it imports, then verify and fill gaps manually.

### B2. Enter every record from Section A

Enter each record from your Section A capture. Use the table format below as a guide.

**Email records (enter these first and verify before anything else):**

| Type | Name | Content | Proxy | Notes |
|---|---|---|---|---|
| MX | @ | `proluxetravels-com.mail.protection.outlook.com` | DNS only (grey cloud) | Priority 0. Never proxy MX records. |
| TXT | @ | `v=spf1 +a +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all` | n/a | Keep the `+a` token for now. It gets removed in Section E when the A record changes. |
| TXT | @ | `MS=ms14229968` | n/a | Microsoft 365 domain verification. Required. |
| TXT | _dmarc | `v=DMARC1; p=none;` | n/a | |
| TXT | default._domainkey | Full DKIM value from your Section A capture | n/a | Paste as a single value. Cloudflare handles the 255-char string split automatically. |
| CNAME | autodiscover | `autodiscover.outlook.com` | DNS only (grey cloud) | Add if found in Section A. |

If Section A found `selector1._domainkey` or `selector2._domainkey` CNAME records (the Microsoft DKIM rotation method), add those as CNAMEs pointing to their Microsoft targets.

**Web records (current state, not the final cutover state):**

| Type | Name | Content | Proxy | Notes |
|---|---|---|---|---|
| A | @ | `81.19.214.21` | DNS only (grey cloud) | Keeps the existing WordPress site live. Changed in Section E. |
| CNAME | www | `proluxetravels.com` | DNS only (grey cloud) | Keeps www working as it currently does. Changed in Section E. |

**Third-party records:**

Add any Google, HubSpot, Stripe, or Mailchimp TXT and CNAME records you captured in Section A2. Enter them exactly as they appear.

### B3. Verify the zone is fully populated

Before proceeding to Section C, run these checks:

```bash
dig +short MX proluxetravels.com @<cloudflare-ns-1>
dig +short TXT proluxetravels.com @<cloudflare-ns-1>
dig +short TXT default._domainkey.proluxetravels.com @<cloudflare-ns-1>
```

Replace `<cloudflare-ns-1>` with one of the two Cloudflare nameservers assigned to your zone (shown in the Cloudflare zone overview). This queries Cloudflare's DNS directly, bypassing the still-live Chunky Frog nameservers. You should see all email records returning correctly before the transfer begins.

Also send a test email from `info@proluxetravels.com` to a personal Gmail. Open the message headers and confirm `spf=pass`, `dkim=pass`, `dmarc=pass`. This baseline confirms email is healthy before the transfer starts.

---

## Section C: Transfer-In Sequence

Only proceed once Section B is complete and the zone is fully verified in Cloudflare.

### C1. Initiate transfer at Cloudflare

1. Cloudflare dashboard > Domain Registration > Transfer Domains.
2. Enter `proluxetravels.com`.
3. When prompted for the auth code, Myles pastes the auth code Ade sent on 2026-04-20. Do not type it from memory; paste it directly from wherever you stored it.
4. Cloudflare shows the registration cost (at-cost for .com, currently around $9.77/year). Confirm the transfer.
5. Cloudflare sends a confirmation email to the registrant email address on file. Check which address is the registrant: if it is `myles@proluxetravels.com`, that mailbox must be working throughout the transfer (which it will be, as long as Section B email records are in place).

### C2. Approve at the Chunky Frog side

Chunky Frog (as the losing registrar) is required to either approve the transfer or let it auto-approve after 5 days. Because Ade confirmed the domain is unlocked and supplied the EPP code, explicit approval may already be treated as given, but an approval email may still be sent to the registrant address.

Watch `myles@proluxetravels.com` for an email from Chunky Frog or from ICANN / Nominet asking you to confirm or approve the transfer. Click the approval link if one arrives. Some losing registrars auto-approve after the domain is unlocked; others require explicit action. If in doubt, reply to Ade and ask him to approve on the Chunky Frog side.

### C3. Wait for the ICANN transfer window

After initiation, the domain transfer takes 5 to 7 days. This is an ICANN-mandated window. Nothing needs to happen during this period, but you should:

- Check `myles@proluxetravels.com` and `iba2026@proluxetravels.com` every 24 hours to confirm inbound mail is still arriving.
- Watch for any ICANN transfer notification emails. Do not click any link in a transfer email that asks you to reject or cancel the transfer unless you intentionally want to stop it.
- If Cloudflare sends a progress update email to the registrant address, no action is needed unless it says "action required".

### C4. Nameserver note during transfer

When Chunky Frog was the registrar, the nameservers were `ns1-4.chunkyfrog.co.uk`. During the transfer process, Cloudflare becomes the registrar, and can optionally take over as the authoritative nameserver as well. In most transfer flows, Cloudflare asks during or after the transfer whether you want to use Cloudflare nameservers.

Choose yes. The zone you set up in Section B is already waiting. The moment you switch to Cloudflare nameservers, your pre-staged records go live. Because you staged them in Section B with the same values as the current Chunky Frog zone, there is no visible change to web or email during this switch.

If the transfer completes and you are still pointed at Chunky Frog nameservers (possible if Chunky Frog is the default), update the nameservers in the Cloudflare Registrar panel to point at the two Cloudflare nameservers assigned to your zone.

### C5. Verify WHOIS post-transfer

Once the transfer is complete (Cloudflare sends a confirmation email):

```bash
whois proluxetravels.com
```

The output should show:
- Registrar: Cloudflare, Inc.
- Name Servers: the two `ns.cloudflare.com` addresses assigned to your zone
- Expiry date: Cloudflare adds one year to the current expiry on transfer. Current expiry was 13 Sep 2026, so post-transfer it should read 13 Sep 2027.

---

## Section D: Post-Transfer Verification

Run this checklist after the transfer completes. Do not proceed to Section E (website hosting cutover) until every item on this list is green.

### D1. WHOIS and registrar

- [ ] `whois proluxetravels.com` shows Registrar: Cloudflare, Inc.
- [ ] Nameservers in WHOIS are the two Cloudflare NS addresses
- [ ] Expiry date is extended by one year from the pre-transfer date

### D2. DNS resolves correctly

```bash
dig +short NS proluxetravels.com
# Expected: your two Cloudflare nameservers only (no chunkyfrog entries)

dig +short MX proluxetravels.com
# Expected: proluxetravels-com.mail.protection.outlook.com

dig +short TXT proluxetravels.com
# Expected: SPF and MS= records both visible

dig +short TXT default._domainkey.proluxetravels.com
# Expected: v=DKIM1; k=rsa; p=MIIBIjAN...

dig +short A proluxetravels.com
# Expected: 81.19.214.21 (still WordPress, website cutover is Section E)
```

### D3. Inbound email is alive

- [ ] Send a test email to `myles@proluxetravels.com` from a personal/external address. Confirm delivery.
- [ ] Send a test email to `iba2026@proluxetravels.com` from a personal/external address. Confirm delivery.
- [ ] Check the Microsoft 365 admin panel for any mail flow errors.

### D4. Outbound email passes authentication

Send a test email from `myles@proluxetravels.com` and `iba2026@proluxetravels.com` to a Gmail address. Open the message in Gmail, go to the three-dot menu, click "Show original". Confirm:

- `spf=pass`
- `dkim=pass`
- `dmarc=pass`

If any of these fail, stop. Do not proceed to Section E. Diagnose the DNS record before touching web hosting.

### D5. No Cloudflare zone errors

- [ ] Cloudflare dashboard shows the zone status as Active (green tick)
- [ ] No orange or red alerts on the DNS tab
- [ ] No SSL/TLS warnings (the site is still on the Apache VPS at this point, so SSL is handled by Apache, not Cloudflare; the Cloudflare SSL mode should be "Full" or the apex A and www CNAME should still be grey-cloud / DNS only)

---

## Section E: Website Hosting Cutover (Separate, Later Phase)

This section is a distinct change window and should not run back-to-back with the domain transfer. Allow at least 48 hours after the Section D checklist is fully green before starting this.

### E1. Current state of the Astro / static build

The `proluxe-travel` folder is not an Astro site. It is static HTML/CSS/JS. The full state as of 2026-04-20:

| Item | State |
|---|---|
| Framework | Static HTML/CSS/JS (no Astro, no package.json) |
| Repository | `github.com/mlongfield88-art/proluxe-travel` |
| Cloudflare Pages project | `proluxe-travel` (already exists) |
| Preview URL | `https://proluxe-travel.pages.dev` (live) |
| GitHub Action | `.github/workflows/deploy.yml` deploys `dist/` on push to main via `wrangler-action@v3` |
| `wrangler.toml` | Present: `name = "proluxe-travel"`, `pages_build_output_dir = "dist"` |
| Custom domain attached | Not yet (pending this transfer completing) |
| dist/ contents | `index.html`, `privacy-policy.html`, `terms-and-conditions.html`, `_redirects`, `css/`, `js/`, `lib/`, `img/` (16 files), `video/` (5 mp4s) |
| Blockers from GO-LIVE-PLAN.md | Both resolved: `_redirects` is shipped, `terms-and-conditions.html` is built |

**What is missing before cutover can proceed:**

1. The custom domain `www.proluxetravels.com` has not been attached to the Cloudflare Pages project yet. This requires clicking through Workers and Pages > proluxe-travel > Custom Domains in the Cloudflare dashboard.
2. The apex `proluxetravels.com` redirect decision (apex to www, or www to apex) has not been confirmed. The recommendation from `GO-LIVE-PLAN.md` is `www` as canonical. The current `_redirects` file presumably implements this already, but verify before cutover.
3. The open question from `GO-LIVE-PLAN.md` Section 10 item 1 (canonical domain) needs Myles to confirm.

### E2. Cutover sequence (when ready)

This is the Phase D sequence from `CUTOVER-IONOS-PATH.md`, reproduced here for completeness with the current Cloudflare DNS context:

1. In Cloudflare DNS, lower TTL on the apex A record and www CNAME to 300 seconds.
2. Wait 17 minutes (one old-TTL cycle) so the new short TTL propagates.
3. Update the SPF TXT record: remove the `+a` token. New value: `v=spf1 +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all`. Send a test email immediately and confirm SPF still passes before continuing.
4. In Cloudflare: Workers and Pages > proluxe-travel > Custom Domains > Add `www.proluxetravels.com`. Because Cloudflare now controls the DNS zone, it creates the CNAME automatically. SSL provisioning begins immediately.
5. Wait for SSL to show as Active (1 to 5 minutes).
6. Change the apex A record from `@ A 81.19.214.21` to `@ CNAME proluxe-travel.pages.dev`. Cloudflare supports apex CNAME flattening, so this works. Alternatively, use the Cloudflare Pages custom domain UI to attach the apex too, which handles the CNAME automatically.
7. Monitor: `curl -sI https://www.proluxetravels.com/` should return `server: cloudflare` and HTTP 200 within 5 minutes.

### E3. Post-cutover smoke test

- [ ] `curl -sI https://www.proluxetravels.com/` returns HTTP 200, `server: cloudflare`
- [ ] `curl -sI https://www.proluxetravels.com/about/` returns 301 to `/#about`
- [ ] `curl -sI https://www.proluxetravels.com/contact/` returns 301 to `/#contact`
- [ ] `curl -sI https://www.proluxetravels.com/terms-and-conditions/` returns 200
- [ ] `curl -sI https://proluxetravels.com/` returns 301 to `https://www.proluxetravels.com/`
- [ ] Homepage renders: olive-branch canvas animation, 5 service cards, CTA buttons
- [ ] Service card hover plays video (all 5 mp4s)
- [ ] Contact form submits successfully (Formspree xdaykkbj receives it, delivery to info@proluxetravels.com confirmed)
- [ ] `myles@proluxetravels.com` and `iba2026@proluxetravels.com` inbound mail still working
- [ ] Test email from those addresses passes SPF, DKIM, DMARC (Gmail headers check)
- [ ] SSL padlock in browser, no mixed-content warnings
- [ ] Mobile viewport (375px): hamburger nav, all anchor sections
- [ ] Cookie banner shows on first visit, accept/decline works
- [ ] Raise TTLs back to 3600 after 24 hours of clean traffic

### E4. What this section does not cover

The following items are out of scope for the cutover but should be tracked:

- WordPress site at `81.19.214.21` is on a third-party VPS not under LX Sixty control. Once Phase D completes, nothing references it. It can be left to wind down naturally, but request a backup from the current host before cutover as insurance.
- SEO tune-up and content updates are a separate task.
- Hero video file: the current hero uses a CSS background and canvas animation, no mp4. Not blocking.
- Google Search Console: submit the new sitemap at `https://www.proluxetravels.com/sitemap.xml` post-cutover (if a sitemap exists; if not, the previous Rank Math sitemap is now dead).

---

## Section F: Risk Log

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Email downtime if a DNS record is missed during Section A capture | Medium (many record types) | Severe (live IBA 2026 bookings, ~2.5M GBP) | Section A2 is explicit about every record type. Cross-check against known April 2026 values in Section A3. Verify via Section D3/D4 before any web changes. |
| Transfer rejected because auth code is mistyped or has expired | Low (Ade supplied it today) | Moderate (restarts transfer process, 5-7 day delay) | Paste the auth code rather than typing it. The code is single-use and was issued today. If Cloudflare rejects it, contact Ade immediately to request a fresh one; do not delay. |
| Transfer rejected because 60-day lock is in force | Low (Ade confirmed unlocked) | Moderate (5-7 day delay) | Chunky Frog confirmed the lock is removed. If Cloudflare still rejects for lock reasons, contact Ade to confirm on his end. |
| DNS propagation lag causes split-traffic window where some resolvers see old Chunky Frog records | Medium | Low | Section B pre-stages identical records. During propagation, both old and new nameservers serve the same values. No visible impact on web or email. |
| Cloudflare nameserver switch takes effect before zone is fully populated | Low if Section B is completed first | Severe | Section B must be done and verified before initiating the transfer in Section C. Do not skip the Section B verification step. |
| Microsoft DKIM key value is corrupted when pasted into Cloudflare | Low | High (outbound mail marked spam or rejected) | Paste as a single value. Cloudflare handles string splitting automatically. After Section B, verify with `dig` directly against Cloudflare's nameserver before anything changes. |
| autodiscover CNAME missing, Outlook clients lose autodiscover after transfer | Medium (often overlooked) | Moderate (calendar and email client disruption for new setups) | Explicitly captured in Section A2. Add to Cloudflare DNS in Section B. |
| Third-party verification records (Google Search Console, HubSpot, Stripe) lost, causing account verification failures | Medium | Moderate | Section A2 instructs capturing all unrecognised TXT and CNAME records. Carry them all over. |
| Transfer approval email lands in `myles@proluxetravels.com` and is missed | Low | High (transfer auto-rejects after 5-day inaction) | Monitor the inbox daily during the 5-7 day ICANN window. Also check `iba2026@` as the registrant address may differ. |
| Chunky Frog does not process the transfer-out, blocks or delays it | Low (Ade confirmed cooperation) | Moderate (5-7 day delay) | Contact Ade by email if the transfer does not initiate within 24 hours of submitting the auth code to Cloudflare. Reference Ade's 2026-04-20 confirmation. |
| IBA 2026 inbound mail disrupted during transfer window | Low if Section B is correct | Severe | The transfer itself does not change nameservers or DNS records if Section B is done first. Email is only at risk if a record is wrong or missing. Section D checklist covers this. |
| Domain expiry before transfer completes (13 Sep 2026 expiry, but Cloudflare extends by 1 year on transfer) | Very Low | Severe | Initiate transfer well within the transfer window before expiry. Cloudflare adds one year on transfer, extending to Sep 2027. After transfer, confirm auto-renew is on in Cloudflare Registrar. |
| Formspree form broken by domain change (referrer allowlist) | Low | Low | Formspree free tier allows all referrers by default. Check Formspree project settings for any domain allowlist before cutover. Pre-test from the `proluxe-travel.pages.dev` staging URL. |

---

## Quick-Reference: Three Things Myles Must Do TODAY

1. **Section A: Capture the full DNS record set from the Chunky Frog panel.** Get the zone file if available. If not, screenshot every record type listed in Section A2. Do not start the transfer without this.

2. **Section B: Add `proluxetravels.com` as a zone in Cloudflare and enter all captured records.** Verify by querying Cloudflare's nameservers directly (Section B3) and send a test email to confirm mail is healthy (Section B3 baseline test).

3. **Initiate the transfer in Cloudflare (Section C1) only after both of the above are done and verified.** Paste the auth code Ade sent on 2026-04-20 when prompted.

The website hosting cutover (Section E) is a separate change window. Do not combine it with the registrar transfer.

---

## Relationship to Existing Plan Documents

| Document | Status |
|---|---|
| `GO-LIVE-PLAN.md` | Sections 3, 5, 9, and 11 remain valid. The website cutover sequence in Section 6 is superseded by Section E of this document (same substance, updated DNS context). |
| `CUTOVER-IONOS-PATH.md` | Phase A (Cloudflare zone setup) and Phase D (website cutover) remain valid. Phase B (IONOS nameserver flip) is now replaced by the Cloudflare registrar transfer in Section C of this document. Do not flip nameservers at IONOS: IONOS is not the registrar. |
| `IONOS-RECORDS-TO-APPLY.md` | The DNS record values in this document remain the best available reference for what should be in the Cloudflare zone. Use them as a secondary check against Section A3 of this document. The IONOS account context in that document's preamble is superseded. |

---

**End of plan.**
