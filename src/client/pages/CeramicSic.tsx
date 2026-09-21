import { useEffect, useState } from "react";
import { sizeCeramicSic } from "../../shared/ceramicSic";
import { ceramicSicProposal } from "../../shared/proposal";
import { canSeeEngineeringDetail, canSeePricing } from "../../shared/roles";
import type { CeramicSicApplication, CeramicSicInput } from "../../shared/types";
import { downloadPdf, getRole, loadLogo, persistQuote, priceApi, sizeCeramicSicApi } from "../lib/api";

const municipal200: CeramicSicInput = {
  projectName: "Ceramic / SiC municipal example",
  siteLocation: "Demo site",
  application: "municipal_ww_mbr",
  capacityM3d: 200
};

const municipal108: CeramicSicInput = {
  ...municipal200,
  projectName: "Ceramic / SiC 10-module tower example",
  capacityM3d: 108
};

function num(v: string): number | null {
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function CeramicSicPage() {
  const [input, setInput] = useState<CeramicSicInput>(municipal200);
  const [result, setResult] = useState(() => sizeCeramicSic(municipal200));
  const [commercial, setCommercial] = useState<Awaited<ReturnType<typeof priceApi>> | null>(null);
  const [note, setNote] = useState("");
  const [sellMarginPct, setSellMarginPct] = useState<number | null>(null);
  const [marginError, setMarginError] = useState("");
  const role = getRole();
  const pricing = !!(role && canSeePricing(role));
  const eng = !!(role && canSeeEngineeringDetail(role));
  const patch = (partial: Partial<CeramicSicInput>) => setInput((p) => ({ ...p, ...partial }));

  useEffect(() => {
    let alive = true;
    sizeCeramicSicApi(input).then((r) => { if (alive) setResult(r); });
    return () => { alive = false; };
  }, [input]);

  async function pdf(includePricing: boolean) {
    if (includePricing && sellMarginPct == null) {
      setMarginError("Enter a sell margin % before issuing a commercial PDF. No company default is assumed.");
      return;
    }
    setMarginError("");
    if (includePricing) setCommercial(await priceApi("ceramic_sic", input, sellMarginPct));
    await downloadPdf(
      ceramicSicProposal(result, {
        role: role || "customer",
        includePricing,
        flags: { sellMarginPct },
        logoBytes: await loadLogo()
      })
    );
  }

  return (
    <>
      <div className="banner">
        {result.documentStatus} Separate product line from Palisade and Swing. Municipal WW MBR design operating flux is 60 LMH (engineering, not peak).
      </div>
      <div className="card">
        <h2>Ceramic / SiC module selection</h2>
        <p className="muted">
          Modules, not a complete system. Public name is Ceramic / SiC.
          {eng ? " Engineering view may cite the filed TDS path." : ""}
          {" "}Pricing and extra website SKUs are HELD / UNKNOWN.
        </p>
        <div className="actions" style={{ marginTop: 0 }}>
          <button onClick={() => setInput(municipal200)}>Load 200 m³/d municipal</button>
          <button onClick={() => setInput(municipal108)}>Load 108 m³/d (one 10-module tower)</button>
        </div>
        <div className="form-grid">
          <div className="field"><label>Project</label><input value={input.projectName || ""} onChange={(e) => patch({ projectName: e.target.value })} /></div>
          <div className="field"><label>Capacity (m³/d)</label><input value={input.capacityM3d} onChange={(e) => patch({ capacityM3d: Number(e.target.value) || 0 })} /></div>
          <div className="field">
            <label>Application</label>
            <select value={input.application || "municipal_ww_mbr"} onChange={(e) => patch({ application: e.target.value as CeramicSicApplication })}>
              <option value="municipal_ww_mbr">Municipal WW MBR (60 LMH design)</option>
              <option value="other_held">Other — flux HELD / UNKNOWN</option>
            </select>
          </div>
        </div>
        <div className="kpi">
          <div><span className="muted">Design flux</span><strong>{result.sizing.designFluxLmh != null ? `${result.sizing.designFluxLmh} LMH` : "UNKNOWN"}</strong></div>
          <div><span className="muted">Required area</span><strong>{result.sizing.requiredAreaM2?.toFixed(2) ?? "—"} m²</strong></div>
          <div><span className="muted">Modules</span><strong>{result.sales.moduleCount ?? "—"} × {result.sales.sku}</strong></div>
          <div><span className="muted">Installed</span><strong>{result.sales.areaM2 != null ? `${result.sales.areaM2.toFixed(1)} m²` : "—"}</strong></div>
        </div>
        <div className="kpi">
          <div>
            <span className="muted">Unit L×W×H</span>
            <strong>{result.sales.hardware.unitDims}</strong>
            <span className="tag ok">{result.sales.hardware.dimsStatus}</span>
          </div>
          <div>
            <span className="muted">Unit dry weight</span>
            <strong>{result.sales.hardware.unitDryWeightKg} kg</strong>
            <span className="tag ok">{result.sales.hardware.weightStatus}</span>
          </div>
          <div>
            <span className="muted">Total installed dry</span>
            <strong>{result.sales.hardware.totalDryWeightKg != null ? `${result.sales.hardware.totalDryWeightKg} kg` : "—"}</strong>
            <div className="muted">unit × qty</div>
          </div>
          <div>
            <span className="muted">Tower / stack</span>
            <strong>{result.sizing.towers != null ? `${result.sizing.towers} tower(s)` : "—"}</strong>
            <div className="muted">{result.sizing.stackNote}</div>
          </div>
        </div>
        <table>
          <tbody>
            <tr><th>Sheet</th><td>{result.sizing.sheetSku} · {result.sizing.sheetAreaM2} m² · {result.sizing.sheetPoreNm} nm</td></tr>
            <tr><th>Module</th><td>{result.sizing.moduleSku} · {result.sizing.sheetsPerModule} sheets · {result.sizing.areaPerModuleM2} m²</td></tr>
            <tr><th>Housing</th><td>{result.sizing.housing}</td></tr>
            <tr><th>Sheet spacing</th><td>{result.sizing.sheetSpacingMm} mm (adj {result.sizing.sheetSpacingAdjMm[0]}–{result.sizing.sheetSpacingAdjMm[1]} mm)</td></tr>
            <tr><th>Limits</th><td>Suction {result.sizing.maxSuctionBar} bar · backwash +{result.sizing.maxBackwashBar} bar · {result.sizing.tempC[0]}–{result.sizing.tempC[1]} °C</td></tr>
            <tr><th>Capacity each</th><td>{result.sizing.capacityEachM3d != null ? `${result.sizing.capacityEachM3d.toFixed(1)} m³/d at ${result.sizing.designFluxLmh} LMH` : "UNKNOWN"}</td></tr>
            <tr><th>Weight note</th><td className="muted">{eng ? result.sales.hardware.engNote : result.sales.hardware.publicNote}</td></tr>
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
            <p className="muted">Ceramic / SiC price is UNKNOWN. Margin has nothing to apply until a stub exists. Customer never sees cost or margin.</p>
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
                  product: "ceramic_sic",
                  projectName: input.projectName || "Ceramic / SiC draft",
                  rfq: input,
                  selection: result
                });
                setNote(`${saved.dropbox.folder} · HubSpot ${saved.hubspot.status}`);
              }}>Persist RFQ + proposal stub</button>
            </>
          ) : <span className="muted">Commercial actions hidden for customer. Sizing PDF has no prices.</span>}
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
