import {
  SWING_INDUSTRY_FLUX_M3_M2_D,
  SWING_MODULE_PITCH_MM,
  SWING_MODULES,
  type SwingModuleSpec
} from "./swingCatalog.js";
import type { AssumptionItem, SwingIndustry, SwingInput, WarningItem } from "./types.js";

export function industryFluxM3m2d(industry: SwingIndustry): number | null {
  return SWING_INDUSTRY_FLUX_M3_M2_D[industry] ?? null;
}

export function fluxLmhFromM3m2d(flux: number): number {
  return (flux * 1000) / 24;
}

/** Replicates Design Tool A6 clamp: min 6.25 m², values between 6.25 and 12.5 become 12.5. */
export function clampRequiredAreaM2(rawM2: number): number {
  if (rawM2 > 6.25) {
    return rawM2 < 12.5 ? 12.5 : rawM2;
  }
  return 6.25;
}

export interface SwingMatch {
  spec: SwingModuleSpec;
  quantity: number;
  installedAreaM2: number;
  totalScourM3h: number;
  filtrationM3d: number;
  alternativeTankLengthMm: number;
  topClearanceMm: number;
  safetyFactor: number;
}

export function configureModule(spec: SwingModuleSpec, requiredAreaM2: number, tankHeightMm: number): SwingMatch {
  const quantity = Math.ceil(requiredAreaM2 / spec.areaM2);
  const installedAreaM2 = quantity * spec.areaM2;
  return {
    spec,
    quantity,
    installedAreaM2,
    totalScourM3h: quantity * spec.scourAirM3h,
    filtrationM3d: quantity * spec.municipalCapacityM3d,
    alternativeTankLengthMm: quantity * SWING_MODULE_PITCH_MM,
    topClearanceMm: tankHeightMm - spec.heightMm,
    safetyFactor: requiredAreaM2 > 0 ? installedAreaM2 / requiredAreaM2 : 0
  };
}

export function moduleFitsTank(
  match: SwingMatch,
  tankLengthMm: number,
  tankWidthMm: number,
  tankHeightMm: number,
  requiredAreaM2: number
): boolean {
  return (
    match.alternativeTankLengthMm < tankLengthMm + 1 &&
    match.spec.lengthMm < tankWidthMm - 499 &&
    match.spec.heightMm < tankHeightMm - 499 &&
    match.installedAreaM2 > requiredAreaM2 - 0.1 &&
    match.installedAreaM2 < requiredAreaM2 * 1.5
  );
}

export function sizeSwing(input: SwingInput) {
  const missing: string[] = [];
  const warnings: WarningItem[] = [
    {
      code: "PRELIMINARY",
      severity: "warning",
      message:
        "PRELIMINARY Swing MBR module selection. These are modules, not a complete treatment system. Flux values are a preliminary industry basis from the Swing design tool and require project water-quality review."
    }
  ];

  if (!(input.capacityM3d > 0)) missing.push("capacityM3d");
  if (!(input.tankLengthMm > 0)) missing.push("tankLengthMm");
  if (!(input.tankWidthMm > 0)) missing.push("tankWidthMm");
  if (!(input.tankHeightMm > 0)) missing.push("tankHeightMm");

  const fluxM3m2d = industryFluxM3m2d(input.industry);
  if (fluxM3m2d == null) missing.push("industry");
  const rawArea = fluxM3m2d && input.capacityM3d > 0 ? input.capacityM3d / fluxM3m2d : null;
  const requiredAreaM2 = rawArea != null ? clampRequiredAreaM2(rawArea) : null;
  const fluxLmh = fluxM3m2d != null ? fluxLmhFromM3m2d(fluxM3m2d) : null;

  const prefer = input.preferSeries ?? "auto";
  const catalog =
    prefer === "8"
      ? SWING_MODULES.filter((m) => m.series === "8")
      : prefer === "9"
        ? SWING_MODULES.filter((m) => m.series === "9")
        : SWING_MODULES;

  const configured =
    requiredAreaM2 == null
      ? []
      : catalog.map((spec) => configureModule(spec, requiredAreaM2, input.tankHeightMm));

  const matches = configured.filter((m) =>
    moduleFitsTank(m, input.tankLengthMm, input.tankWidthMm, input.tankHeightMm, requiredAreaM2 ?? 0)
  );

  const series8 = matches.filter((m) => m.spec.series === "8");
  const series9 = matches.filter((m) => m.spec.series === "9");
  const recommendedPool = prefer === "auto" && series8.length ? series8 : matches;
  const recommended =
    recommendedPool.slice().sort((a, b) => {
      const sf = Math.abs(a.safetyFactor - 1.05) - Math.abs(b.safetyFactor - 1.05);
      if (Math.abs(sf) > 1e-9) return sf;
      return a.quantity - b.quantity;
    })[0] ?? null;

  const selected =
    (input.selectedSku && matches.find((m) => m.spec.sku === input.selectedSku)) || recommended;

  if (!matches.length && requiredAreaM2 != null) {
    warnings.push({
      code: "NO_MATCH",
      severity: "warning",
      message:
        "No matching module for the entered tank and capacity. Increase tank length, width, or liquid-level height, or review the required area."
    });
  }

  if (selected?.spec.series === "9") {
    warnings.push({
      code: "SERIES_9",
      severity: "info",
      message:
        "Prefer 8-series Swing modules for maintainability. 9-series is intended only when the membrane tank is very small."
    });
  }

  warnings.push({
    code: "SPECIAL_INDUSTRIAL",
    severity: "info",
    message:
      "Listed industries are a limited flux menu. For special industrial wastewater, provide feed-water quality before treating flux as project-ready."
  });

  const assumptions: AssumptionItem[] = [
    {
      id: "S-01",
      topic: "Industry flux",
      basis: "SWING DESIGN TOOL PRELIMINARY",
      value: fluxM3m2d != null ? `${fluxM3m2d} m³/m²/d (${fluxLmh?.toFixed(2)} LMH)` : "not selected",
      action: "Confirm against project water quality. Do not present as a guaranteed flux.",
      status: "OPEN"
    },
    {
      id: "S-02",
      topic: "Area clamp",
      basis: "SWING DESIGN TOOL",
      value: "Required area is at least 6.25 m²; values between 6.25 and 12.5 m² become 12.5 m²",
      action: "Retain source-tool discrete-area behavior",
      status: "CLOSED"
    },
    {
      id: "S-03",
      topic: "Fit rule",
      basis: "SWING DESIGN TOOL FILTER",
      value: "Module length < tank width − 499 mm; module height < tank height − 499 mm; qty × 1100 mm < tank length + 1; installed area between required and 1.5 × required",
      action: "If no match, resize the tank rather than inventing a module",
      status: "CLOSED"
    },
    {
      id: "S-04",
      topic: "Scope",
      basis: "PRODUCT RULE",
      value: "Swing MBR modules only — not a complete plant",
      action: "Do not describe scour as aeration, diffuser, or bubble equipment",
      status: "CLOSED"
    }
  ];

  const modelStatus =
    requiredAreaM2 == null || !selected
      ? "INPUTS / MODULE SELECTION MISSING"
      : "PRELIMINARY MODEL READY FOR ENGINEERING REVIEW";

  return {
    product: "swing" as const,
    documentStatus: "PRELIMINARY — MODULE SELECTION ONLY",
    publicName: "Swing MBR",
    inputs: input,
    sizing: {
      capacityM3d: input.capacityM3d,
      industry: input.industry,
      fluxM3m2d,
      fluxLmh,
      rawRequiredAreaM2: rawArea,
      requiredAreaM2
    },
    matches: (prefer === "auto" && series8.length ? series8 : matches).map(serializeMatch),
    series9Matches: series9.map(serializeMatch),
    selected: selected ? serializeMatch(selected) : null,
    recommended: recommended ? serializeMatch(recommended) : null,
    sales: {
      sku: selected?.spec.sku ?? null,
      moduleCount: selected?.quantity ?? null,
      areaM2: selected?.installedAreaM2 ?? null,
      requiredAreaM2,
      fluxLmh,
      capacityM3d: input.capacityM3d,
      footprint: selected
        ? {
            moduleLxWxH_mm: [selected.spec.lengthMm, selected.spec.widthMm, selected.spec.heightMm],
            quantity: selected.quantity,
            alternativeTankLengthMm: selected.alternativeTankLengthMm,
            topClearanceMm: selected.topClearanceMm,
            note: "Footprint is module envelope × count against the entered tank. Plant layout remains project CAD."
          }
        : null
    },
    assumptions,
    warnings,
    missingFields: missing,
    modelStatus
  };
}

function serializeMatch(match: SwingMatch) {
  return {
    sku: match.spec.sku,
    series: match.spec.series,
    decks: match.spec.decks,
    columns: match.spec.columns,
    areaPerModuleM2: match.spec.areaM2,
    dimensionsMm: {
      length: match.spec.lengthMm,
      width: match.spec.widthMm,
      height: match.spec.heightMm
    },
    filtrateDn: match.spec.filtrateDn,
    airDn: match.spec.airDn,
    scourPerModuleM3h: match.spec.scourAirM3h,
    municipalCapacityM3d: match.spec.municipalCapacityM3d,
    quantity: match.quantity,
    installedAreaM2: match.installedAreaM2,
    totalScourM3h: match.totalScourM3h,
    filtrationM3d: match.filtrationM3d,
    alternativeTankLengthMm: match.alternativeTankLengthMm,
    topClearanceMm: match.topClearanceMm,
    safetyFactor: match.safetyFactor
  };
}

export type SwingResult = ReturnType<typeof sizeSwing>;
