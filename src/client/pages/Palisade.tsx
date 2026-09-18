import { useEffect, useMemo, useState } from "react";
import { screenPalisadeCip } from "../../shared/cip";
import { palisadeLineItems, unknownCommercialTerms } from "../../shared/lineItems";
import { sizePalisade } from "../../shared/palisade";
import { canSeePricing } from "../../shared/roles";
import type { PalisadeInput } from "../../shared/types";
import { cipApi, downloadPdf, getRole, loadLogo, persistQuote, priceApi, sizePalisadeApi } from "../lib/api";

const defaultInput: PalisadeInput = {
  projectName: "Audit case — 1,000 m³/d",
  siteLocation: "Demo site",
  application: "Municipal / industrial MBR (modules only)",
  designer: "Engineering review",
  targetPermeateM3d: 1000,
  minTemperatureC: 20,
  onPeriodFluxLmh: 15,
  cycleOnMin: 8,
  cycleRelaxMin: 2,
  tmpLimitKpa: 15,
  selectedModulePlates: 260,
  mlssMgL: 8000,
  codMgL: 400,
  bod5MgL: 200,
  tssMgL: 120,
  nh4nMgL: 30,
  ph: 7.2
};

function num(v: string): number | null {
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function PalisadePage() {
  const [tab, setTab] = useState("input");
  const [input, setInput] = useState<PalisadeInput>(defaultInput);
  const [result, setResult] = useState(() => sizePalisade(defaultInput));
  const [cip, setCip] = useState(() => screenPalisadeCip());
  const [commercial, setCommercial] = useState<Awaited<ReturnType<typeof priceApi>> | null>(null);
  const [persistNote, setPersistNote] = useState("");
  const role = getRole();

  const patch = (partial: Partial<PalisadeInput>) => setInput((prev) => ({ ...prev, ...partial }));

  useEffect(() => {
    let alive = true;
    sizePalisadeApi(input).then((r) => { if (alive) setResult(r); });
    cipApi({}).then((r) => { if (alive) setCip(r); });
    return () => { alive = false; };
  }, [input]);

  const summary = useMemo(() => [
    { label: "SKU", value: String(result.sales.sku ?? "—") },
    { label: "Modules", value: String(result.sales.moduleCount ?? "—") },
    { label: "Installed area", value: result.sales.areaM2 != null ? `${result.sales.areaM2.toFixed(1)} m²` : "—" },
    { label: "ON-period flux", value: `${result.sales.fluxLmh} LMH` },
    { label: "Cycle-average flux", value: `${result.sales.cycleAverageFluxLmh} LMH` },
    { label: "Capacity", value: result.sales.capacityM3d != null ? `${result.sales.capacityM3d} m³/d` : "—" },
    { label: "Total scour", value: result.scour.totalScourScfm != null ? `${result.scour.totalScourScfm} SCFM` : "—" },
    { label: "Footprint", value: result.footprint.note }
  ], [result]);

  async function pdf(includePricing: boolean) {
    const logo = await loadLogo();
    await downloadPdf({
      logoBytes: logo,
      projectName: input.projectName || "Palisade draft",
      siteLocation: input.siteLocation,
      product: "Palisade",
      role: role || "customer",
      includePricing,
      modelStatus: result.modelStatus,
      documentStatus: result.documentStatus,
      summaryRows: summary,
      assumptions: result.assumptions,
      warnings: result.warnings.map((w) => w.message),
      missingFields: result.missingFields,
      lineItems: includePricing ? palisadeLineItems(result) : undefined,
      commercialTerms: includePricing
        ? { warranty: unknownCommercialTerms().warranty.note, leadTime: unknownCommercialTerms().leadTime.note }
        : undefined
    });
  }

  return (
    <>
      <div className="banner">{result.documentStatus}</div>
      <div className="card">
        <h2>Palisade sizing</h2>
        <p className="muted">Modules, not a complete system. 15 LMH is the instantaneous ON-period assumption. Scour is module scour-air demand.</p>
        <div className="kpi">
          <div><span className="muted">Required area</span><strong>{fmt(result.sizing.requiredAreaM2, "m²")}</strong></div>
          <div><span className="muted">Cycle-average flux</span><strong>{fmt(result.sizing.cycleAverageFluxLmh, "LMH")}</strong></div>
          <div><span className="muted">Selected</span><strong>{result.selectedModule?.sku ?? "—"} × {result.selectedModule?.moduleCount ?? "—"}</strong></div>
          <div><span className="muted">Scour</span><strong>{fmt(result.scour.totalScourScfm, "SCFM")}</strong></div>
        </div>
        <div className="tabs">
          {["input", "sizing", "modules", "scour", "cip", "summary", "assumptions"].map((id) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{id}</button>
          ))}
        </div>

        {tab === "input" && (
          <div className="form-grid">
            <Text label="Project / customer" value={input.projectName} onChange={(v) => patch({ projectName: v })} />
            <Text label="Site / location" value={input.siteLocation} onChange={(v) => patch({ siteLocation: v })} />
            <Text label="Application" value={input.application} onChange={(v) => patch({ application: v })} />
            <Num label="Target permeate (m³/d)" value={input.targetPermeateM3d} onChange={(v) => patch({ targetPermeateM3d: v })} />
            <Num label="Design feed (m³/d)" value={input.designFeedM3d} onChange={(v) => patch({ designFeedM3d: v })} />
            <Num label="Recovery (%)" value={input.recoveryPct} onChange={(v) => patch({ recoveryPct: v })} />
            <Num label="Min membrane temperature (°C)" value={input.minTemperatureC} onChange={(v) => patch({ minTemperatureC: v })} />
            <Num label="ON-period flux (LMH)" value={input.onPeriodFluxLmh} onChange={(v) => patch({ onPeriodFluxLmh: v ?? 15 })} />
            <Num label="Cycle ON (min)" value={input.cycleOnMin} onChange={(v) => patch({ cycleOnMin: v ?? 8 })} />
            <Num label="Cycle RELAX (min)" value={input.cycleRelaxMin} onChange={(v) => patch({ cycleRelaxMin: v ?? 2 })} />
            <Num label="COD (mg/L)" value={input.codMgL} onChange={(v) => patch({ codMgL: v })} />
            <Num label="BOD5 (mg/L)" value={input.bod5MgL} onChange={(v) => patch({ bod5MgL: v })} />
            <Num label="TSS (mg/L)" value={input.tssMgL} onChange={(v) => patch({ tssMgL: v })} />
            <Num label="NH4-N (mg/L)" value={input.nh4nMgL} onChange={(v) => patch({ nh4nMgL: v })} />
            <Num label="pH" value={input.ph} onChange={(v) => patch({ ph: v })} />
            <Num label="MLSS (mg/L)" value={input.mlssMgL} onChange={(v) => patch({ mlssMgL: v })} />
            <div className="field">
              <label>Selected module</label>
              <select
                value={input.selectedModulePlates ?? ""}
                onChange={(e) => patch({ selectedModulePlates: e.target.value ? Number(e.target.value) as 130 | 260 : null })}
              >
                <option value="">Select 130 or 260</option>
                <option value="130">PAL-130</option>
                <option value="260">PAL-260</option>
              </select>
            </div>
          </div>
        )}

        {tab === "sizing" && (
          <table>
            <tbody>
              <Row k="Design permeate" v={`${fmt(result.sizing.designPermeateM3d, "m³/d")} / ${fmt(result.sizing.designPermeateM3h, "m³/h")}`} />
              <Row k="ON-period flux" v={`${result.sizing.onPeriodFluxLmh} LMH`} n="Engineering assumption — instantaneous ON/suction" />
              <Row k="ON fraction" v={fmt(result.sizing.onFraction)} />
              <Row k="Cycle-average flux" v={fmt(result.sizing.cycleAverageFluxLmh, "LMH")} n="Sizing basis" />
              <Row k="Required area" v={fmt(result.sizing.requiredAreaM2, "m²")} />
              <Row k="Cold-temperature area check" v={fmt(result.sizing.coldTemperatureAreaM2, "m²")} />
              <Row k="Area at 12.5 LMH" v={fmt(result.sizing.areaAtLowFluxM2, "m²")} n="Sensitivity only" />
              <Row k="Area at 21 LMH" v={fmt(result.sizing.areaAtHighFluxM2, "m²")} n="Sensitivity only" />
            </tbody>
          </table>
        )}

        {tab === "modules" && (
          <>
            <p className="muted">Minimum whole modules to meet required area. No +10% margin and no N+1. Do not infer a 130 envelope by halving the 260 envelope.</p>
            <table>
              <thead>
                <tr><th>SKU</th><th>Plates</th><th>m²/mod</th><th>Count</th><th>Installed m²</th><th>Rounding</th><th>Scour SCFM</th><th>Envelope</th></tr>
              </thead>
              <tbody>
                {result.moduleOptions.map((o) => (
                  <tr key={o.sku}>
                    <td>{o.sku}</td>
                    <td>{o.plates}</td>
                    <td>{o.areaPerModuleM2}</td>
                    <td>{o.moduleCount ?? "—"}</td>
                    <td>{o.installedAreaM2 ?? "—"}</td>
                    <td>{o.roundingDifferenceM2 != null ? o.roundingDifferenceM2.toFixed(2) : "—"}</td>
                    <td>{o.totalScourScfm ?? "—"}</td>
                    <td>{o.envelopeM ? o.envelopeM.join(" × ") + " m" : "project CAD"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === "scour" && (
          <table>
            <tbody>
              <Row k="Specific scour" v="0.35 SCFM/m² = 10 L/min/m²" n="Confirmed production basis" />
              <Row k="Total scour" v={`${fmt(result.scour.totalScourScfm, "SCFM")} / ${fmt(result.scour.totalScourStdM3h, "std m³/h")}`} />
              <Row k="Air / permeate" v={fmt(result.scour.airPerPermeateStdLL, "std L/L")} />
              <Row k="Orifice" v={`${result.scour.orificeMm} mm; ${result.scour.orificeExitVelocityMs} m/s exit`} n="Geometry-derived. Not a blower setpoint." />
              <Row k="Blower pressure" v={fmt(result.scour.requiredBlowerKpa, "kPa")} n="Enter submergence and losses on a later pass. Power is out of scope." />
            </tbody>
          </table>
        )}

        {tab === "cip" && (
          <>
            <div className="banner">{cip.documentStatus}</div>
            <p>{cip.architecture.scourDuringSoak}. {cip.architecture.backwash}. {cip.architecture.commonPermeateRule}.</p>
            <table>
              <thead><tr><th>Step</th><th>Action</th><th>Scour</th><th>Pump</th><th>Status</th></tr></thead>
              <tbody>
                {cip.sequence.map((s) => (
                  <tr key={s.step}><td>{s.step}</td><td>{s.action}</td><td>{s.scour}</td><td>{s.pump}</td><td>{s.status}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="muted">Screening dose example only: maintenance {cip.chemistry.maintenanceDoseL.toFixed(2)} L stock; recovery {cip.chemistry.recoveryDoseL.toFixed(2)} L stock for the example tank. Not an approved recipe.</p>
          </>
        )}

        {tab === "summary" && (
          <>
            <p><span className="tag">{result.modelStatus}</span> <span className={`tag ${result.operating.warranty.warrantyOutside ? "bad" : "ok"}`}>{result.operating.warrantyEnvelopeStatus}</span></p>
            <table>
              <tbody>
                {summary.map((row) => <Row key={row.label} k={row.label} v={row.value} />)}
                <Row k="Warranty COD" v={result.operating.warranty.codStatus} />
                <Row k="MLSS guidance" v={result.operating.mlssStatus} />
                <Row k="CIP" v={result.cipStatus} />
              </tbody>
            </table>
          </>
        )}

        {tab === "assumptions" && (
          <table>
            <thead><tr><th>ID</th><th>Topic</th><th>Basis</th><th>Value</th><th>Status</th></tr></thead>
            <tbody>
              {result.assumptions.map((a) => (
                <tr key={a.id}><td>{a.id}</td><td>{a.topic}</td><td>{a.basis}</td><td>{a.value}</td><td>{a.status}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="actions">
          <button className="primary" onClick={() => pdf(false)}>Download sizing PDF</button>
          {role && canSeePricing(role) ? (
            <>
              <button className="primary" onClick={async () => {
                const priced = await priceApi("palisade", input);
                setCommercial(priced);
                await pdf(true);
              }}>Download commercial PDF</button>
              <button onClick={async () => {
                const priced = await priceApi("palisade", input);
                setCommercial(priced);
                const saved = await persistQuote({
                  product: "palisade",
                  projectName: input.projectName || "Palisade draft",
                  rfq: input,
                  selection: result
                });
                setPersistNote(`${saved.dropbox.folder} · ${saved.hubspot.dealId || saved.hubspot.status}`);
              }}>Persist RFQ + proposal stub</button>
            </>
          ) : (
            <span className="muted">Commercial PDF and persistence are hidden for customer.</span>
          )}
        </div>
        {persistNote ? <p className="muted">{persistNote}</p> : null}
        {commercial ? (
          <div style={{ marginTop: "1rem" }}>
            <h3>Priceable line items</h3>
            <table>
              <thead><tr><th>SKU</th><th>Qty</th><th>Flag</th><th>Note</th></tr></thead>
              <tbody>
                {commercial.lineItems.map((i) => (
                  <tr key={i.sku}><td>{i.sku}</td><td>{i.qty} {i.unit}</td><td><span className="tag warn">{i.flag}</span></td><td>{i.note}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </>
  );
}

function Text({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return <div className="field"><label>{label}</label><input value={value || ""} onChange={(e) => onChange(e.target.value)} /></div>;
}
function Num({ label, value, onChange }: { label: string; value?: number | null; onChange: (v: number | null) => void }) {
  return <div className="field"><label>{label}</label><input value={value ?? ""} onChange={(e) => onChange(num(e.target.value))} /></div>;
}
function Row({ k, v, n }: { k: string; v: string; n?: string }) {
  return <tr><th>{k}</th><td>{v}{n ? <div className="muted">{n}</div> : null}</td></tr>;
}
function fmt(v: number | null | undefined, unit = "") {
  if (v == null || Number.isNaN(v)) return "—";
  const n = Math.abs(v) >= 100 ? v.toFixed(2) : v.toFixed(3);
  return unit ? `${n} ${unit}` : n;
}
