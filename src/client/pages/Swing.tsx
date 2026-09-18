import { useEffect, useMemo, useState } from "react";
import { swingLineItems, unknownCommercialTerms } from "../../shared/lineItems";
import { SWING_TANK_LENGTHS_MM, SWING_TANK_WIDTHS_MM } from "../../shared/swingCatalog";
import { sizeSwing } from "../../shared/swing";
import { canSeePricing } from "../../shared/roles";
import type { SwingIndustry, SwingInput } from "../../shared/types";
import { downloadPdf, getRole, loadLogo, persistQuote, priceApi, sizeSwingApi } from "../lib/api";

const industries: SwingIndustry[] = [
  "Domestic and Municipal",
  "Food and Beverage",
  "Textile Printing and Dyeing",
  "Pharmaceuticals",
  "Slaughter",
  "Aquaculture",
  "Garbage Leachate"
];

const defaultInput: SwingInput = {
  projectName: "Swing municipal example",
  siteLocation: "Demo site",
  capacityM3d: 200,
  tankLengthMm: 4400,
  tankWidthMm: 2750,
  tankHeightMm: 2800,
  industry: "Domestic and Municipal",
  preferSeries: "auto"
};

export function SwingPage() {
  const [input, setInput] = useState<SwingInput>(defaultInput);
  const [result, setResult] = useState(() => sizeSwing(defaultInput));
  const [commercial, setCommercial] = useState<Awaited<ReturnType<typeof priceApi>> | null>(null);
  const [note, setNote] = useState("");
  const role = getRole();
  const patch = (partial: Partial<SwingInput>) => setInput((p) => ({ ...p, ...partial }));

  useEffect(() => {
    let alive = true;
    sizeSwingApi(input).then((r) => { if (alive) setResult(r); });
    return () => { alive = false; };
  }, [input]);

  const summary = useMemo(() => [
    { label: "SKU", value: String(result.sales.sku ?? "—") },
    { label: "Modules", value: String(result.sales.moduleCount ?? "—") },
    { label: "Installed area", value: result.sales.areaM2 != null ? `${result.sales.areaM2.toFixed(1)} m²` : "—" },
    { label: "Flux", value: result.sales.fluxLmh != null ? `${result.sales.fluxLmh.toFixed(2)} LMH` : "—" },
    { label: "Capacity", value: `${result.sales.capacityM3d} m³/d` },
    { label: "Footprint", value: result.sales.footprint?.note || "—" }
  ], [result]);

  async function pdf(includePricing: boolean) {
    await downloadPdf({
      logoBytes: await loadLogo(),
      projectName: input.projectName || "Swing MBR draft",
      siteLocation: input.siteLocation,
      product: "Swing MBR",
      role: role || "customer",
      includePricing,
      modelStatus: result.modelStatus,
      documentStatus: result.documentStatus,
      summaryRows: summary,
      assumptions: result.assumptions,
      warnings: result.warnings.map((w) => w.message),
      missingFields: result.missingFields,
      lineItems: includePricing ? swingLineItems(result) : undefined,
      commercialTerms: includePricing
        ? { warranty: unknownCommercialTerms().warranty.note, leadTime: unknownCommercialTerms().leadTime.note }
        : undefined
    });
  }

  return (
    <>
      <div className="banner">{result.documentStatus}. Prefer 8-series Swing modules; 9-series only when the tank is very small.</div>
      <div className="card">
        <h2>Swing MBR module selection</h2>
        <p className="muted">Modules, not a complete system. Industry flux is a preliminary menu from the Swing design tool.</p>
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
            <label>Tank length (mm)</label>
            <select value={input.tankLengthMm} onChange={(e) => patch({ tankLengthMm: Number(e.target.value) })}>
              {SWING_TANK_LENGTHS_MM.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Tank width (mm)</label>
            <select value={input.tankWidthMm} onChange={(e) => patch({ tankWidthMm: Number(e.target.value) })}>
              {SWING_TANK_WIDTHS_MM.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="field"><label>Liquid level height (mm)</label><input value={input.tankHeightMm} onChange={(e) => patch({ tankHeightMm: Number(e.target.value) || 0 })} /></div>
        </div>
        <div className="kpi">
          <div><span className="muted">Required area</span><strong>{result.sizing.requiredAreaM2?.toFixed(2) ?? "—"} m²</strong></div>
          <div><span className="muted">Flux</span><strong>{result.sizing.fluxM3m2d} m³/m²/d · {result.sizing.fluxLmh?.toFixed(2)} LMH</strong></div>
          <div><span className="muted">Matches</span><strong>{result.matches.length}</strong></div>
          <div><span className="muted">Selected</span><strong>{result.selected?.sku ?? "no match"}</strong></div>
        </div>
        {result.matches.length === 0 ? <p className="banner">No matching data. Increase tank length, width, or height.</p> : null}
        <table>
          <thead>
            <tr>
              <th></th><th>SKU</th><th>Decks × cols</th><th>m²</th><th>L×W×H</th><th>Qty</th><th>Installed</th><th>Scour m³/h</th><th>Safety</th><th>Top mm</th>
            </tr>
          </thead>
          <tbody>
            {result.matches.map((m) => (
              <tr key={m.sku}>
                <td><input type="radio" checked={result.selected?.sku === m.sku} onChange={() => patch({ selectedSku: m.sku })} /></td>
                <td>{m.sku}</td>
                <td>{m.decks} × {m.columns}</td>
                <td>{m.areaPerModuleM2}</td>
                <td>{m.dimensionsMm.length}×{m.dimensionsMm.width}×{m.dimensionsMm.height}</td>
                <td>{m.quantity}</td>
                <td>{m.installedAreaM2.toFixed(1)}</td>
                <td>{m.totalScourM3h}</td>
                <td>{m.safetyFactor.toFixed(3)}</td>
                <td>{m.topClearanceMm}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="actions">
          <button className="primary" onClick={() => pdf(false)}>Download sizing PDF</button>
          {role && canSeePricing(role) ? (
            <>
              <button className="primary" onClick={async () => {
                setCommercial(await priceApi("swing", input));
                await pdf(true);
              }}>Download commercial PDF</button>
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
        {commercial ? (
          <table>
            <thead><tr><th>SKU</th><th>Flag</th><th>Note</th></tr></thead>
            <tbody>{commercial.lineItems.map((i) => <tr key={i.sku}><td>{i.sku}</td><td><span className="tag warn">{i.flag}</span></td><td>{i.note}</td></tr>)}</tbody>
          </table>
        ) : null}
      </div>
    </>
  );
}
