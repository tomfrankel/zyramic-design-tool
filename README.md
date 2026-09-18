# Zyramic Proposal Software

Draft workspace for **Palisade** and **Swing MBR** module selection, preliminary sizing, logo’d proposal PDFs, and a walled commercial zone.

This is **not** the older “design tool” name. In the UI and in this README the product is **Proposal Software**.

**Status:** demonstrable draft for engineering/sales review. Marked PRELIMINARY / validation-gated. Not a final customer or field issue.

## What this draft does

- Sizes **Palisade** from Alper’s V29 engineering basis (INPUT, SIZING, MODULE SELECTION, SCOUR AIR, CIP boundary, ENGINEERING SUMMARY, ASSUMPTIONS).
- Selects **Swing MBR** modules from the Swing design-tool Database + Design Tool fit rules.
- Public product names only: **Palisade**, **Swing MBR**. Modules, not complete systems. Scour, not aeration / diffuser / bubble copy.
- Two zones:
  1. **Sizing** (customer-eligible): selection and sizing. No prices, customer lists, or past quotes.
  2. **Commercial** (sales / engineering / admin): pricing line items, customer list, past quotes, Dropbox + HubSpot stubs.
- Roles enforced in the UI and on the API: `customer | sales | engineering | admin`.
- Separate APIs: `/api/sizing/*` and `/api/commercial/*`.
- Proposal PDF always includes sizing. Pricing pages are included only when the role allows.
- Unknown commercial flags: labor TBD, Palisade fab TBD, US Swing fab TBD. Optional Chinese OEM estimate is an env stub only. No invented warranty or lead time.

Ceramics are out of scope.

## Run it

```bash
npm install
npm test
npm run build
npm start
```

Open http://localhost:8787

For a live UI rebuild during development:

```bash
npm run build
npm run dev
```

`npm run dev` starts the Express API (and serves `dist/` if you have already built). After changing the React UI, run `npm run build` again or use a second Vite process if you prefer.

### Demo sign-in

Use the role name as the demo key:

| Role | Demo key | Sizing | Commercial |
| --- | --- | --- | --- |
| customer | `customer` | yes | no |
| sales | `sales` | yes | yes |
| engineering | `engineering` | yes | yes |
| admin | `admin` | yes | yes |

Copy `.env.example` to `.env` if you want to change keys or enable adapter stubs. **Never commit `.env` or real tokens.**

## Routes

Intended later as `zyramic.com/proposal`. This draft already uses:

- `/` sign-in
- `/select` product picker
- `/proposal/palisade`
- `/proposal/swing`
- `/proposal/commercial` (walled)

## Engineering basis (Palisade V29)

Read the Engineering Basis before treating numbers as field-ready. The model is a traceable preliminary framework:

- Selected ON-period flux = **15 LMH** (assumption, not validated plant performance).
- Cycle = **8 min ON / 2 min RELAX** → ON fraction **0.80** → cycle-average **12 LMH**.
- Required area = permeate flow / cycle-average flux.
- Independent audit case: **1,000 m³/d → 3,472.22 m² → 13 × PAL-260 → 3,549 m² → 1,248 SCFM**.
- Temperature correction uses the EPA MF/UF viscosity polynomial. Cold water may increase the area check. Warm water does **not** raise the 15 LMH design flux.
- Module rounding only. No +10% area margin and no N+1.
- **PAL-260** envelope = 2.12 × 0.96 × 3.05 m. Do not invent a 130-plate envelope by halving it.
- Scour = 48 SCFM / PAL-130 and 96 SCFM / PAL-260 (0.35 SCFM/m²). Orifice exit velocity is geometry, not a blower setpoint. Blower kW is out of scope.
- Warranty screens apply to biological-process influent (COD 500, BOD5 300, TSS 150, NH4-N 50, pH 6–9). An exceedance is a process-design review, not “MBR impossible.”
- CIP is validation-gated. Scour during chemical soak = OFF as the preliminary basis. Reverse-pressure backwash is not used. Do not return CIP solution to a common permeate / RO tank.

## Swing MBR

- Industry flux menu from the Swing design tool (m³/m²/d), also shown as LMH.
- Required-area clamp matches the source tool (6.25 m² minimum; 6.25–12.5 becomes 12.5).
- Fit filter: module length < tank width − 499 mm; module height < tank height − 499 mm; quantity × 1100 mm < tank length + 1; installed area between required and 1.5 × required.
- Public SKUs are `SWG-8-*` / `SWG-9-*`. Prefer 8-series; 9-series only for very small tanks.

## Commercial rules

- Priceable line items are generated. Amounts stay **UNKNOWN / TBD** unless an explicit env stub is set.
- `SWING_OEM_ESTIMATE_USD_PER_M2` in `.env` enables an optional Chinese OEM **screening stub**. It is not a customer quote and not a US fab price.
- Dropbox adapter stub targets `/Zyramic Setup Info/Proposal Software/Orders/{projectId}/` with `rfq.json`, `selection.json`, and `proposal.pdf`.
- HubSpot adapter is a deal-attachment stub.
- Persistence writes RFQ + selection together (local `data/store.json` on the server, or browser storage in the static demo).

## API

Sizing (any signed-in role):

- `POST /api/sizing/palisade`
- `POST /api/sizing/palisade/cip`
- `POST /api/sizing/swing`
- `POST /api/sizing/proposal.pdf`

Commercial (sales / engineering / admin only):

- `GET/POST /api/commercial/customers`
- `GET /api/commercial/quotes`
- `POST /api/commercial/price`
- `POST /api/commercial/persist`
- `POST /api/commercial/proposal.pdf`

Send `x-zyramic-role` or the `zy_role` cookie.

## What is intentionally not in git

No secrets, pricing tables, customer lists, OEM price sheets, or a real `.env`. Source Excel/PDF workbooks are not committed. Engineering constants that are already in the V29 basis are encoded in `src/shared/`.

## Temporary public URL

A static SPA build can be published for demo (sizing engines run in the browser; commercial data stays local to that browser). The Node server is the supported long-term shape for `/proposal` on zyramic.com.
