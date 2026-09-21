import { useEffect, useMemo, useState } from "react";
import { ARGES_SWING_TANK, sizeSwing, swingCapacityTable } from "../../shared/swing";
import { SWING_TANK_LENGTHS_MM, SWING_TANK_WIDTHS_MM } from "../../shared/swingCatalog";
import { swingProposal } from "../../shared/proposal";
import { canSeeEngineeringDetail, canSeePricing } from "../../shared/roles";
import type { SwingFluxMode, SwingIndustry, SwingInput, SwingPackMode } from "../../shared/types";
import { downloadPdf, getRole, loadCutsheet, loadLogo, loadShippingFigure, persistQuote, priceApi, sizeSwingApi } from "../lib/api";

const industries: SwingIndustry[] = [
  "Domestic and Municipal",
  "Food and Beverage",
  "Textile Printing and Dyeing",
  "Pharmaceuticals",
  "Slaughter",
  "Aquaculture",
  "Garbage Leachate"
];

const argesTrains = [
  { flowM3d: 200, units: 1 },
  { flowM3d: 500, units: 1 }
];

const arges200: SwingInput = {
  projectName: "Arges / Ahmet Iraq MBR",
  siteLocation: "Iraq — municipal MBR (modules only)",
  capacityM3d: 200,
  ...ARGES_SWING_TANK,
  industry: "Domestic and Municipal",
  preferSeries: "auto",
  fluxMode: "alper_12_lmh",
  packMode: "alper_2wide",
  preferDeck: "auto",
  trains: argesTrains
};

const arges500: SwingInput = { ...arges200, capacityM3d: 500 };

const designTool200: SwingInput = {
  projectName: "Swing municipal example (industry map)",
  siteLocation: "Demo site",
  capacityM3d: 200,
  tankLengthMm: 4400,
  tankWidthMm: 2750,
  tankHeightMm: 2800,
  industry: "Domestic and Municipal",
  preferSeries: "auto",
  fluxMode: "industry_map",
  packMode: "linear_design_tool"
};

function num(v: string): number | null {
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function SwingPage() {
  const [input, setInput] = useState<SwingInput>(arges200);
  const [result, setResult] = useState(() => sizeSwing(arges200));
  const [commercial, setCommercial] = useState<Awaited<ReturnType<typeof priceApi>> | null>(null);
  const [note, setNote] = useState("");
  const [sellMarginPct, setSellMarginPct] = useState<number | null>(null);
  const [marginError, setMarginError] = useState("");
  const role = getRole();
  const pricing = !!(role && canSeePricing(role));
  const eng = !!(role && canSeeEngineeringDetail(role));
  const patch = (partial: Partial<SwingInput>) => setInput((p) => ({ ...p, ...partial }));

  useEffect(() => {
    let alive = true;
    sizeSwingApi(input).then((r) => { if (alive) setResult(r); });
    return () => { alive = false; };
  }, [input]);

  const table = useMemo(
    () => swingCapacityTable(input, input.trains?.length ? input.trains : [{ flowM3d: input.capacityM3d, units: 1 }]),
    [input]
  );

  async function pdf(includePricing: boolean) {
    if (includePricing && sellMarginPct == null) {
      setMarginError("Enter a sell margin % before issuing a commercial PDF. No company default is assumed.");
      return;
    }
    setMarginError("");
    if (includePricing) setCommercial(await priceApi("swing", input, sellMarginPct));
    await downloadPdf(
      swingProposal(result, {
        role: role || "customer",
        includePricing,
        flags: { sellMarginPct },
        logoBytes: await loadLogo(),
        cutsheetBytes: await loadCutsheet("swing"),
        shippingFigureBytes: await loadShippingFigure()
      })
    );
  }

  return (
    <>
      <div className="banner">
        {result.documentStatus}. Alper flux 12 LMH is the municipal budgetary default. Industry 0.34 m³/m²/d is an alternate mode. Prefer 2.5-deck in a ~3000 mm tank.
      </div>
      <div className="card">
        <h2>Swing MBR module selection</h2>
        <p className="muted">
          Modules, not a complete system. Public SKU is SWG-*.
          {eng ? " Engineering view also shows EPS8-* (Alper quote naming)." : ""}
          {" "}2-wide pack is 300 + 700 + 400 + 700 + 300 = 2400 mm.
          {pricing ? " Budgetary stub $30/m² is flagged STUB/OEM." : ""}
        </p>
        <div className="actions" style={{ marginTop: 0 }}>
          <button onClick={() => setInput(arges200)}>Load Arges 200 m³/d</button>
          <button onClick={() => setInput(arges500)}>Load Arges 500 m³/d</button>
          <button onClick={() => setInput(designTool200)}>Load industry-map 200 m³/d</button>
        </div>
        <div className="form-grid">
          <div className="field"><label>Project</label><input value={input.projectName || ""} onChange={(e) => patch({ projectName: e.target.value })} /></div>
          <div className="field"><label>Capacity (m³/d)</label><input value={input.capacityM3d} onChange={(e) => patch({ capacityM3d: Number(e.target.value) || 0 })} /></div>
          <div className="field">
            <label>Industry</label>
            <select value={input.industry} onChange={(e) => patch({ industry: e.target.value as SwingIndustry })}>
              {industries.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Flux mode</label>
            <select value={input.fluxMode || "alper_12_lmh"} onChange={(e) => patch({ fluxMode: e.target.value as SwingFluxMode })}>
              <option value="alper_12_lmh">Alper 12 LMH (municipal budgetary default)</option>
              <option value="industry_map">Industry map (0.34 m³/m²/d municipal alternate)</option>
            </select>
          </div>
          <div className="field">
            <label>Pack mode</label>
            <select value={input.packMode || "alper_2wide"} onChange={(e) => patch({ packMode: e.target.value as SwingPackMode })}>
              <option value="alper_2wide">Alper 2-wide pack (~2400 mm)</option>
              <option value="linear_design_tool">Linear design-tool (qty × 1100 mm)</option>
            </select>
          </div>
          <div className="field">
            <label>Tank length (mm)</label>
            <input list="swing-lengths" value={input.tankLengthMm} onChange={(e) => patch({ tankLengthMm: Number(e.target.value) || 0 })} />
            <datalist id="swing-lengths">{SWING_TANK_LENGTHS_MM.map((n) => <option key={n} value={n} />)}</datalist>
          </div>
          <div className="field">
            <label>Tank width (mm)</label>
            <input list="swing-widths" value={input.tankWidthMm} onChange={(e) => patch({ tankWidthMm: Number(e.target.value) || 0 })} />
            <datalist id="swing-widths">{SWING_TANK_WIDTHS_MM.map((n) => <option key={n} value={n} />)}</datalist>
          </div>
          <div className="field">
            <label>Tank / liquid height (mm)</label>
            <input value={input.tankHeightMm} onChange={(e) => patch({ tankHeightMm: Number(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="kpi">
          <div><span className="muted">Required area</span><strong>{result.sizing.requiredAreaM2?.toFixed(2) ?? "—"} m²</strong></div>
          <div><span className="muted">Flux</span><strong>{result.sizing.fluxLmh?.toFixed(2)} LMH · {result.sizing.fluxM3m2d?.toFixed(3)} m³/m²/d</strong></div>
          <div><span className="muted">Selected</span><strong>{result.selected ? `${eng ? result.selected.engSku : result.selected.sku} × ${result.selected.quantity}` : "no match"}</strong></div>
          <div><span className="muted">Installed</span><strong>{result.selected?.installedAreaM2?.toFixed(1) ?? "—"} m²</strong></div>
        </div>
        {result.matches.length === 0 ? <p className="banner">No matching data. Increase tank length, width, or height.</p> : null}
        <h3>Matches</h3>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Public SKU</th>
              {eng ? <th>Eng SKU</th> : null}
              <th>Decks × cols</th>
              <th>m²</th>
              <th>L×W×H</th>
              <th>Qty</th>
              <th>Pack</th>
              <th>Installed</th>
              <th>Scour m³/h</th>
              <th>Safety</th>
            </tr>
          </thead>
          <tbody>
            {result.matches.map((m) => (
              <tr key={m.sku}>
                <td><input type="radio" checked={result.selected?.sku === m.sku} onChange={() => patch({ selectedSku: m.sku })} /></td>
                <td>{m.sku}</td>
                {eng ? <td>{m.engSku}</td> : null}
                <td>{m.decks} × {m.columns}</td>
                <td>{m.areaPerModuleM2}</td>
                <td>{m.dimensionsMm.length}×{m.dimensionsMm.width}×{m.dimensionsMm.height}</td>
                <td>{m.quantity}</td>
                <td>{m.pack === "alper_2wide" ? `${m.rows}×2-wide` : "linear"}</td>
                <td>{m.installedAreaM2.toFixed(1)}</td>
                <td>{m.totalScourM3h}</td>
                <td>{m.safetyFactor.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Multi-capacity table</h3>
        <p className="muted">
          Arges municipal units: 200 → 2 × {eng ? "EPS8-2.5-12 / " : ""}SWG-8-2.5-12 = 750 m²;
          500 → 6 × {eng ? "EPS8-2.5-10 / " : ""}SWG-8-2.5-10 = 1875 m².
        </p>
        <table>
          <thead>
            <tr><th>Flow</th><th>Units</th><th>Area@12</th><th>SKU</th>{eng ? <th>Eng</th> : null}<th>Mods/unit</th><th>Area/unit</th></tr>
          </thead>
          <tbody>
            {table.map((r) => (
              <tr key={`${r.flowM3d}-${r.units}`}>
                <td>{r.flowM3d} m³/d</td>
                <td>×{r.units}</td>
                <td>{r.requiredAreaM2?.toFixed(2)}</td>
                <td>{r.sku}</td>
                {eng ? <td>{r.engSku}</td> : null}
                <td>{r.modulesEach}</td>
                <td>{r.areaEachM2?.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {pricing ? (
          <div className="field" style={{ maxWidth: 280, marginTop: "1rem" }}>
            <label>Sell margin % (required for commercial PDF)</label>
            <input
              value={sellMarginPct ?? ""}
              placeholder="blank — no company default"
              onChange={(e) => setSellMarginPct(num(e.target.value))}
            />
            <p className="muted">Applied on the $30/m² STUB/OEM cost only. Customer never sees cost or margin.</p>
          </div>
        ) : null}
        {marginError ? <div className="banner">{marginError}</div> : null}

        <div className="actions">
          <button className="primary" onClick={() => pdf(false)}>Download 5-page sizing PDF</button>
          {pricing ? (
            <>
              <button className="primary" onClick={() => pdf(true)}>Download 5-page commercial PDF</button>
              <button onClick={async () => {
                const saved = await persistQuote({
                  product: "swing",
                  projectName: input.projectName || "Swing draft",
                  rfq: input,
                  selection: result
                });
                setNote(`${saved.dropbox.folder} · HubSpot ${saved.hubspot.status}`);
              }}>Persist RFQ + proposal stub</button>
            </>
          ) : <span className="muted">Commercial actions hidden for customer.</span>}
        </div>
        {note ? <p className="muted">{note}</p> : null}
        {commercial && pricing ? (
          <table>
            <thead><tr><th>SKU</th><th>Flag</th><th>Cost stub</th><th>Sell</th><th>Note</th></tr></thead>
            <tbody>
              {commercial.lineItems.map((i) => (
                <tr key={i.sku}>
                  <td>{i.sku}</td>
                  <td><span className="tag warn">{i.flag}</span></td>
                  <td>{i.costUnitPrice != null ? `$${i.costUnitPrice}` : "—"}</td>
                  <td>{i.sellUnitPrice != null ? `$${i.sellUnitPrice}` : "—"}</td>
                  <td>{i.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </>
  );
}
