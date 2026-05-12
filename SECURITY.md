# Security Policy

ProLuxe Travel takes security seriously. This document explains how to report a vulnerability you find in any of our public properties.

## Reporting a vulnerability

Email **myles@lxsixty.com** with a clear description of the issue, the affected URL or component, and steps to reproduce.

Please **do not** open a public GitHub issue for security findings. Email gets a faster, more confidential response.

## Scope

This policy covers:

- `proluxetravels.com` (ProLuxe Travel agency site)
- `casa-marenya.proluxetravels.com` (Casa Marenya single-property site)
- The public booker page at `proluxetravels.com/iba2026/`

Out of scope:

- The staff-only admin pages at `proluxetravels.com/adminiba2026/` and `proluxetravels.com/report/` (please report any findings via email but treat as out-of-scope for unauthenticated public testing)
- Third-party services we depend on (Cloudflare Pages, Firebase, GitHub, Formspree, Google Maps, Google Fonts)
- Brute-force attacks against authentication systems
- Findings from automated scanners that haven't been verified to be exploitable

## What to expect

- Acknowledgement within 3 working days
- Assessment and remediation timeline within 10 working days for confirmed vulnerabilities

## Safe harbour

Good-faith security research conducted within the scope above will not result in legal action. Avoid:

- Privacy violations (do not access, modify, or destroy data that is not yours, including any guest or hotel booking data on the IBA 2026 portal)
- Service disruption (no DoS testing)
- Social engineering of staff
- Physical security testing

## Out-of-band contact

For RFC 9116 compliant tooling: `https://proluxetravels.com/.well-known/security.txt`
