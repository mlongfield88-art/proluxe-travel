# ProLuxe Travel Website

Corporate website for ProLuxe Travel Ltd, a luxury hospitality and travel management company.

## Tech stack
- Static HTML/CSS/JS (no framework)
- GSAP + ScrollTrigger (self-hosted in dist/lib/)
- Lenis smooth scroll (self-hosted in dist/lib/)
- Cloudflare Pages auto-deploy via GitHub Actions
- Deploys from dist/ directory

## Brand rules
- Olive #424632, cream #F5F0E8, Garamond font
- No gold. No flights or airport imagery. No stats or counters.
- Private banking tone. Understated luxury.
- No em dashes, en dashes, or double hyphens in copy.

## Key files
- `dist/index.html`, single-page site
- `dist/css/styles.css`, all styles
- `dist/js/main.js`, GSAP animations, form handling, accessibility
- `dist/js/waypoints.js`, interactive olive branch canvas animation (hero)
- `.github/workflows/deploy.yml`, Cloudflare Pages auto-deploy

## Deploy
Push to main triggers GitHub Action which deploys dist/ to Cloudflare Pages (proluxe-travel.pages.dev).

## Corporate context
ProLuxe Travel Ltd: Myles Longfield 70%, Sang Noir Limited 30%.

## Connected Projects
- **Part of**: Web Design (LX Sixty Group in-house capability)
- **Root brain**: `../../CLAUDE.md` (full group structure and cross-connections)
- **ProLuxe Travel ops**: `../../ProLuxe Travel/CLAUDE.md` (business operations, partner docs, IBA 2026; site content must match ops documents)
- **IBA 2026**: `../../ProLuxe Travel/IBA 2026/CLAUDE.md` (flagship project, £2.5M Copenhagen hotel platform)
- **Sangnoir site**: `../sangnoir/CLAUDE.md` (sister company site, Sang Noir holds 30% of ProLuxe)
