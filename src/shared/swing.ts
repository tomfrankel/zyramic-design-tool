import { swingHardware, type HardwarePack } from "./hardware.js";
import {
  SWING_INDUSTRY_FLUX_M3_M2_D,
  SWING_MODULE_PITCH_MM,
  SWING_MODULES,
  engSku,
  type SwingModuleSpec
} from "./swingCatalog.js";
import type { AssumptionItem, SwingIndustry, SwingInput, WarningItem } from "./types.js";

export const ALPER_CYCLE_AVG_LMH = 12;
export const ALPER_2WIDE_PACK = {
  edgeClearanceMm: 300,
  moduleWidthMm: 700,
  centerAisleMm: 400,
  totalWidthMm: 2400,
  note: "Alper 2-wide pack: 300 + 700 + 400 + 700 + 300 = 2400 mm"
} as const;

export function industryFluxM3m2d(industry: SwingIndustry): number | null {
  return SWING_INDUSTRY_FLUX_M3_M2_D[industry] ?? null;
}

export function fluxLmhFromM3m2d(flux: number): number {
  return (flux * 1000) / 24;
}

export function lmhToM3m2d(lmh: number): number {
  return (lmh * 24) / 1000;
}

/** Replicates Design Tool A6 clamp: min 6.25 m², values between 6.25 and 12.5 become 12.5. */
export function clampRequiredAreaM2(rawM2: number): number {
  if (rawM2 > 6.25) {
    return rawM2 < 12.5 ? 12.5 : rawM2;
  }
  return 6.25;
}

export function requiredAreaFromFluxLmh(capacityM3d: number, fluxLmh: number): number {
  return (capacityM3d / 24) * 1000 / fluxLmh;
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
  pack: "linear" | "alper_2wide";
  rows: number;
  modulesPerRow: number;
  packWidthMm: number;
  minTankLengthMm: number;
}

export function configureLinear(spec: SwingModuleSpec, requiredAreaM2: number, tankHeightMm: number): SwingMatch {
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
    safetyFactor: requiredAreaM2 > 0 ? installedAreaM2 / requiredAreaM2 : 0,
    pack: "linear",
    rows: quantity,
    modulesPerRow: 1,
    packWidthMm: spec.widthMm,
    minTankLengthMm: quantity * SWING_MODULE_PITCH_MM
  };
}

export function configureTwoWide(spec: SwingModuleSpec, requiredAreaM2: number, tankHeightMm: number): SwingMatch {
  const quantity = Math.ceil(requiredAreaM2 / spec.areaM2);
  const evenQty = quantity % 2 === 0 ? quantity : quantity + 1;
  const installedAreaM2 = evenQty * spec.areaM2;
  const rows = evenQty / 2;
  return {
    spec,
    quantity: evenQty,
    installedAreaM2,
    totalScourM3h: evenQty * spec.scourAirM3h,
    filtrationM3d: evenQty * spec.municipalCapacityM3d,
    alternativeTankLengthMm: rows * spec.lengthMm,
    topClearanceMm: tankHeightMm - spec.heightMm,
    safetyFactor: requiredAreaM2 > 0 ? installedAreaM2 / requiredAreaM2 : 0,
    pack: "alper_2wide",
    rows,
    modulesPerRow: 2,
    packWidthMm: ALPER_2WIDE_PACK.totalWidthMm,
    minTankLengthMm: rows * spec.lengthMm
  };
}

export function linearFits(
  match: SwingMatch,
  tankLengthMm: number,
  tankWidthMm: number,
  tankHeightMm: number,
  requiredAreaM2: number
): boolean {
  return (
    match.minTankLengthMm < tankLengthMm + 1 &&
    match.spec.lengthMm < tankWidthMm - 499 &&
    match.spec.heightMm < tankHeightMm - 499 &&
    match.installedAreaM2 > requiredAreaM2 - 0.1 &&
    match.installedAreaM2 < requiredAreaM2 * 1.5
  );
}

export function twoWideFits(
  match: SwingMatch,
  tankLengthMm: number,
  tankWidthMm: number,
  tankHeightMm: number,
  requiredAreaM2: number
): boolean {
  const heightOk = match.spec.heightMm < tankHeightMm && tankHeightMm >= match.spec.heightMm + 400;
  return (
    tankWidthMm + 1 >= ALPER_2WIDE_PACK.totalWidthMm &&
    match.spec.widthMm === ALPER_2WIDE_PACK.moduleWidthMm &&
    heightOk &&
    match.minTankLengthMm <= tankLengthMm + 1 &&
    match.installedAreaM2 >= requiredAreaM2 - 0.1 &&
    match.installedAreaM2 < requiredAreaM2 * 1.55
  );
}

function scoreAlper(match: SwingMatch): number {
  let score = 0;
  if (match.spec.decks === 2.5) score += 100;
  if (match.quantity % 2 === 0) score += 20;
  if (match.safetyFactor >= 1 && match.safetyFactor <= 1.2) score += 30;
  score -= Math.abs(match.safetyFactor - 1.08) * 40;
  score -= match.quantity * 0.4;
  return score;
}

export function sizeSwing(input: SwingInput) {
  const missing: string[] = [];
  const warnings: WarningItem[] = [
    {
      code: "PRELIMINARY",
      severity: "warning",
      message:
        "PRELIMINARY Swing MBR module selection. These are modules, not a complete treatment system."
    }
  ];

  if (!(input.capacityM3d > 0)) missing.push("capacityM3d");
  if (!(input.tankLengthMm > 0)) missing.push("tankLengthMm");
  if (!(input.tankWidthMm > 0)) missing.push("tankWidthMm");
  if (!(input.tankHeightMm > 0)) missing.push("tankHeightMm");

  const fluxMode = input.fluxMode ?? "alper_12_lmh";
  const packMode = input.packMode ?? "alper_2wide";
  const industryFlux = industryFluxM3m2d(input.industry);
  const fluxLmh =
    fluxMode === "alper_12_lmh"
      ? ALPER_CYCLE_AVG_LMH
      : industryFlux != null
        ? fluxLmhFromM3m2d(industryFlux)
        : null;
  const fluxM3m2d =
    fluxMode === "alper_12_lmh"
      ? lmhToM3m2d(ALPER_CYCLE_AVG_LMH)
      : industryFlux;

  if (fluxLmh == null) missing.push("industry");

  const rawArea =
    fluxLmh != null && input.capacityM3d > 0
      ? fluxMode === "alper_12_lmh"
        ? requiredAreaFromFluxLmh(input.capacityM3d, fluxLmh)
        : input.capacityM3d / (fluxM3m2d ?? 1)
      : null;
  const requiredAreaM2 =
    rawArea == null
      ? null
      : fluxMode === "industry_map"
        ? clampRequiredAreaM2(rawArea)
        : rawArea;

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
      : catalog.map((spec) =>
          packMode === "alper_2wide"
            ? configureTwoWide(spec, requiredAreaM2, input.tankHeightMm)
            : configureLinear(spec, requiredAreaM2, input.tankHeightMm)
        );

  const matches = configured.filter((m) =>
    packMode === "alper_2wide"
      ? twoWideFits(m, input.tankLengthMm, input.tankWidthMm, input.tankHeightMm, requiredAreaM2 ?? 0)
      : linearFits(m, input.tankLengthMm, input.tankWidthMm, input.tankHeightMm, requiredAreaM2 ?? 0)
  );

  const series8 = matches.filter((m) => m.spec.series === "8");
  const series9 = matches.filter((m) => m.spec.series === "9");
  const deckPref = input.preferDeck ?? "auto";
  const preferredDeck =
    deckPref === "auto" && packMode === "alper_2wide"
      ? matches.filter((m) => m.spec.series === "8" && m.spec.decks === 2.5)
      : deckPref !== "auto"
        ? matches.filter((m) => m.spec.decks === deckPref)
        : [];
  const recommendedPool =
    preferredDeck.length
      ? preferredDeck
      : prefer === "auto" && series8.length
        ? series8
        : matches;

  const recommended =
    recommendedPool.slice().sort((a, b) => {
      if (packMode === "alper_2wide") return scoreAlper(b) - scoreAlper(a);
      const sf = Math.abs(a.safetyFactor - 1.05) - Math.abs(b.safetyFactor - 1.05);
      if (Math.abs(sf) > 1e-9) return sf;
      return a.quantity - b.quantity;
    })[0] ?? null;

  const selected =
    (input.selectedSku && matches.find((m) => m.spec.sku === input.selectedSku || engSku(m.spec) === input.selectedSku)) ||
    recommended;

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

  if (fluxMode === "alper_12_lmh") {
    warnings.push({
      code: "ALPER_FLUX",
      severity: "info",
      message:
        "Alper flux mode: 12 LMH cycle-average (same Palisade Area@12 basis). Industry map 0.34 m³/m²/d is an alternate mode."
    });
  } else {
    warnings.push({
      code: "SPECIAL_INDUSTRIAL",
      severity: "info",
      message:
        "Industry flux map is a limited menu from the Swing design tool. For special industrial wastewater, provide feed-water quality before treating flux as project-ready."
    });
  }

  if (packMode === "alper_2wide") {
    warnings.push({
      code: "ALPER_PACK",
      severity: "info",
      message: `${ALPER_2WIDE_PACK.note}. Module length runs along tank length. Not project CAD.`
    });
  }

  const assumptions: AssumptionItem[] = [
    {
      id: "S-01",
      topic: "Flux basis",
      basis: fluxMode === "alper_12_lmh" ? "ALPER / PALISADE CYCLE-AVERAGE" : "SWING DESIGN TOOL PRELIMINARY",
      value:
        fluxLmh != null
          ? `${fluxLmh.toFixed(2)} LMH (${fluxM3m2d?.toFixed(3)} m³/m²/d)`
          : "not selected",
      action: "Confirm against project water quality. Do not present as a guaranteed flux.",
      status: "OPEN"
    },
    {
      id: "S-03",
      topic: "Tank pack",
      basis: packMode === "alper_2wide" ? "ALPER 2-WIDE" : "SWING DESIGN TOOL FILTER",
      value:
        packMode === "alper_2wide"
          ? "2 modules side-by-side in ~2400 mm: 300+700+400+700+300. Prefer 2.5-deck when height allows."
          : "Module length < tank width − 499 mm; qty × 1100 mm along length",
      action: "Layout is a budgetary pack, not issued CAD.",
      status: "CLOSED"
    },
    {
      id: "S-04",
      topic: "Scope",
      basis: "PRODUCT RULE",
      value: "Swing MBR modules only — not a complete plant",
      action: "Do not describe scour as aeration, diffuser, or bubble equipment",
      status: "CLOSED"
    },
    {
      id: "S-05",
      topic: "SKU names",
      basis: "NAMING",
      value: "Public SWG-8-*; engineering view also shows EPS8-* (Alper quote naming)",
      action: "Customer-facing copy uses Swing MBR / SWG",
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
    fluxMode,
    packMode,
    sizing: {
      capacityM3d: input.capacityM3d,
      industry: input.industry,
      fluxM3m2d,
      fluxLmh,
      fluxMode,
      rawRequiredAreaM2: rawArea,
      requiredAreaM2
    },
    matches: (prefer === "auto" && series8.length ? series8 : matches).map(serializeMatch),
    series9Matches: series9.map(serializeMatch),
    selected: selected ? serializeMatch(selected) : null,
    recommended: recommended ? serializeMatch(recommended) : null,
    sales: {
      sku: selected?.spec.sku ?? null,
      engSku: selected ? engSku(selected.spec) : null,
      moduleCount: selected?.quantity ?? null,
      areaM2: selected?.installedAreaM2 ?? null,
      requiredAreaM2,
      fluxLmh,
      capacityM3d: input.capacityM3d,
      footprint: selected
        ? {
            moduleLxWxH_mm: [selected.spec.lengthMm, selected.spec.widthMm, selected.spec.heightMm],
            quantity: selected.quantity,
            pack: selected.pack,
            rows: selected.rows,
            modulesPerRow: selected.modulesPerRow,
            packWidthMm: selected.packWidthMm,
            minTankLengthMm: selected.minTankLengthMm,
            topClearanceMm: selected.topClearanceMm,
            note:
              selected.pack === "alper_2wide"
                ? `${ALPER_2WIDE_PACK.note}. ${selected.rows} row(s) × 2. Min tank L ${selected.minTankLengthMm} mm. Project CAD still governs.`
                : "Linear qty × 1100 mm pitch. Plant layout remains project CAD."
          }
        : null,
      hardware: selected ? serializeMatch(selected).hardware : null
    },
    assumptions,
    warnings,
    missingFields: missing,
    modelStatus
  };
}

function matchPack(match: SwingMatch): HardwarePack {
  return {
    mode: match.pack,
    rows: match.rows,
    modulesPerRow: match.modulesPerRow,
    packWidthMm: match.packWidthMm,
    minTankLengthMm: match.minTankLengthMm,
    topClearanceMm: match.topClearanceMm,
    note:
      match.pack === "alper_2wide"
        ? `${ALPER_2WIDE_PACK.note}. ${match.rows} row(s) x 2. Min tank L ${match.minTankLengthMm} mm. Project CAD still governs.`
        : "Linear qty x 1100 mm pitch. Plant layout remains project CAD."
  };
}

function serializeMatch(match: SwingMatch) {
  const hardware = swingHardware(match.spec, match.quantity, matchPack(match));
  return {
    sku: match.spec.sku,
    engSku: engSku(match.spec),
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
    safetyFactor: match.safetyFactor,
    pack: match.pack,
    rows: match.rows,
    modulesPerRow: match.modulesPerRow,
    packWidthMm: match.packWidthMm,
    minTankLengthMm: match.minTankLengthMm,
    uncratedDryWeightKg: match.spec.uncratedDryWeightKg ?? hardware.unitDryWeightKg,
    weightStatus: match.spec.weightStatus ?? hardware.weightStatus,
    dimsStatus: match.spec.dimsStatus ?? hardware.dimsStatus,
    hardware
  };
}

export type SwingResult = ReturnType<typeof sizeSwing>;

export const ARGES_SWING_TANK = {
  tankLengthMm: 12760,
  tankWidthMm: 2400,
  tankHeightMm: 3000
};

export function swingCapacityTable(base: SwingInput, trains: { flowM3d: number; units: number }[]) {
  return trains.map((train) => {
    const unit = sizeSwing({ ...base, capacityM3d: train.flowM3d });
    const qty = unit.selected?.quantity ?? 0;
    const area = unit.selected?.installedAreaM2 ?? 0;
    return {
      flowM3d: train.flowM3d,
      units: train.units,
      requiredAreaM2: unit.sizing.requiredAreaM2,
      sku: unit.selected?.sku ?? null,
      engSku: unit.selected?.engSku ?? null,
      modulesEach: qty,
      areaEachM2: area,
      modulesProject: qty * train.units,
      areaProjectM2: area * train.units,
      pack: unit.selected?.pack ?? null,
      rows: unit.selected?.rows ?? null,
      modelStatus: unit.modelStatus
    };
  });
}
