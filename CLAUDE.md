# ProLuxe Travel Website

Corporate website for ProLuxe Travel Ltd, a luxury hospitality and travel management company.

## Tech stack
- Static HTML/CSS/JS (no framework)
- GSAP + ScrollTrigger (self-hosted in dist/lib/)
- Lenis smooth scroll (self-hosted in dist/lib/)
- Cloudflare Pages auto-deploy via GitHub Actions
- Deploys from dist/ directory

## Brand rules
- Olive #424632, cream #F5F0E8, Garamond font.
- No gold. No flights or airport imagery. No stats or counters.
- Private banking tone. Understated luxury.
- No em dashes, en dashes, or double hyphens in copy.
- **No icons, no emojis, no illustrations.** Type does the work.
  Decoration may use hairlines, rules, geometric data viz (bars,
  marks, calendar grids), browser-chrome dots, and pulsing live
  indicators. SVG schematics, line drawings, and stylised glyphs
  are out. Photography is permitted as a visual anchor (hero
  imagery only); it is not iconography.

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

## Model routing

Inherits from `../CLAUDE.md` (Web Design parent). Default **Sonnet** for build, code, animation, and deploy work. Use **Opus** for group-level brand voice (LX Sixty corporate, ProLuxe agency, Sangnoir corporate, Capsian Invest investor copy) and any client-facing proposal narrative. Use **Haiku** for asset rename, sitemap regeneration, deploy status checks, and simple find-replace.

## Connected Projects
- **Part of**: Web Design (LX Sixty Group in-house capability)
- **Root brain**: `../../CLAUDE.md` (full group structure and cross-connections)
- **ProLuxe Travel ops**: `../../ProLuxe Travel/CLAUDE.md` (business operations, partner docs, IBA 2026; site content must match ops documents)
- **IBA 2026**: `../../ProLuxe Travel/IBA 2026/CLAUDE.md` (flagship project, £2.5M Copenhagen hotel platform)
- **Sangnoir site**: `../sangnoir/CLAUDE.md` (sister company site, Sang Noir holds 30% of ProLuxe)
