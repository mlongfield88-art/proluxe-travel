# ProLuxe Travel Website, Go-Live Plan

**Document owner:** Website Design Lead (LX Sixty Group)
**Drafted:** 15 April 2026
**Status:** Draft for Myles review
**Target domain:** www.proluxetravels.com (with the "s")

---

## 1. Executive summary

Replace the current live ProLuxe Travel WordPress site (Hello Elementor on an Apache VPS at 81.19.214.21, authoritative DNS at chunkyfrog.co.uk) with the new static-HTML build that already deploys to Cloudflare Pages project `proluxe-travel` via GitHub Actions. The existing domain, email infrastructure, and outbound links from IBA 2026 operational documents must survive the cutover untouched.

The migration is essentially one authoritative DNS change at chunkyfrog plus one custom-domain attachment inside Cloudflare Pages. Total active cutover window is under 17 minutes worst case, 5 minutes with TTL prep. Rollback is a single record revert to `81.19.214.21`.

Two pre-cutover blockers exist and are documented in Section 3.

---

## 2. Current state

### 2.1 Old site (currently live)

| Attribute | Value |
|---|---|
| URL | https://www.proluxetravels.com/ |
| Host | Apache VPS at 81.19.214.21 (third-party managed, not on Cloudflare) |
| Stack | WordPress, Hello Elementor theme, Elementor builder, Rank Math SEO |
| Org name in schema | "Pro Luxe Travels AG" (note the "s") |
| Last content update | 15 September 2025 (home, about), 15 February 2026 (contact), 8 March 2026 (terms) |
| Authoritative DNS | ns1-4.chunkyfrog.co.uk |
| Apex redirect | 301 proluxetravels.com -> www.proluxetravels.com (handled by WordPress, will be rebuilt in Cloudflare) |
| SSL | Apache, working |
| Pages in Rank Math sitemap | 4: /, /about/, /contact/, /terms-and-conditions/ |
| Dangling WP URLs | /terms/ returns 200 (probably slug alias or 404 fallthrough), /services/ 404, /privacy-policy/ 404, /privacy/ 404, /cookie-policy/ 404 |

### 2.2 New build (staging, not yet live)

| Attribute | Value |
|---|---|
| Repo | https://github.com/mlongfield88-art/proluxe-travel |
| Stack | Static HTML/CSS/JS (no framework, no package.json), GSAP + Lenis self-hosted |
| Deploy | GitHub Actions on push to main, cloudflare/wrangler-action@v3, `pages deploy dist --project-name=proluxe-travel` |
| Pages project | proluxe-travel |
| Preview URL | https://proluxe-travel.pages.dev |
| Working tree | Clean, main up to date with origin/main |
| Latest commit | 06ddcf3 Replace footer logo image with ProLuxe Travel wordmark (14 April 2026) |
| Canonical URL in markup | https://proluxetravels.com (already correct in og:url and JSON-LD) |
| Pages on disk | 2: index.html, privacy-policy.html |
| Forms | Formspree xdaykkbj, wired 14 April |
| Assets | 16 images in dist/img/, 5 service card .mp4s in dist/video/ (all under 10 MB), GSAP and Lenis self-hosted in dist/lib/ |
| Service card videos referenced | conference-logistics, group-accommodation, venue-sourcing, accommodation-sourcing, private-aviation |

### 2.3 Email infrastructure (DO NOT TOUCH)

All records below MUST survive the cutover byte-for-byte. They live on chunkyfrog and are unrelated to the web host A record.

| Record | Value | Purpose |
|---|---|---|
| MX | 0 proluxetravels-com.mail.protection.outlook.com | Microsoft 365 / Exchange Online inbound |
| TXT (SPF) | v=spf1 +a +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all | Outbound mail authorization |
| TXT (verification) | MS=ms14229968 | Microsoft domain verification |
| TXT (_dmarc) | v=DMARC1; p=none; | DMARC monitoring |
| TXT (default._domainkey) | v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsF1B0zk/... | DKIM signing key |

**Important hygiene note on SPF:** The current SPF record contains `+a +mx`. After cutover the A record points at Cloudflare Pages IPs, which should never send mail. Leaving `+a` in place would effectively authorize Cloudflare Pages IPs to send mail as us. This is benign because Cloudflare Pages does not send mail, but it is incorrect SPF hygiene. See Section 6 for the safe two-phase order that updates SPF BEFORE the A record.

---

## 3. Pre-cutover blockers (MUST fix first)

### 3.1 Blocker A: URL mismatch between old and new site

The old site's Rank Math sitemap publishes 4 URLs. The new site is a single-page anchor-nav build with only 2 physical HTML files. If we flip DNS without redirects, the following inbound links will 404:

| Old URL | Status on new Pages site | Action |
|---|---|---|
| / | 200 (index.html) | None needed |
| /about/ | **404** (no such file) | 301 to /#about via _redirects |
| /contact/ | **404** (no such file) | 301 to /#contact via _redirects |
| /terms-and-conditions/ | **404** (page does not exist at all) | **Build new terms-and-conditions.html page** |
| /terms/ (200 alias on old site) | **404** on new site | 301 to /terms-and-conditions/ via _redirects |
| /privacy-policy.html | 200 (new, did not exist on old) | None needed, this is a net add |

**Action 1: Create `dist/_redirects` with the following contents:**

```
/about/ /#about 301
/about /#about 301
/contact/ /#contact 301
/contact /#contact 301
/services/ /#services 301
/services /#services 301
/approach/ /#approach 301
/approach /#approach 301
/terms/ /terms-and-conditions.html 301
/privacy/ /privacy-policy.html 301
/privacy-policy/ /privacy-policy.html 301
/cookie-policy/ /privacy-policy.html#cookies 301
```

This is Cloudflare Pages' native _redirects format (same as Netlify). Pages reads it at build time. No configuration needed beyond dropping the file in `dist/`.

**Action 2: Build `dist/terms-and-conditions.html`.**

The new site does not currently have a terms page. The old site's /terms-and-conditions/ was last updated 8 March 2026 and is an active inbound URL (Rank Math sitemap plus probably email signatures). Options:

- Option i: Scrape old terms content, adapt into a new terms-and-conditions.html using the existing privacy-policy.html template (dark theme, same fonts, same header, back-link). Lowest friction, preserves inbound links exactly.
- Option ii: Write a fresh terms document from scratch in the same template. More work, but a good chance to update the content for 2026.
- Option iii: Skip the new page and 301 /terms-and-conditions/ to /privacy-policy.html. Quick but loses a legitimate legal URL and could confuse clients.

Recommendation: **Option i**. I can draft the scraper approach and produce the HTML. Needs Team Lead to fetch the current /terms-and-conditions/ page content via curl, I will then structure it into the existing template.

### 3.2 Blocker B: Apex-to-www redirect

The current live site 301s `proluxetravels.com` to `www.proluxetravels.com` at the WordPress layer. After cutover the WordPress layer is gone, so we need this 301 to be rebuilt in Cloudflare. Two options:

- Inside Cloudflare Pages Custom Domains: attach BOTH `www.proluxetravels.com` AND `proluxetravels.com` to the `proluxe-travel` Pages project. Cloudflare serves both. The og:url, JSON-LD, and hardcoded canonical in index.html all reference `https://proluxetravels.com` (apex, no www), so it is worth deciding which one we actually want to be primary.

**Decision needed from Myles:** is the canonical form `proluxetravels.com` (apex, matches current site code) or `www.proluxetravels.com` (matches current live site)? The IBA 2026 ops docs, email signatures, and existing outbound links all use `www.`. The site code says apex. Pick one, enforce consistency with a redirect. My recommendation: make `www.proluxetravels.com` canonical (matches what is everywhere in email) and add a Cloudflare Pages redirect from apex to www via `_redirects`:

```
https://proluxetravels.com/* https://www.proluxetravels.com/:splat 301!
```

The `!` forces the redirect even if the destination file exists. Then update index.html's og:url and JSON-LD url field from `https://proluxetravels.com` to `https://www.proluxetravels.com` to match.

If Myles prefers apex-canonical instead: do the reverse redirect and leave the markup alone.

---

## 4. Cutover approach options

### 4.1 Option A: Keep DNS at chunkyfrog, update records only (RECOMMENDED)

- Log into chunkyfrog DNS panel, update apex A and www CNAME, leave MX/TXT/DKIM/DMARC alone
- Pros: minimal change surface, email infrastructure untouched, instant rollback (revert the two records)
- Cons: DNS stays at chunkyfrog, no Cloudflare dashboard visibility into DNS

### 4.2 Option B: Migrate the zone to Cloudflare DNS

- Change nameservers from chunkyfrog to Cloudflare, recreate all 5 MX/TXT/DKIM records in Cloudflare
- Pros: everything in one dashboard, faster DNS globally
- Cons: one typo in DKIM kills outbound email deliverability for days, wider change surface, more things to verify
- Risk level on migration day: high

**Recommendation: Option A.** Do the migration in Option B later as a separate change window, well after the site cutover is stable.

---

## 5. Staging and verification

### 5.1 Staging URL

The new build is already live at `https://proluxe-travel.pages.dev`. Before cutover, Myles should click through the following as a smoke test:

- Hero renders, olive-branch canvas animates, CTA buttons are clickable
- Nav anchor links (#about, #services, #approach, #contact) all scroll to their sections
- Service cards (5 total) render, hover video plays, no broken images
- Contact form submits successfully (send a test to info@proluxetravels.com, confirm receipt, confirm Formspree dashboard shows the submission)
- Privacy policy page loads at /privacy-policy.html and the cookie banner anchor /privacy-policy.html#cookies jumps correctly
- Mobile viewport (Chrome DevTools at 375px): nav hamburger opens off-canvas, all sections legible, no overflow
- Cookie banner shows on first visit, accept/decline both dismiss it, refresh does not re-show it

### 5.2 Pre-cutover build state check

Before DNS changes, confirm:

```
gh api repos/mlongfield88-art/proluxe-travel/actions/runs --jq '.workflow_runs[0] | {status, conclusion, head_sha, created_at}'
```

Must show `conclusion: success` on the latest run and the `head_sha` matching the current `main`. If red, fix first.

---

## 6. Cutover sequence (step-by-step, in strict order)

### Phase 1: T minus 2 hours (TTL reduction)

1. Log into chunkyfrog DNS panel
2. Reduce TTL on the apex A record (currently 976s) to 300s
3. Reduce TTL on the www CNAME record (currently 823s) to 300s
4. Do not touch any other record
5. Wait at least 17 minutes (one full old-TTL cycle) before Phase 2, so the new 300s value has propagated

### Phase 2: T minus 30 minutes (SPF hygiene fix)

This is step 6 of the SPF hygiene note in Section 2.3. Done before the A record change to keep mail safe.

6. In chunkyfrog DNS panel, replace the TXT SPF record with:
   `v=spf1 +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all`
   (removed the `+a` token)
7. Verify with `dig +short proluxetravels.com TXT` that the new record is live
8. Send a test email from info@proluxetravels.com to an external address (Gmail is good, their headers expose SPF result) and confirm SPF still passes

### Phase 3: T zero (Cloudflare Pages custom domain attach)

9. Log into Cloudflare dashboard, navigate to Workers & Pages > proluxe-travel > Custom Domains
10. Click "Set up a custom domain", enter `www.proluxetravels.com`, click continue
11. Cloudflare displays the required DNS target (will be something like `proluxe-travel.pages.dev` as a CNAME)
12. Cloudflare also attempts to verify ownership and provision an SSL cert. At this point it will show "pending" because DNS has not changed yet. Leave it in pending state.
13. Repeat 9-12 for the apex `proluxetravels.com`. If Cloudflare refuses to attach the apex (some Pages configurations require CNAME at apex which not all DNS providers support), fall back to adding only www and handle the apex 301 via a _redirects rule served from www (the cleaner way is anyway to keep apex-to-www handled by chunkyfrog DNS, see step 14)

### Phase 4: T zero + 2 minutes (DNS flip at chunkyfrog)

14. In chunkyfrog DNS panel, change the www CNAME record:
    - OLD: `www CNAME proluxetravels.com.` (this made www resolve to apex's A record)
    - NEW: `www CNAME proluxe-travel.pages.dev.` (exact target from Cloudflare in step 11)
    - TTL: 300
15. Change the apex record:
    - OLD: `@ A 81.19.214.21`
    - NEW: Depends on chunkyfrog's apex CNAME support. Two possibilities:
      - If chunkyfrog supports ALIAS/ANAME at apex: set to `proluxe-travel.pages.dev.`
      - If not: resolve `proluxe-travel.pages.dev.` to its current IPs via `dig +short proluxe-travel.pages.dev A` and set apex `A` to one of them. Warning: Cloudflare Pages IPs can change, so prefer the ALIAS option if available. If only static A is available, better to delete the apex record entirely and rely on chunkfrog's 301 apex-to-www rule if they offer URL forwarding as a zone feature. Third option: keep apex on the old IP 81.19.214.21 for a few days while WordPress still serves the 301 to www, give Myles time to reconfigure chunkyfrog URL forwarding, then kill it.
    - TTL: 300

**Decision point for Myles before cutover day:** how does chunkyfrog handle apex records? ALIAS/ANAME supported, URL forwarding supported, or static A only? This determines step 15.

16. Save changes in chunkyfrog

### Phase 5: T zero + 5-20 minutes (propagation and SSL)

17. Watch `dig +short www.proluxetravels.com` every 30 seconds. Once it returns `proluxe-travel.pages.dev.` (or a Cloudflare CNAME), DNS has propagated locally
18. Return to Cloudflare Pages Custom Domains. The www entry should flip from "pending" to "active" within 2-5 minutes once DNS propagates globally
19. SSL cert provisioning is automatic. Cloudflare fetches a Let's Encrypt cert the moment DNS validates. Certificate should be active within 5-10 minutes of DNS flip
20. `curl -sI https://www.proluxetravels.com/` should now return:
    - `server: cloudflare`
    - `HTTP/2 200`
    - `cf-ray: ...`
    If the server header still says `Apache`, DNS has not propagated yet, wait

### Phase 6: T zero + 20 minutes (verification)

21. Smoke test the live domain (same checklist as Section 5.1 but pointing at https://www.proluxetravels.com)
22. Verify 301s are working:
    - `curl -sI https://www.proluxetravels.com/about/` should return 301 to `/#about`
    - `curl -sI https://www.proluxetravels.com/contact/` should return 301 to `/#contact`
    - `curl -sI https://www.proluxetravels.com/terms-and-conditions/` should return 200 if terms page was built, or 301 to privacy if we used Option iii
23. Verify form: submit one test enquiry, confirm Formspree dashboard shows it, confirm email arrives at info@proluxetravels.com
24. Verify email: send a test from info@proluxetravels.com to an external Gmail, check headers for `spf=pass dkim=pass dmarc=pass`
25. Google Rich Results Test: paste https://www.proluxetravels.com/ and confirm JSON-LD TravelAgency schema is still parsed correctly

### Phase 7: T plus 24 hours (monitoring)

26. Check Cloudflare Pages analytics for the `proluxe-travel` project, confirm non-zero traffic on the custom domain
27. Check Formspree dashboard, confirm no failed submissions
28. Check Microsoft 365 mail flow, confirm no bounces on info@proluxetravels.com
29. If all clean for 24 hours: raise TTL on apex and www records back up to 3600 in chunkyfrog

---

## 7. Risk surface

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DKIM key accidentally modified, outbound mail starts failing | Low | Severe | Do not touch `default._domainkey` TXT record at any point. Verification step 24 confirms mail is still working post-cutover |
| SPF update in Phase 2 breaks mail before we even start | Low | Severe | Test email immediately after SPF update (step 8). If it fails, revert the SPF record and abort go-live |
| chunkyfrog does not support apex CNAME/ALIAS, apex goes dark | Medium | Moderate | Decision point before cutover day (step 15). Fall back to keeping apex on old IP temporarily so WP still serves the apex-to-www 301 |
| Cloudflare Pages IPs change after we pin them in apex A | Low | High | Never pin Pages IPs directly, always use CNAME/ALIAS. If that is impossible, use chunkyfrog URL forwarding for apex instead |
| SSL cert provisioning takes longer than expected, users see cert error | Low | Moderate | Cutover at 06:00-08:00 GMT low-traffic window gives a buffer. If cert is still pending 20 mins in, check Cloudflare Pages Custom Domains status page for specific error |
| Formspree xdaykkbj tied to old domain only, rejects submissions from new host | Low | Moderate | Formspree allows any referrer by default on the free tier, but check Formspree project settings pre-cutover for domain allowlist. Pre-test from the pages.dev staging URL |
| Inbound links to /about/ or /contact/ 404 if _redirects file not shipped | **Certain if blocker not fixed** | Moderate | Section 3.1 blocker. Must ship dist/_redirects before DNS flip |
| /terms-and-conditions/ inbound links 404 | **Certain if blocker not fixed** | Moderate | Section 3.1 blocker. Must build dist/terms-and-conditions.html OR add redirect |
| Search engines see old site and new site as different, rankings drop | Low | Low | Canonical tags are already consistent, 301s preserve PageRank. Submit new sitemap to Google Search Console post-cutover |
| DNS propagation delays during cutover window split traffic | Medium | Low | TTL reduction in Phase 1 caps split-traffic exposure at 5 minutes |

---

## 8. Rollback plan

If anything critical breaks post-cutover:

1. Log into chunkyfrog DNS panel
2. Revert apex A record: `@ A 81.19.214.21` (TTL 300)
3. Revert www CNAME record: `www CNAME proluxetravels.com.` (TTL 300)
4. If SPF was updated in Phase 2 and mail has degraded: revert SPF to the original including `+a` token
5. `dig +short www.proluxetravels.com` should return `81.19.214.21` within 5 minutes
6. Old WordPress site is back live, no data lost (we never touched the Apache VPS)
7. Report incident, diagnose, schedule a retry

**Nothing about the rollback requires Cloudflare access.** If chunkyfrog is reachable, we can roll back. Cloudflare Pages custom domain attachment is non-destructive, leaving it attached while DNS points elsewhere has zero impact.

**Recorded state (for rollback reference):**
```
proluxetravels.com.    A      81.19.214.21    TTL 976
www.proluxetravels.com CNAME  proluxetravels.com.  TTL 823
TXT SPF (original)     "v=spf1 +a +mx +ip4:145.239.252.48 +ip4:51.75.166.130 include:spf.protection.outlook.com -all"
```

---

## 9. Post-cutover checklist

- [ ] `curl -sI https://www.proluxetravels.com/` returns `server: cloudflare` and HTTP 200
- [ ] `curl -sI https://www.proluxetravels.com/about/` returns 301 to /#about
- [ ] `curl -sI https://www.proluxetravels.com/contact/` returns 301 to /#contact
- [ ] `curl -sI https://www.proluxetravels.com/terms-and-conditions/` returns 200 (or documented 301)
- [ ] SSL cert valid, browser shows padlock, no mixed-content warnings
- [ ] Homepage renders with all 5 service card videos loading on hover
- [ ] Contact form submits, Formspree receives, email delivered to info@proluxetravels.com
- [ ] Test email from info@proluxetravels.com to external Gmail passes SPF + DKIM + DMARC
- [ ] Google Rich Results Test parses JSON-LD TravelAgency schema
- [ ] Cookie banner shows on first visit, accept/decline works
- [ ] Mobile off-canvas nav opens and all anchors jump correctly
- [ ] Cloudflare Pages analytics shows traffic on custom domain
- [ ] No bounces reported by Microsoft 365 for info@proluxetravels.com within first 24 hours
- [ ] TTLs raised back to 3600 on apex A and www CNAME (Phase 7 step 29)

---

## 10. Open questions for Myles

1. Canonical domain: `proluxetravels.com` (apex, matches current code) or `www.proluxetravels.com` (matches email signatures and IBA docs)? Recommend www.
2. `/terms-and-conditions/` strategy: scrape old WP content into a new static page (Option i, recommended), write fresh (Option ii), or 301 to privacy page (Option iii)?
3. chunkyfrog DNS capabilities: does Myles' account support apex CNAME/ALIAS, URL forwarding, or only static A records? This determines step 15 wording.
4. Preferred cutover window: recommend 06:00-08:00 GMT on a weekday so both Asia/EU clients see the new site first and mid-day UK traffic hits a fully-propagated cache.
5. Willingness to migrate DNS to Cloudflare later (Option B in Section 4)? Not part of this go-live but worth scheduling as a follow-up.

---

## 11. Work items before cutover day

Required (blockers):
- [ ] Create `dist/_redirects` with the 12 rules in Section 3.1
- [ ] Build `dist/terms-and-conditions.html` (Option i: scrape + template)
- [ ] Decide canonical (apex or www) and update og:url + JSON-LD accordingly
- [ ] Confirm chunkyfrog apex capabilities
- [ ] Verify latest GitHub Action run is green on main
- [ ] Smoke test staging URL proluxe-travel.pages.dev (Section 5.1 checklist)

Optional (nice to have before cutover):
- [ ] Submit new sitemap URL to Google Search Console once live
- [ ] Draft the cutover-day Slack/email template so the IBA 2026 partners know there may be a brief window of site inconsistency
- [ ] Check Formspree settings for domain allowlist
- [ ] Pre-generate the Rich Results Test URL so verification is one click

---

## 12. What this plan does NOT cover

- Lowering bounce rate / SEO tune-up on the new content (separate task)
- Hero video file (briefing mentioned "hero video not on disk yet", but the current hero uses a CSS background + canvas animation and does not reference a .mp4, so it is not blocking go-live)
- WordPress backup/archive: the old site is on a third-party VPS, not managed by us, recommend asking the current hosting provider for a full site backup before cutover as insurance
- chunkyfrog account handover: if Myles wants LX Sixty to take over DNS management long-term, that is a separate access and billing exercise

---

**End of draft.**
