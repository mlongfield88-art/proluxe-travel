# IBA 2026 booking page: App Check rollout

Closes SEC-2026-018 (anonymous-write carve-out on the legacy IBA 2026
booking page) before the page reaches end-of-life in September /
October 2026.

The booking page at `https://proluxetravels.com/iba2026/` requires
anonymous Firebase Auth so the public booker form can write a new
booking and (atomically) decrement the inventory daily occupancy
counter. That anonymous-write surface is a defensive carve-out, not a
permanent posture. App Check closes the carve-out by ensuring that
every Firestore request from this page carries a fresh reCAPTCHA
Enterprise token, which only a real browser running our page can
produce.

Bureau is the proper architecture for new bookings (Phase 1+ auth
foundation, JWT-claim-based gating). The IBA 2026 page is defensive-
patched for the remaining 4-6 months of life, then archived.

## File touched

`dist/iba2026/index.html`, single change: a new `initializeAppCheck`
block inserted between `initializeApp(firebaseConfig)` and `getAuth(app)`
/ `getFirestore(app)`, with the placeholder site key
`SITE_KEY_PLACEHOLDER` and a TODO marker.

## Non-breaking by design

App Check enforcement is controlled by a Firebase Console toggle, not
by client code. With enforcement OFF (the default and the state at
merge time):

- `initializeAppCheck` issues tokens on every Firestore request.
- Firestore accepts every request, with or without a token.
- Even if the token issue path silently fails on a given browser
  (network issue, ad blocker, exotic browser), the booking page still
  works.

This means the merge itself cannot break live bookings. The attack
vector closes only after step 5 below.

## Six step rollout

### Step 1: Register the reCAPTCHA Enterprise site key

Founder action. Open the Firebase Console for the proluxe-iba-2026
project:

> https://console.firebase.google.com/project/proluxe-iba-2026/appcheck

Register `proluxetravels.com` (and any preview / staging origins) as
an App Check origin with the reCAPTCHA Enterprise provider. Copy the
site key out of the console (NOT the secret key, which stays in
Google Cloud).

### Step 2: Replace the placeholder in the booking page

In `dist/iba2026/index.html`, replace the literal string
`SITE_KEY_PLACEHOLDER` with the real site key from step 1. Remove the
TODO marker on the same line.

### Step 3: Merge `feature/iba2026-app-check` to main

Cloudflare Pages auto-deploys on push to main. Live booking page
starts issuing App Check tokens within ~2 minutes of the merge.

Enforcement is still OFF; legitimate bookings continue to land
identically to today. No client-visible behaviour change.

### Step 4: Soak for 24 hours

Open the Firebase Console App Check tab and confirm:

- Token volume rises on the booking page.
- The "verified requests" rate climbs steadily (it never hits 100
  because some browsers refuse reCAPTCHA, but it should clear ~90).
- No surge in "unverified requests" from random IPs (would indicate
  the page is still being scripted from off-site, which is the attack
  we are closing).

If verified rate is low (< 80%) or there is any sign that legitimate
bookings are missing tokens, debug before step 5. Tokens flowing on
legitimate traffic is the precondition for enforcement.

### Step 5: Flip enforcement to ON

Founder action. In the same Firebase Console App Check tab, set
Firestore enforcement to ON for the proluxe-iba-2026 project.

This is the moment the attack closes. Every Firestore request from
this point forward MUST carry a valid App Check token. Off-site
scripts hitting the public Firebase config no longer reach Firestore.

### Step 6: Monitor for 24 hours

After enforcement is on, watch for:

- Legitimate booking volume holds steady (compare to prior 7-day
  baseline).
- Formspree confirmation volume holds steady.
- No spike in client-side errors reported via the IBA inbox.

If a regression appears, flip enforcement back to OFF in the Firebase
Console (a 30 second action). Code-side rollback is not required;
client behaviour is identical with enforcement OFF.

## What this does NOT close

App Check protects the Firebase Web SDK surface. It does NOT protect:

- Direct HTTP attacks on Firebase REST endpoints (still rate-limited
  by Firebase but not domain-scoped).
- Insider write attacks via the admin SDK (rules and audit chain
  apply but App Check does not).
- Server-to-server traffic from our own Cloud Functions (uses Admin
  SDK, exempt from App Check by design).

For new client bookings, Bureau Phase 5 (public booker portal with
magic-link auth) is the correct architecture and is on track for
late-summer 2026. The IBA 2026 page is patched, not rebuilt.

## End-of-life

The IBA 2026 booking page archives in September or October 2026 when
Bureau Phase 5 ships the magic-link booker portal. At that point:

- IBA 2026 page redirects via 301 to the Bureau booker portal at
  `bureau.proluxetravels.com`.
- App Check enforcement stays ON for the redirect's lifetime.
- The `iba-2026-portal` Firestore namespace stays read-open for staff
  reports and migrates to the Bureau namespace per Phase 7 of the
  Bureau build plan.

## Cross references

- Bureau Phase 1 auth foundation: branch
  `feature/phase-1-auth-foundation` on `proluxe-travel-bureau`.
- Security register entry: SEC-2026-018 (reclassified) and the
  closing-out plan in `/Security/SECURITY_REGISTER.md`.
- Bureau replacement: phases 5 and 7 of
  `proluxe-travel-bureau/CLAUDE.md`.
