import { useEffect, useMemo, useState } from "react";
import { screenPalisadeCip } from "../../shared/cip";
import { ARGES_TRAINS, palisadeCapacityTable, sizePalisade } from "../../shared/palisade";
import { palisadeProposal } from "../../shared/proposal";
import { canSeePricing } from "../../shared/roles";
import type { PalisadeInput } from "../../shared/types";
import { cipApi, downloadPdf, getRole, loadCutsheet, loadLogo, persistQuote, priceApi, sizePalisadeApi } from "../lib/api";

const argesIraq: PalisadeInput = {
  projectName: "Arges / Ahmet Iraq MBR",
  siteLocation: "Iraq — municipal MBR (modules only)",
  application: "Municipal MBR modules — Palisade",
  designer: "Engineering review",
  targetPermeateM3d: 200,
  minTemperatureC: 15,
  onPeriodFluxLmh: 15,
  cycleOnMin: 8,
  cycleRelaxMin: 2,
  tmpLimitKpa: 15,
  selectedModulePlates: null,
  tankHeightM: 3.0,
  tankWidthM: 2.4,
  tankLengthM: 12.76,
  trains: ARGES_TRAINS,
  mlssMgL: 8000,
  codMgL: 615,
  bod5MgL: 320,
  tssMgL: 350,
  nh4nMgL: 45,
  ph: 7.9
};

const audit1000: PalisadeInput = {
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
  const [input, setInput] = useState<PalisadeInput>(argesIraq);
  const [result, setResult] = useState(() => sizePalisade(argesIraq));
  const [cip, setCip] = useState(() => screenPalisadeCip());
  const [commercial, setCommercial] = useState<Awaited<ReturnType<typeof priceApi>> | null>(null);
  const [persistNote, setPersistNote] = useState("");
  const [sellMarginPct, setSellMarginPct] = useState<number | null>(null);
  const [marginError, setMarginError] = useState("");
  const role = getRole();
  const pricing = !!(role && canSeePricing(role));

  const patch = (partial: Partial<PalisadeInput>) => setInput((prev) => ({ ...prev, ...partial }));

  useEffect(() => {
    let alive = true;
    sizePalisadeApi(input).then((r) => { if (alive) setResult(r); });
    cipApi({}).then((r) => { if (alive) setCip(r); });
    return () => { alive = false; };
  }, [input]);

  const capacity = useMemo(
    () => palisadeCapacityTable(input, input.trains?.length ? input.trains : ARGES_TRAINS),
    [input]
  );

  async function pdf(includePricing: boolean) {
    if (includePricing && sellMarginPct == null) {
      setMarginError("Enter a sell margin % before issuing a commercial PDF. No company default is assumed.");
      return;
    }
    setMarginError("");
    const priced = includePricing ? await priceApi("palisade", input, sellMarginPct) : null;
    if (priced) setCommercial(priced);
    await downloadPdf(
      palisadeProposal(result, {
        role: role || "customer",
        includePricing,
        flags: { sellMarginPct },
        logoBytes: await loadLogo(),
        cutsheetBytes: await loadCutsheet("palisade")
      })
    );
  }

  return (
    <>
      <div className="banner">{result.documentStatus}</div>
      <div className="card">
        <h2>Palisade sizing</h2>
        <p className="muted">
          Modules, not a complete system. Alper acceptance: 15 LMH ON × 8/2 → 12 LMH cycle-average; Area = Q / 12.
          Cold TCF is check-only and does not change module count. Prefer PAL-130 when tank height ≤ ~3.00 m.
        </p>
        <div className="actions" style={{ marginTop: 0 }}>
          <button onClick={() => setInput(argesIraq)}>Load Arges / Iraq baseline</button>
          <button onClick={() => setInput(audit1000)}>Load 1,000 m³/d audit case</button>
        </div>
        <div className="kpi">
          <div><span className="muted">Required area @12</span><strong>{fmt(result.sizing.requiredAreaM2, "m²")}</strong></div>
          <div><span className="muted">Cycle-average flux</span><strong>{fmt(result.sizing.cycleAverageFluxLmh, "LMH")}</strong></div>
          <div><span className="muted">Selected</span><strong>{result.selectedModule?.sku ?? "—"} × {result.selectedModule?.moduleCount ?? "—"}</strong></div>
          <div><span className="muted">TCF check only</span><strong>{fmt(result.sizing.temperatureCorrectionFactor)}</strong></div>
        </div>
        {result.sizing.pal260Blocked ? (
          <div className="banner">PAL-260 blocked: tank height {result.sizing.tankHeightM} m is below the 3.05 m envelope. Using PAL-130.</div>
        ) : null}
        <div className="tabs">
          {["input", "sizing", "modules", "capacity", "scour", "cip", "summary", "assumptions"].map((id) => (
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
            <Num label="Tank height (m)" value={input.tankHeightM} onChange={(v) => patch({ tankHeightM: v })} />
            <Num label="Tank width (m)" value={input.tankWidthM} onChange={(v) => patch({ tankWidthM: v })} />
            <Num label="Tank length (m)" value={input.tankLengthM} onChange={(v) => patch({ tankLengthM: v })} />
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
                <option value="">Auto (prefer 130 when tank H ≤ 3.00 m)</option>
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
              <Row k="Cycle-average flux" v={fmt(result.sizing.cycleAverageFluxLmh, "LMH")} n="Sizing basis — Area@12" />
              <Row k="Required area" v={fmt(result.sizing.requiredAreaM2, "m²")} />
              <Row k="Cold-temperature area check" v={fmt(result.sizing.coldTemperatureAreaM2, "m²")} n="CHECK ONLY — does not change module count" />
              <Row k="TCF" v={fmt(result.sizing.temperatureCorrectionFactor)} n="CHECK ONLY" />
              <Row k="Area at 12.5 LMH" v={fmt(result.sizing.areaAtLowFluxM2, "m²")} n="Sensitivity only" />
              <Row k="Area at 21 LMH" v={fmt(result.sizing.areaAtHighFluxM2, "m²")} n="Sensitivity only" />
            </tbody>
          </table>
        )}

        {tab === "modules" && (
          <>
            <p className="muted">Minimum whole modules to meet Area@12. No +10% margin and no N+1. Do not infer a 130 envelope by halving the 260 envelope.</p>
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

        {tab === "capacity" && (
          <>
            <p className="muted">Alper multi-unit BOM for 100 / 150 / 200 / 500 / 600 m³/d (3+5+1+1+1 = 11 units).</p>
            <table>
              <thead>
                <tr>
                  <th>Flow</th><th>Units</th><th>Area@12</th><th>SKU</th><th>Mods/unit</th><th>Area/unit</th><th>Mods project</th><th>Area project</th>
                </tr>
              </thead>
              <tbody>
                {capacity.map((r) => (
                  <tr key={r.flowM3d}>
                    <td>{r.flowM3d} m³/d</td>
                    <td>×{r.units}</td>
                    <td>{r.requiredAreaM2?.toFixed(2)}</td>
                    <td>{r.sku}</td>
                    <td>{r.modulesEach}</td>
                    <td>{r.areaEachM2?.toFixed(1)}</td>
                    <td>{r.modulesProject}</td>
                    <td>{r.areaProjectM2?.toFixed(1)}</td>
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
                <Row k="SKU" v={String(result.sales.sku ?? "—")} />
                <Row k="Modules" v={String(result.sales.moduleCount ?? "—")} />
                <Row k="Installed area" v={result.sales.areaM2 != null ? `${result.sales.areaM2.toFixed(1)} m²` : "—"} />
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

        {pricing ? (
          <div className="field" style={{ maxWidth: 280, marginTop: "1rem" }}>
            <label>Sell margin % (required for commercial PDF)</label>
            <input
              value={sellMarginPct ?? ""}
              placeholder="blank — no company default"
              onChange={(e) => setSellMarginPct(num(e.target.value))}
            />
            <p className="muted">Applied on top of cost stubs only. Customer never sees cost or margin.</p>
          </div>
        ) : null}
        {marginError ? <div className="banner">{marginError}</div> : null}

        <div className="actions">
          <button className="primary" onClick={() => pdf(false)}>Download 5-page sizing PDF</button>
          {pricing ? (
            <>
              <button className="primary" onClick={() => pdf(true)}>Download 5-page commercial PDF</button>
              <button onClick={async () => {
                const priced = await priceApi("palisade", input, sellMarginPct);
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
        {commercial && pricing ? (
          <div style={{ marginTop: "1rem" }}>
            <h3>Priceable line items</h3>
            <table>
              <thead><tr><th>SKU</th><th>Qty</th><th>Flag</th><th>Cost stub</th><th>Sell</th><th>Note</th></tr></thead>
              <tbody>
                {commercial.lineItems.map((i) => (
                  <tr key={i.sku}>
                    <td>{i.sku}</td>
                    <td>{i.qty} {i.unit}</td>
                    <td><span className="tag warn">{i.flag}</span></td>
                    <td>{money(i.costUnitPrice ?? i.unitPrice)}</td>
                    <td>{money(i.sellUnitPrice)}</td>
                    <td>{i.note}</td>
                  </tr>
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
function money(v: number | null | undefined) {
  if (v == null) return "—";
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
