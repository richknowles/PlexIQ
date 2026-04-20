# PlexIQ — Claude Instructions

## Git Identity — MANDATORY
Before making ANY commit, run:
```bash
git config user.name "Rich Knowles"
git config user.email "rich@itwerks.net"
```
Every commit must show **Rich Knowles <rich@itwerks.net>** as the author.
No exceptions. No Co-Authored-By lines. No Claude attribution.

## Project
PlexIQ is a Next.js + TypeScript Plex media library manager.
The actual app lives in `web/`. Run `npm run dev` from `web/` to start.

## Current Branch
`claude/plexiq-v5.4.0-target-acquisition` — merges v5.3.5 weapon system + poster grid view.

## Aesthetic
Chicago Mob / 1930s noir. Gold art deco. Dark backgrounds.
The hotdog mascot stays. Do not remove mob terminology.

## Deletion Scoring (`web/app/api/analyze/route.ts`)
Two-pass normalization. Weights: Rating 35% / Plays 35% / File Size 30%.
Do NOT revert to single-pass or drop file size from scoring.

## Weapon Select System (`web/app/page.tsx`)
Four weapons: pistol, tommy (Chicago Execution), sniper (scope animation), c4.
All delete actions route through weapon select before confirm/password flow.
The sniper scope uses GSAP (dynamically imported). Do not remove gsap dependency.

## Poster Grid (`web/components/poster-grid.tsx`)
130x195px posters in responsive grid. Default view (grid beats table).
Click to select — 🎯 overlay + red outline. Score color: RED ≥85, GOLD ≥65, GREEN <65.
Plex poster URL: `${plexHost}${thumb}?X-Plex-Token=${plexToken}`.
Grid uses sortedMovies (all items), not paginated visibleFiltered.

## v5.4.0 Vision
Sniper scope should show the actual movie poster as the target.
Firing range direction: poster on paper target, slides out, bullet holes punch through.
