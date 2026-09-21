/**
 * Ceramic / SiC sizing — separate product path from Palisade and Swing.
 * Source TDS filed by Product Design:
 * Dropbox Proposal Software/01-Source-Reference/Semicorex-SiC/
 */
import tds from "./data/ceramic-sic-tds.json";
import { formatLxWxH, type HardwareTakeoff } from "./hardware.js";
import type { AssumptionItem, CeramicSicInput, WarningItem } from "./types.js";

export const CERAMIC_SIC_BASIS = {
  apiProduct: "ceramic_sic" as const,
  publicName: tds.publicName,
  documentStatus: tds.documentStatus,
  sheet: tds.sheet,
  module: tds.module,
  tower: tds.tower,
  municipalDesignFluxLmh: tds.designOperatingFluxLmh.municipal_ww_mbr,
  publicSource: tds.publicSource,
  engSource: tds.engSource
} as const;

export function ceramicCapacityPerModuleM3d(fluxLmh: number): number {
  return fluxLmh * (24 / 1000) * CERAMIC_SIC_BASIS.module.areaM2;
}

export function ceramicRequiredAreaM2(capacityM3d: number, fluxLmh: number): number {
  return (capacityM3d / 24) * (1000 / fluxLmh);
}

export function ceramicModuleCount(capacityM3d: number, fluxLmh: number): number {
  const per = CERAMIC_SIC_BASIS.module.areaM2;
  return Math.ceil(ceramicRequiredAreaM2(capacityM3d, fluxLmh) / per);
}

function ceramicHardware(quantity: number): HardwareTakeoff {
  const spec = CERAMIC_SIC_BASIS.module;
  const qty = quantity > 0 ? quantity : 0;
  return {
    sku: spec.sku,
    quantity: qty,
    unitLengthMm: spec.lengthMm,
    unitWidthMm: spec.widthMm,
    unitHeightMm: spec.heightMm,
    unitDims: formatLxWxH(spec.lengthMm, spec.widthMm, spec.heightMm, "mm"),
    dimsUnit: "mm",
    dimsStatus: "CONFIRMED",
    unitDryWeightKg: spec.uncratedDryWeightKg,
    weightStatus: "CONFIRMED",
    totalDryWeightKg: Number((spec.uncratedDryWeightKg * qty).toFixed(2)),
    publicNote: CERAMIC_SIC_BASIS.publicSource,
    engNote: CERAMIC_SIC_BASIS.engSource
  };
}

export function sizeCeramicSic(input: CeramicSicInput) {
  const missing: string[] = [];
  const warnings: WarningItem[] = [
    {
      code: "PRELIMINARY",
      severity: "warning",
      message:
        "PRELIMINARY Ceramic / SiC module sizing from the product TDS. Separate from Palisade and Swing. Not a complete treatment system."
    },
    {
      code: "PRICE_HELD",
      severity: "info",
      message: "Pricing and full website SKUs are HELD / UNKNOWN."
    }
  ];

  if (!(input.capacityM3d > 0)) missing.push("capacityM3d");

  const application = input.application ?? "municipal_ww_mbr";
  const fluxLmh =
    application === "municipal_ww_mbr" ? CERAMIC_SIC_BASIS.municipalDesignFluxLmh : null;

  if (fluxLmh == null) {
    missing.push("designOperatingFluxLmh");
    warnings.push({
      code: "FLUX_HELD",
      severity: "warning",
      message:
        "Only municipal WW MBR design operating flux (60 LMH) is published in this stub. Other applications stay UNKNOWN until the TDS table is filed."
    });
  } else {
    warnings.push({
      code: "DESIGN_FLUX",
      severity: "info",
      message:
        "Municipal WW MBR design operating flux is 60 LMH (engineering, not peak pure-water flux). Do not size on peak clean-water flux."
    });
  }

  const requiredAreaM2 =
    fluxLmh != null && input.capacityM3d > 0 ? ceramicRequiredAreaM2(input.capacityM3d, fluxLmh) : null;
  const moduleCount =
    fluxLmh != null && input.capacityM3d > 0 ? ceramicModuleCount(input.capacityM3d, fluxLmh) : null;
  const installedAreaM2 =
    moduleCount != null ? moduleCount * CERAMIC_SIC_BASIS.module.areaM2 : null;
  const capacityEachM3d = fluxLmh != null ? ceramicCapacityPerModuleM3d(fluxLmh) : null;
  const maxStack = CERAMIC_SIC_BASIS.tower.maxModulesStacked;
  const towers =
    moduleCount != null && moduleCount > 0 ? Math.ceil(moduleCount / maxStack) : null;
  const stackNote =
    moduleCount != null && towers != null
      ? `${towers} tower(s), max ${maxStack} modules stacked. Skids custom — not project CAD.`
      : "Tower / skid layout UNKNOWN until module count is known. Skids custom.";

  if (moduleCount != null && moduleCount > maxStack) {
    warnings.push({
      code: "TOWER_SPLIT",
      severity: "info",
      message: `Selection exceeds one ${maxStack}-module stack. ${stackNote}`
    });
  }

  const hardware = ceramicHardware(moduleCount ?? 0);
  const modelStatus =
    requiredAreaM2 == null || moduleCount == null
      ? "INPUTS / MODULE SELECTION MISSING"
      : "PRELIMINARY MODEL READY FOR ENGINEERING REVIEW";

  const assumptions: AssumptionItem[] = [
    {
      id: "C-01",
      topic: "Design operating flux",
      basis: "TDS ENGINEERING — NOT PEAK",
      value: fluxLmh != null ? `${fluxLmh} LMH municipal WW MBR` : "UNKNOWN — application held",
      action: "Do not substitute peak pure-water flux for design flux.",
      status: fluxLmh != null ? "CLOSED" : "OPEN"
    },
    {
      id: "C-02",
      topic: "Module",
      basis: "TDS",
      value: `${CERAMIC_SIC_BASIS.module.sku}: ${CERAMIC_SIC_BASIS.module.sheets} sheets, ${CERAMIC_SIC_BASIS.module.areaM2} m2, ${CERAMIC_SIC_BASIS.module.lengthMm}x${CERAMIC_SIC_BASIS.module.widthMm}x${CERAMIC_SIC_BASIS.module.heightMm} mm, ${CERAMIC_SIC_BASIS.module.uncratedDryWeightKg} kg dry`,
      action: "Confirm housing and spacing against the filed TDS.",
      status: "CLOSED"
    },
    {
      id: "C-03",
      topic: "Tower",
      basis: "TDS",
      value: `Up to ${maxStack} modules stacked. Skids custom.`,
      action: "Do not invent a standard skid.",
      status: "CLOSED"
    },
    {
      id: "C-04",
      topic: "Scope",
      basis: "PRODUCT RULE",
      value: "Ceramic / SiC modules only — never mix with Palisade or Swing on the same public page or PDF section.",
      action: "Customer-facing copy uses Ceramic / SiC. Supplier brand stays off the customer PDF.",
      status: "CLOSED"
    },
    {
      id: "C-05",
      topic: "Price / website SKU",
      basis: "HELD",
      value: "UNKNOWN",
      action: "Do not invent a list price or extra website SKUs.",
      status: "OPEN"
    }
  ];

  return {
    product: "ceramic_sic" as const,
    documentStatus: CERAMIC_SIC_BASIS.documentStatus,
    publicName: CERAMIC_SIC_BASIS.publicName,
    inputs: input,
    sizing: {
      capacityM3d: input.capacityM3d,
      application,
      designFluxLmh: fluxLmh,
      requiredAreaM2,
      moduleCount,
      installedAreaM2,
      capacityEachM3d,
      sheetSku: CERAMIC_SIC_BASIS.sheet.sku,
      sheetAreaM2: CERAMIC_SIC_BASIS.sheet.areaM2,
      sheetPoreNm: CERAMIC_SIC_BASIS.sheet.poreNm,
      moduleSku: CERAMIC_SIC_BASIS.module.sku,
      areaPerModuleM2: CERAMIC_SIC_BASIS.module.areaM2,
      sheetsPerModule: CERAMIC_SIC_BASIS.module.sheets,
      housing: CERAMIC_SIC_BASIS.module.housing,
      sheetSpacingMm: CERAMIC_SIC_BASIS.module.sheetSpacingMm,
      sheetSpacingAdjMm: CERAMIC_SIC_BASIS.module.sheetSpacingAdjMm,
      maxSuctionBar: CERAMIC_SIC_BASIS.module.maxSuctionBar,
      maxBackwashBar: CERAMIC_SIC_BASIS.module.maxBackwashBar,
      tempC: CERAMIC_SIC_BASIS.module.tempC,
      towers,
      maxModulesStacked: maxStack,
      skids: CERAMIC_SIC_BASIS.tower.skids,
      stackNote
    },
    sales: {
      sku: CERAMIC_SIC_BASIS.module.sku,
      moduleCount,
      areaM2: installedAreaM2,
      fluxLmh,
      capacityM3d: input.capacityM3d,
      hardware
    },
    assumptions,
    warnings,
    missingFields: missing,
    modelStatus
  };
}

export type CeramicSicResult = ReturnType<typeof sizeCeramicSic>;
