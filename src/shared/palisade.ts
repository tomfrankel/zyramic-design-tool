import type {
  AssumptionItem,
  FieldNote,
  PalisadeInput,
  WarningItem
} from "./types.js";

export const PALISADE_BASIS = {
  documentStatus: "PRELIMINARY — NOT FOR FINAL CUSTOMER / FIELD ISSUE",
  productPublicName: "Palisade",
  productDescription: "Polymer flat-sheet MBR modules with on-board scour",
  plateAreaM2: 1.05,
  modules: {
    130: {
      sku: "PAL-130",
      plates: 130,
      areaM2: 136.5,
      scourScfm: 48,
      permeateGuidanceLowGpm: 7.5,
      permeateGuidanceHighGpm: 12.6,
      envelopeM: null as [number, number, number] | null
    },
    260: {
      sku: "PAL-260",
      plates: 260,
      areaM2: 273,
      scourScfm: 96,
      permeateGuidanceLowGpm: 15,
      permeateGuidanceHighGpm: 25.2,
      envelopeM: [2.12, 0.96, 3.05] as [number, number, number]
    }
  },
  specificScourScfmPerM2: 0.35,
  specificScourLPerMinM2: 10,
  orificeMm: 1.25,
  orificeExitVelocityMs: 26.5,
  selectedOnFluxLmh: 15,
  fluxRangeLmh: [12.5, 21] as [number, number],
  cycleOnMin: 8,
  cycleRelaxMin: 2,
  tmpLimitKpa: 15,
  mlssGuidance: [3000, 12000] as [number, number],
  referenceTemperatureC: 20,
  minCassetteGapMm: 300,
  serviceClearanceMm: 500,
  warranty: {
    cod: 500,
    bod5: 300,
    tss: 150,
    nh4n: 50,
    ph: [6, 9] as [number, number]
  },
  plateGeometryMm: { height: 1047, width: 502, thickness: 7.6, channelGap: 6.4 },
  scourZoneHeightMm: 400,
  connections: "2.5 in Sch 40 / DN65"
} as const;

export function waterViscosityCp(temperatureC: number): number {
  const t = temperatureC;
  return 1.784 - 0.0575 * t + 0.0011 * t ** 2 - 1e-5 * t ** 3;
}

export function designPermeateM3d(input: PalisadeInput): number | null {
  if (input.targetPermeateM3d != null && input.targetPermeateM3d > 0) {
    return input.targetPermeateM3d;
  }
  if (input.designFeedM3d != null && input.recoveryPct != null && input.recoveryPct > 0) {
    return input.designFeedM3d * (input.recoveryPct / 100);
  }
  return null;
}

function envelopeStatus(
  value: number | null | undefined,
  check: (v: number) => boolean,
  outsideMessage: string,
  missing = "NOT ENTERED"
): string {
  if (value == null || Number.isNaN(value)) return missing;
  return check(value) ? "WITHIN WARRANTY ENVELOPE" : outsideMessage;
}

export function sizePalisade(input: PalisadeInput) {
  const missing: string[] = [];
  const warnings: WarningItem[] = [
    {
      code: "PRELIMINARY",
      severity: "warning",
      message:
        "PRELIMINARY engineering model. Not a guaranteed plant-performance result and not released for final customer / field issue until validation items are closed."
    }
  ];

  const qpM3d = designPermeateM3d(input);
  if (qpM3d == null) missing.push("targetPermeateM3d or designFeedM3d + recoveryPct");
  if (input.minTemperatureC == null) missing.push("minTemperatureC");
  if (!input.selectedModulePlates) missing.push("selectedModulePlates");

  const onFlux = input.onPeriodFluxLmh ?? PALISADE_BASIS.selectedOnFluxLmh;
  const onMin = input.cycleOnMin ?? PALISADE_BASIS.cycleOnMin;
  const relaxMin = input.cycleRelaxMin ?? PALISADE_BASIS.cycleRelaxMin;
  const onFraction = onMin + relaxMin > 0 ? onMin / (onMin + relaxMin) : null;
  const cycleAvgFlux = onFlux != null && onFraction != null ? onFlux * onFraction : null;
  const qpM3h = qpM3d != null ? qpM3d / 24 : null;
  const qpMgd = qpM3d != null ? qpM3d * 0.000264172052 : null;
  const requiredAreaM2 =
    qpM3h != null && cycleAvgFlux != null && cycleAvgFlux > 0 ? (qpM3h * 1000) / cycleAvgFlux : null;

  const tRef = PALISADE_BASIS.referenceTemperatureC;
  const muRef = waterViscosityCp(tRef);
  const muT = input.minTemperatureC != null ? waterViscosityCp(input.minTemperatureC) : null;
  const tcf = muT != null && muRef > 0 ? muT / muRef : null;
  const coldAreaM2 =
    requiredAreaM2 == null
      ? null
      : input.minTemperatureC != null && input.minTemperatureC < tRef && tcf != null
        ? requiredAreaM2 * tcf
        : requiredAreaM2;

  const areaLow =
    qpM3h != null && onFraction != null ? (qpM3h * 1000) / (12.5 * onFraction) : null;
  const areaHigh =
    qpM3h != null && onFraction != null ? (qpM3h * 1000) / (21 * onFraction) : null;

  const options = ([130, 260] as const).map((plates) => {
    const spec = PALISADE_BASIS.modules[plates];
    const raw = requiredAreaM2 != null ? requiredAreaM2 / spec.areaM2 : null;
    const count = raw != null ? Math.ceil(raw) : null;
    const installed = count != null ? count * spec.areaM2 : null;
    const roundingPct =
      requiredAreaM2 != null && installed != null && requiredAreaM2 > 0
        ? installed / requiredAreaM2 - 1
        : null;
    const scourScfm = count != null ? count * spec.scourScfm : null;
    return {
      plates,
      sku: spec.sku,
      areaPerModuleM2: spec.areaM2,
      scourPerModuleScfm: spec.scourScfm,
      envelopeM: spec.envelopeM,
      rawCount: raw,
      moduleCount: count,
      installedAreaM2: installed,
      roundingDifferenceM2:
        requiredAreaM2 != null && installed != null ? installed - requiredAreaM2 : null,
      roundingPct,
      totalScourScfm: scourScfm
    };
  });

  const selected = options.find((o) => o.plates === input.selectedModulePlates) ?? null;
  const totalScourScfm = selected?.totalScourScfm ?? null;
  const totalScourLmin = totalScourScfm != null ? totalScourScfm * 28.3168466 : null;
  const totalScourSm3h = totalScourLmin != null ? (totalScourLmin * 60) / 1000 : null;
  const airPerArea =
    selected?.installedAreaM2 && totalScourScfm != null
      ? totalScourScfm / selected.installedAreaM2
      : null;
  const airPerPermeate =
    totalScourLmin != null && qpM3h != null && qpM3h > 0
      ? totalScourLmin / ((qpM3h * 1000) / 60)
      : null;

  const hydroKpa = input.submergenceM != null ? input.submergenceM * 9.80665 : null;
  const blowerKpa =
    hydroKpa == null
      ? null
      : hydroKpa +
        (input.pipeLossKpa ?? 0) +
        (input.fittingsLossKpa ?? 0) +
        (input.headerLossKpa ?? 0) +
        (input.moduleLossKpa ?? 0);

  const outside = "OUTSIDE ZYRAMIC WARRANTY OPERATING ENVELOPE — PROCESS DESIGN REVIEW REQUIRED";
  const codStatus = envelopeStatus(input.codMgL, (v) => v <= 500, outside);
  const bodStatus = envelopeStatus(input.bod5MgL, (v) => v <= 300, outside);
  const tssStatus = envelopeStatus(input.tssMgL, (v) => v <= 150, outside);
  const nh4Status = envelopeStatus(input.nh4nMgL, (v) => v <= 50, outside);
  const phStatus = envelopeStatus(input.ph, (v) => v >= 6 && v <= 9, outside);
  const warrantyOutside = [codStatus, bodStatus, tssStatus, nh4Status, phStatus].some((s) =>
    s.startsWith("OUTSIDE")
  );

  if (warrantyOutside) {
    warnings.push({
      code: "WARRANTY_ENVELOPE",
      severity: "warning",
      message:
        "Outside Zyramic warranty operating envelope — process design review required. This is a contractual/operating-envelope issue, not a statement that treatment is impossible."
    });
  }

  const fluxStatus =
    onFlux >= 12.5 && onFlux <= 21
      ? "WITHIN PRELIMINARY GUIDANCE"
      : "OUTSIDE CURRENT PRELIMINARY DESIGN GUIDANCE";

  const mlssStatus =
    input.mlssMgL == null
      ? "NOT ENTERED"
      : input.mlssMgL >= 3000 && input.mlssMgL <= 12000
        ? "WITHIN GUIDANCE"
        : "OUTSIDE CURRENT GUIDANCE";

  if (input.minTemperatureC != null && input.minTemperatureC >= tRef) {
    warnings.push({
      code: "NO_WARM_FLUX_UPLIFT",
      severity: "info",
      message:
        "Temperature correction is a hydraulic/normalization adjustment only. Warm mixed liquor is not used to increase the selected 15 LMH design flux."
    });
  }

  warnings.push({
    code: "FLUX_DEFINITION",
    severity: "warning",
    message:
      "15 LMH is the instantaneous ON-period flux, not clock-time average. Cycle-average equivalent flux = ON flux × ON fraction. Confirm whether the 12.5–21 LMH range is instantaneous or cycle-average before field use."
  });

  if (input.selectedModulePlates === 130) {
    warnings.push({
      code: "NO_HALVED_ENVELOPE",
      severity: "info",
      message:
        "130-plate envelope is not published by halving the 260-plate envelope. Project CAD governs 130-plate layout and footprint."
    });
  }

  const modelStatus =
    qpM3d == null ||
    onFlux == null ||
    requiredAreaM2 == null ||
    !input.selectedModulePlates ||
    selected?.moduleCount == null ||
    input.minTemperatureC == null
      ? "INPUTS / MODULE SELECTION MISSING"
      : "PRELIMINARY MODEL READY FOR ENGINEERING REVIEW";

  const notes: FieldNote[] = [
    { id: "qp_d", label: "Design permeate flow", value: qpM3d, unit: "m³/d", status: "CALCULATED" },
    { id: "qp_h", label: "Design permeate flow", value: qpM3h, unit: "m³/h", status: "CALCULATED" },
    { id: "qp_mgd", label: "Design permeate flow", value: qpMgd, unit: "MGD", status: "CALCULATED", note: "Display cross-check only" },
    { id: "on_flux", label: "Selected ON-period design flux", value: onFlux, unit: "LMH", status: "ENGINEERING ASSUMPTION", note: "Instantaneous flux during ON/suction. Not validated Palisade plant performance." },
    { id: "on_frac", label: "ON-time fraction", value: onFraction, unit: "fraction", status: "CALCULATED" },
    { id: "cycle_flux", label: "Cycle-average equivalent flux", value: cycleAvgFlux, unit: "LMH", status: "CALCULATED", note: "Used for membrane-area sizing." },
    { id: "area", label: "Required membrane area", value: requiredAreaM2, unit: "m²", status: "CALCULATED" },
    { id: "cold_area", label: "Cold-temperature area check", value: coldAreaM2, unit: "m²", status: "CALCULATED", note: "Viscosity multiplier applied only if minimum temperature < 20°C." },
    { id: "sku", label: "Selected SKU", value: selected?.sku ?? null, status: "ENGINEER INPUT" },
    { id: "modules", label: "Module count", value: selected?.moduleCount ?? null, unit: "modules", status: "CALCULATED" },
    { id: "installed", label: "Installed membrane area", value: selected?.installedAreaM2 ?? null, unit: "m²", status: "CALCULATED" },
    { id: "scour", label: "Total scour air", value: totalScourScfm, unit: "SCFM", status: "CALCULATED" },
    { id: "scour_si", label: "Total scour air", value: totalScourSm3h, unit: "standard m³/h", status: "CALCULATED" }
  ];

  const assumptions: AssumptionItem[] = [
    { id: "A-03", topic: "Selected design flux", basis: "ENGINEERING ASSUMPTION", value: "15 LMH ON-period instantaneous flux", action: "Validate through pilot/field data; do not call supplier-validated.", status: "OPEN" },
    { id: "A-04", topic: "Cycle", basis: "ZYRAMIC PRELIMINARY", value: "8 min ON / 2 min RELAX typical basis", action: "Project-specific confirmation as required", status: "OPEN" },
    { id: "A-05", topic: "Cycle correction", basis: "ENGINEERING CALCULATION", value: "ON fraction 0.80; cycle-average equivalent flux 12 LMH", action: "Avoid double-counting; sizing uses Q/(15×0.80)", status: "CLOSED" },
    { id: "A-07", topic: "MLSS", basis: "ZYRAMIC PRELIMINARY", value: "3,000–12,000 mg/L", action: "Preliminary operating/design guidance; not a contractual warranty maximum in this model.", status: "OPEN" },
    { id: "A-08", topic: "Scour", basis: "ZYRAMIC CONFIRMED", value: "10 L/min/m² = 0.35 SCFM/m²; 48/96 SCFM per module", action: "Use latest production values", status: "CLOSED" },
    { id: "A-15", topic: "Module selection", basis: "ENGINEERING CALCULATION", value: "Minimum whole modules to meet required area", action: "No arbitrary +10% margin, N+1, or standby", status: "CLOSED" },
    { id: "A-17", topic: "CIP recipe", basis: "VALIDATION REQUIRED", value: "Not published as a Palisade-specific recipe", action: "Obtain written Zyramic approval", status: "OPEN" },
    { id: "A-22", topic: "Biological process design", basis: "OUT OF SCOPE", value: "Not specified in this draft", action: "Do not treat this tool as a complete plant design", status: "CLOSED" },
    { id: "A-26", topic: "Flux-range definition", basis: "VALIDATION REQUIRED", value: "12.5–21 LMH instantaneous vs cycle-average/net not independently confirmed", action: "Do not reinterpret the range without supplier clarification", status: "OPEN" },
    { id: "A-27", topic: "Cassette gap", basis: "ZYRAMIC CONFIRMED", value: "300 mm minimum gap; 500 mm is a separate preliminary service/access consideration", action: "Do not reduce below 300 mm without written approval", status: "CLOSED" }
  ];

  const footprint = {
    selectedSku: selected?.sku ?? null,
    moduleCount: selected?.moduleCount ?? null,
    envelopeM: selected?.envelopeM ?? null,
    minCassetteGapMm: PALISADE_BASIS.minCassetteGapMm,
    serviceClearanceMm: PALISADE_BASIS.serviceClearanceMm,
    note:
      selected?.plates === 260
        ? "Published 260-module envelope is 2.12 × 0.96 × 3.05 m. Rack arrangement and installed footprint are project CAD. 300 mm is the minimum cassette/rack gap; 500 mm is a separate service/access consideration."
        : "Do not infer a 130-module envelope by halving the published 260-module envelope. Project CAD governs footprint."
  };

  return {
    product: "palisade" as const,
    documentStatus: PALISADE_BASIS.documentStatus,
    publicName: PALISADE_BASIS.productPublicName,
    inputs: input,
    sizing: {
      designPermeateM3d: qpM3d,
      designPermeateM3h: qpM3h,
      designPermeateMgd: qpMgd,
      onPeriodFluxLmh: onFlux,
      cycleOnMin: onMin,
      cycleRelaxMin: relaxMin,
      onFraction,
      cycleAverageFluxLmh: cycleAvgFlux,
      requiredAreaM2,
      referenceTemperatureC: tRef,
      minTemperatureC: input.minTemperatureC ?? null,
      viscosityRefCp: muRef,
      viscosityMinCp: muT,
      temperatureCorrectionFactor: tcf,
      coldTemperatureAreaM2: coldAreaM2,
      areaAtLowFluxM2: areaLow,
      areaAtHighFluxM2: areaHigh
    },
    moduleOptions: options,
    selectedModule: selected,
    scour: {
      specificScfmPerM2: PALISADE_BASIS.specificScourScfmPerM2,
      specificLPerMinM2: PALISADE_BASIS.specificScourLPerMinM2,
      totalScourScfm,
      totalScourStdLmin: totalScourLmin,
      totalScourStdM3h: totalScourSm3h,
      airPerAreaScfmPerM2: airPerArea,
      airPerPermeateStdLL: airPerPermeate,
      orificeMm: PALISADE_BASIS.orificeMm,
      orificeExitVelocityMs: PALISADE_BASIS.orificeExitVelocityMs,
      hydrostaticKpa: hydroKpa,
      requiredBlowerKpa: blowerKpa,
      blowerPower: "NOT CALCULATED — outside V29 scope"
    },
    operating: {
      fluxStatus,
      tmpLimitKpa: input.tmpLimitKpa ?? PALISADE_BASIS.tmpLimitKpa,
      tmpStatus:
        input.actualTmpKpa == null
          ? "NOT ENTERED"
          : input.actualTmpKpa <= (input.tmpLimitKpa ?? 15)
            ? "WITHIN GUIDANCE"
            : "ABOVE CURRENT GUIDANCE",
      mlssStatus,
      warranty: { codStatus, bodStatus, tssStatus, nh4Status, phStatus, warrantyOutside },
      warrantyEnvelopeStatus: warrantyOutside
        ? outside
        : "NO OUT-OF-ENVELOPE RESULT FROM ENTERED CHECKS",
      pretreatment:
        "3 mm perforated plate/mesh or finer; continuous; no bypass; continuous grit removal. No shock loading of oils, greases, solvents, or hydrocarbons.",
      permeateMode: "Vacuum suction",
      scourMode: "Continuous standard; field adjustable"
    },
    footprint,
    sales: {
      sku: selected?.sku ?? null,
      moduleCount: selected?.moduleCount ?? null,
      areaM2: selected?.installedAreaM2 ?? null,
      requiredAreaM2,
      fluxLmh: onFlux,
      cycleAverageFluxLmh: cycleAvgFlux,
      capacityM3d: qpM3d,
      footprint
    },
    notes,
    assumptions,
    warnings,
    missingFields: missing,
    modelStatus,
    cipStatus:
      "NOT RELEASED — no Palisade-specific CIP recipe is released. Scour during chemical soak = OFF as the preliminary basis. Permeate-side circulation is proposed / validation-gated. Reverse-pressure backwash is not used."
  };
}

export type PalisadeResult = ReturnType<typeof sizePalisade>;
