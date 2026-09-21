# Zyramic Proposal Software

Draft workspace for **Palisade** and **Swing MBR** module selection, preliminary sizing, a branded 5-page proposal PDF, and a walled commercial zone.

This is **not** the older “design tool” name. In the UI and in this README the product is **Proposal Software**.

**Status:** demonstrable draft. Marked PRELIMINARY / validation-gated. Not a final customer or field issue.

**Acceptance baseline:** Alper Özkan’s Sep 18 Arges / Ahmet Iraq MBR quote. See `CHANGELOG.md`.

Public copy names **Palisade**, **Swing MBR**, **Scrub UF**, and **Ceramic** (modules, not systems). No OmniScour / On-Board Scour as product names; no aeration / diffuser / bubble; no EPSMEM / Liren / Thermo Fisher / Henry on public or customer PDFs. Engineering view may show Alper `EPS8-*` SKUs; public alias is `SWG-*`.

## What this draft does

- Sizes **Palisade** from the V29 / Alper Area@12 basis (15 LMH ON × 8/2 → 12 LMH cycle-average).
- Selects **Swing MBR** with **Alper 12 LMH + 2-wide pack** as the municipal default; industry 0.34 m³/m²/d remains a labeled alternate.
- Two zones:
  1. **Sizing** (customer-eligible): selection and sizing. No prices, cost, margin, customer lists, or past quotes.
  2. **Commercial** (sales / engineering / admin): line items, **sell margin %**, customer list, past quotes, Dropbox + HubSpot stubs.
- Roles: `customer | sales | engineering | admin`.
- 5-page branded PDF: cover, technical, drawings (catalog cut sheets), price or sizing-only, draft T&Cs.
- Unknown commercial flags stay visible. Palisade $ is UNKNOWN. Swing $30/m² is a STUB/OEM budgetary flag (Alper Attachment-3). No invented warranty or lead time.

Ceramics are out of scope.

## Run it

```bash
npm install
npm test
npm run build
npm start
```

Open http://localhost:8787

### Demo sign-in

Use the role name as the demo key:

| Role | Demo key | Sizing | Commercial |
| --- | --- | --- | --- |
| customer | `customer` | yes | no |
| sales | `sales` | yes | yes |
| engineering | `engineering` | yes | yes |
| admin | `admin` | yes | yes |

Copy `.env.example` to `.env` if you want to change keys or adapter stubs. **Never commit `.env` or real tokens.**

## How to test the Arges / Alper cases

1. Sign in as **engineering** / `engineering`.
2. **Palisade** — page loads the Iraq baseline (200 m³/d, 15°C, tank H 3.00 m). Confirm:
   - Area@12 = 694.44 m² → **6 × PAL-130 = 819 m²**
   - TCF is shown as check-only; module count stays 6
   - Selecting PAL-260 is blocked and falls back to 130
   - Capacity tab: 100/150/200/500/600 → 3/4/6/13/16 × PAL-130
   - PAL-130 envelope **UNKNOWN**; 273 kg unit / 1,638 kg total **REFERENCE**. PAL-260 envelope 2.12 × 0.96 × 3.05 m **CONFIRMED**; 546 kg **REFERENCE** (not Palisade fab weight)
3. **Swing MBR** — page loads Alper 12 LMH + 2-wide, tank 12760 × 2400 × 3000 mm. Confirm:
   - 200 m³/d → **2 × SWG-8-2.5-12 / EPS8-2.5-12 = 750 m²**, 3300 × 700 × 2160 mm, 542.4 kg unit / 1,084.8 kg total **ESTIMATED**
   - 500 m³/d → **6 × SWG-8-2.5-10 / EPS8-2.5-10 = 1875 m²**, 452 kg unit / 2,712 kg total **CONFIRMED**
4. Enter a **sell margin %** (required; no default). Download the 5-page commercial PDF. Price page shows stub + sell overlay.
5. Sign out, sign in as **customer** / `customer`. Same sizing. Commercial nav is hidden. PDF has no $ / cost / margin.

## Engineering basis (Palisade)

- Selected ON-period flux = **15 LMH** (assumption).
- Cycle = **8 min ON / 2 min RELAX** → ON fraction **0.80** → cycle-average **12 LMH**.
- Required area = permeate flow / cycle-average flux.
- Independent audit case (no tank-height block): **1,000 m³/d → 3,472.22 m² → 13 × PAL-260**.
- Temperature correction uses the EPA MF/UF viscosity polynomial. **CHECK ONLY — does not change module count.**
- Module rounding only. No +10% area margin and no N+1.
- **PAL-260** envelope = 2.12 × 0.96 × 3.05 m. Prefer / force PAL-130 when tank H ≤ ~3.00 m / &lt; 3.05 m.
- Scour = 48 SCFM / PAL-130 and 96 SCFM / PAL-260 (0.35 SCFM/m²).
- Warranty screens: COD 500, BOD5 300, TSS 150, NH4-N 50, pH 6–9. Exceedance = process-design review, not “MBR impossible.”

## Swing MBR

- **Alper flux mode (default):** 12 LMH cycle-average. Area = Q / 12.
- **Industry map (alternate):** design-tool menu (municipal 0.34 m³/m²/d ≈ 14.17 LMH) with the original 6.25 / 12.5 clamp and linear fit filter.
- **Alper 2-wide pack:** 300 + 700 + 400 + 700 + 300 = 2400 mm. Module length along tank length. Prefer 2.5-deck when height allows (~2160 mm in ~3000 mm).
- Public SKUs `SWG-8-*` / `SWG-9-*`. Engineering SKU `EPS8-*` (Alper naming). Prefer 8-series.

## Commercial rules

- Sales / engineering must enter **sell margin %**. No invented company default.
- Margin applies only on top of cost stubs. Customer role never receives cost or margin fields.
- `SWING_OEM_ESTIMATE_USD_PER_M2` defaults to **30** (Alper Attachment-3 stub). Flagged STUB/OEM.
- Palisade fabrication remains UNKNOWN unless a stub is explicitly supplied.
- Dropbox stub: `/Zyramic Setup Info/Proposal Software/Orders/{projectId}/`
- HubSpot adapter is a deal-attachment stub.

## Proposal PDF (five pages)

1. Cover
2. Technical (sizing / process / warranty / multi-capacity table / hardware takeoff: SKU, qty, unit L×W×H, unit kg, total kg)
3. Drawings — embedded catalog cut sheets (not project CAD). Optional Swing shipping-height figure.
4. Price — line items + sell margin for sales/eng; customer gets sizing-only / no $
5. Draft modular terms (budgetary / modules only / warranty envelope)

Brand tokens from zyramic.com: `--navy #0B1F33`, `--teal #0E7C7B`, `--copper #C4842A`, `--paper #F4EFE4`, `--cream #FFFBF3`. Chrome is structured so Muse art can replace it later.

## Routes

- `/` sign-in
- `/select` product picker
- `/proposal/palisade`
- `/proposal/swing`
- `/proposal/commercial` (walled)

## What is intentionally not in git

No secrets, live pricing tables, customer lists, OEM price sheets, or a real `.env`.

## Temporary public URL

**Demo:** https://pastel-waffle-3b79.here.now/

Anonymous SPA, expires ~24h unless claimed: https://here.now/c/up4-SriEiZyLhe-U

Sign in with the role name as the demo key (`engineering`, `sales`, `admin`, `customer`). The static SPA runs the engines in the browser. The Node server (`npm start`) is the supported long-term shape for zyramic.com/proposal.
