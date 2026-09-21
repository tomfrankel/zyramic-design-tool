import { buildHardwareTable } from "./hardware.js";
import { palisadeCapacityTable, type PalisadeResult } from "./palisade.js";
import { swingCapacityTable, type SwingResult } from "./swing.js";
import { palisadeLineItems, swingLineItems, unknownCommercialTerms, type CommercialFlags } from "./lineItems.js";
import type { CapacityRow, ProposalPdfInput } from "./pdf.js";
import type { PalisadeInput, SwingInput } from "./types.js";

function isCustomerRole(role: string): boolean {
  return role === "customer";
}

function withoutBlockedPublicNames<T extends { topic?: string; value?: string; message?: string; action?: string }>(
  items: T[]
): T[] {
  return items.filter((item) => {
    const blob = `${item.topic || ""} ${item.value || ""} ${item.message || ""} ${item.action || ""}`;
    return !/EPS8|EPSMEM|OmniScour|On-Board Scour|Thermo Fisher|Liren|Henry|Qianli|Jiaxing|aeration|diffuser|bubble/i.test(blob);
  });
}

function hardwareSummary(hw: PalisadeResult["sales"]["hardware"] | SwingResult["sales"]["hardware"]) {
  if (!hw) {
    return [
      { label: "Unit LxWxH", value: "—" },
      { label: "Unit dry weight", value: "—" },
      { label: "Total installed dry weight", value: "—" }
    ];
  }
  return [
    { label: "Unit LxWxH", value: `${hw.unitDims} [${hw.dimsStatus}]` },
    {
      label: "Unit dry weight",
      value: hw.unitDryWeightKg != null ? `${hw.unitDryWeightKg} kg [${hw.weightStatus}]` : `UNKNOWN [${hw.weightStatus}]`
    },
    {
      label: "Total installed dry weight",
      value:
        hw.totalDryWeightKg != null
          ? `${hw.totalDryWeightKg} kg [${hw.weightStatus}]`
          : `UNKNOWN [${hw.weightStatus}]`
    }
  ];
}

export function palisadeCapacityRows(input: PalisadeInput): CapacityRow[] {
  return palisadeCapacityTable(input, input.trains).map((r) => ({
    flowM3d: r.flowM3d,
    units: r.units,
    requiredAreaM2: r.requiredAreaM2,
    sku: r.sku,
    modulesEach: r.modulesEach,
    areaEachM2: r.areaEachM2,
    modulesProject: r.modulesProject,
    areaProjectM2: r.areaProjectM2
  }));
}

export function swingCapacityRows(input: SwingInput): CapacityRow[] {
  const trains = input.trains?.length ? input.trains : [{ flowM3d: input.capacityM3d, units: 1 }];
  return swingCapacityTable(input, trains).map((r) => ({
    flowM3d: r.flowM3d,
    units: r.units,
    requiredAreaM2: r.requiredAreaM2,
    sku: r.sku,
    engSku: r.engSku,
    modulesEach: r.modulesEach,
    areaEachM2: r.areaEachM2,
    modulesProject: r.modulesProject,
    areaProjectM2: r.areaProjectM2
  }));
}

export function palisadeProposal(
  result: PalisadeResult,
  opts: {
    role: string;
    includePricing: boolean;
    flags?: CommercialFlags;
    logoBytes?: Uint8Array | null;
    headerLogoBytes?: Uint8Array | null;
    cutsheetBytes?: Uint8Array | null;
  }
): ProposalPdfInput {
  const input = result.inputs;
  const terms = unknownCommercialTerms();
  return {
    logoBytes: opts.logoBytes,
    headerLogoBytes: opts.headerLogoBytes,
    cutsheetBytes: opts.cutsheetBytes,
    projectName: input.projectName || "Palisade draft",
    siteLocation: input.siteLocation,
    application: input.application,
    product: "Palisade",
    role: opts.role,
    includePricing: opts.includePricing,
    sellMarginPct: opts.flags?.sellMarginPct ?? null,
    modelStatus: result.modelStatus,
    documentStatus: result.documentStatus,
    summaryRows: [
      { label: "SKU", value: String(result.sales.sku ?? "-") },
      { label: "Modules", value: String(result.sales.moduleCount ?? "-") },
      { label: "Installed area", value: result.sales.areaM2 != null ? `${result.sales.areaM2.toFixed(1)} m²` : "—" },
      { label: "ON-period flux", value: `${result.sales.fluxLmh} LMH` },
      { label: "Cycle-average flux", value: `${result.sales.cycleAverageFluxLmh} LMH` },
      { label: "Required area (Area@12)", value: result.sizing.requiredAreaM2 != null ? `${result.sizing.requiredAreaM2.toFixed(2)} m²` : "—" },
      { label: "TCF (check only)", value: result.sizing.temperatureCorrectionFactor != null ? result.sizing.temperatureCorrectionFactor.toFixed(3) : "—" },
      { label: "Tank height", value: result.sizing.tankHeightM != null ? `${result.sizing.tankHeightM} m` : "—" },
      { label: "Capacity", value: result.sales.capacityM3d != null ? `${result.sales.capacityM3d} m³/d` : "—" },
      { label: "Total scour", value: result.scour.totalScourScfm != null ? `${result.scour.totalScourScfm} SCFM` : "—" },
      ...hardwareSummary(result.sales.hardware),
      { label: "Footprint", value: result.footprint.note }
    ],
    hardwareTable: result.sales.hardware ? buildHardwareTable([result.sales.hardware], opts.role) : undefined,
    capacityTable: input.trains?.length ? palisadeCapacityRows(input) : undefined,
    assumptions: isCustomerRole(opts.role) ? withoutBlockedPublicNames(result.assumptions) : result.assumptions,
    warnings: (isCustomerRole(opts.role) ? withoutBlockedPublicNames(result.warnings) : result.warnings).map((w) => w.message),
    missingFields: result.missingFields,
    lineItems: opts.includePricing ? palisadeLineItems(result, opts.flags) : undefined,
    commercialTerms: opts.includePricing
      ? { warranty: terms.warranty.note, leadTime: terms.leadTime.note }
      : undefined,
    narrative: [
      "Alper acceptance: Area = Q / 12 LMH cycle-average. Cold TCF is check-only and does not change module count.",
      "Prefer PAL-130 when tank height ≤ ~3.00 m. PAL-260 is blocked below the 3.05 m published envelope."
    ]
  };
}

export function swingProposal(
  result: SwingResult,
  opts: {
    role: string;
    includePricing: boolean;
    flags?: CommercialFlags;
    logoBytes?: Uint8Array | null;
    headerLogoBytes?: Uint8Array | null;
    cutsheetBytes?: Uint8Array | null;
    shippingFigureBytes?: Uint8Array | null;
  }
): ProposalPdfInput {
  const input = result.inputs;
  const terms = unknownCommercialTerms();
  return {
    logoBytes: opts.logoBytes,
    headerLogoBytes: opts.headerLogoBytes,
    cutsheetBytes: opts.cutsheetBytes,
    shippingFigureBytes: opts.shippingFigureBytes,
    projectName: input.projectName || "Swing MBR draft",
    siteLocation: input.siteLocation,
    product: "Swing MBR",
    role: opts.role,
    includePricing: opts.includePricing,
    sellMarginPct: opts.flags?.sellMarginPct ?? null,
    modelStatus: result.modelStatus,
    documentStatus: result.documentStatus,
    summaryRows: [
      { label: "SKU", value: String(result.sales.sku ?? "-") },
      ...(isCustomerRole(opts.role)
        ? []
        : [{ label: "Engineering SKU", value: String(result.sales.engSku ?? "-") }]),
      { label: "Modules", value: String(result.sales.moduleCount ?? "-") },
      { label: "Installed area", value: result.sales.areaM2 != null ? `${result.sales.areaM2.toFixed(1)} m²` : "—" },
      { label: "Flux mode", value: result.fluxMode },
      { label: "Flux", value: result.sales.fluxLmh != null ? `${result.sales.fluxLmh.toFixed(2)} LMH` : "—" },
      { label: "Pack", value: result.packMode },
      { label: "Capacity", value: `${result.sales.capacityM3d} m³/d` },
      ...hardwareSummary(result.sales.hardware),
      { label: "Footprint", value: result.sales.footprint?.note || "—" }
    ],
    hardwareTable: result.sales.hardware ? buildHardwareTable([result.sales.hardware], opts.role) : undefined,
    capacityTable: input.trains?.length
      ? swingCapacityRows(input).map((r) =>
          isCustomerRole(opts.role) ? { ...r, engSku: undefined } : r
        )
      : undefined,
    assumptions: isCustomerRole(opts.role) ? withoutBlockedPublicNames(result.assumptions) : result.assumptions,
    warnings: (isCustomerRole(opts.role) ? withoutBlockedPublicNames(result.warnings) : result.warnings).map((w) => w.message),
    missingFields: result.missingFields,
    lineItems: opts.includePricing ? swingLineItems(result, opts.flags) : undefined,
    commercialTerms: opts.includePricing
      ? { warranty: terms.warranty.note, leadTime: terms.leadTime.note }
      : undefined,
    narrative: [
      "Alper flux mode uses 12 LMH cycle-average (same Palisade Area@12). Industry 0.34 m³/m²/d remains an alternate labeled mode.",
      "Prefer 2.5-deck when tank height allows (~2160 mm module in ~3000 mm tank). 2-wide pack is 300+700+400+700+300 mm."
    ]
  };
}
