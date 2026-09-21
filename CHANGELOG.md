# CHANGELOG — Alper acceptance baseline (Sep 20, 2026)

Brand kit (Sep 21): official logos + Source Serif 4 / Archivo chrome; public copy locked to Palisade / Swing MBR / Scrub UF / Ceramic modules.

Short Basecamp note: what changed versus the gaps in COMPARISON-Tom.md.

## Acceptance source
Alper Özkan Sep 18 Arges / Ahmet Iraq MBR quote is now the software acceptance baseline. Vite/Express Proposal Software on this PR is the source of truth (no separate Next draft).

## Palisade — now matches Alper
- Area = Q / 12 LMH (15 LMH ON × 8/2). Counts 100/150/200/500/600 → 3/4/6/13/16 × PAL-130.
- Cold 15°C TCF is **check only**. It no longer upsizes modules (that was the local Next draft bug).
- Tank height ≤ ~3.00 m prefers PAL-130. PAL-260 is **blocked** below 3.05 m (Alper rejected 260 for a 3.00 m tank).
- Multi-capacity table + unit quantities (3+5+1+1+1 = 11 units).

## Swing — now matches Alper 200/500
- New default **Alper flux mode: 12 LMH** (same Palisade cycle-avg). Industry 0.34 m³/m²/d stays as a clearly labeled alternate.
- **2-wide pack** in ~2400 mm (300+700+400+700+300), not only linear qty×1100.
- Prefer **2.5-deck** when ~2160 mm fits a ~3000 mm tank.
- Added **SWG-8-2.5-12 / EPS8-2.5-12** (375 m²). Eng view shows EPS8-*; public alias is SWG-*.
- Acceptance: @200 → 2×EPS8-2.5-12 = 750 m²; @500 → 6×EPS8-2.5-10 = 1875 m².

## Price
- Swing budgetary stub **$30/m²** (Alper Attachment-3), flagged STUB/OEM.
- Palisade commercial remains **UNKNOWN**.
- Quote flow **asks for sell margin %**. Blank/required — no invented company default. Applied on cost stubs only. Customer never sees cost or margin.

## PDF
- Five branded pages: cover, technical (incl. multi-capacity), drawings (embedded catalog cut sheets), price (or sizing-only), draft T&Cs.
- Tokens from zyramic.com: navy / teal / copper / paper / cream. Art slots left for later Muse swap.

## Demo
Public SPA URL and demo logins are in the PR body / README. Test Arges 200 and 500 on Palisade + Swing, then download the 5-page PDF as engineering (with margin) and as customer (no $).
