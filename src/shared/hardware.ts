import palisadeWeights from "./data/palisade-dims-weights.json";
import swingWeights from "./data/swing-dims-weights.json";

export type HardwareFlag = "CONFIRMED" | "ESTIMATED" | "REFERENCE" | "UNKNOWN";

export interface HardwarePack {
  mode: "linear" | "alper_2wide";
  rows: number;
  modulesPerRow: number;
  packWidthMm: number;
  minTankLengthMm: number;
  topClearanceMm: number;
  note: string;
}

export interface HardwareTakeoff {
  sku: string;
  quantity: number;
  unitLengthMm: number | null;
  unitWidthMm: number | null;
  unitHeightMm: number | null;
  unitDims: string;
  dimsUnit: "mm" | "m" | null;
  dimsStatus: HardwareFlag;
  unitDryWeightKg: number | null;
  weightStatus: HardwareFlag;
  totalDryWeightKg: number | null;
  publicNote: string;
  engNote: string;
  pack?: HardwarePack | null;
}

export interface HardwareTableRow {
  sku: string;
  qty: number;
  unitDims: string;
  dimsFlag: HardwareFlag;
  unitWeightKg: string;
  weightFlag: HardwareFlag;
  totalWeightKg: string;
}

export interface HardwareTable {
  rows: HardwareTableRow[];
  footnote: string;
}

type SwingWeightRow = {
  uncratedDryWeightKg?: number | null;
  weightStatus?: string;
  dimsStatus?: string;
  weightNoteEng?: string;
  dimsNoteEng?: string;
};

type PalisadeWeightRow = {
  envelopeM?: number[] | null;
  envelopeStatus?: string;
  envelopeNote?: string;
  unitDryWeightKg?: number | null;
  weightStatus?: string;
  catalogRef?: { sku: string; areaM2: number; dryKg: number; dimsMm: number[] };
};

const swingModuleMap = swingWeights.modules as Record<string, SwingWeightRow>;
const palisadeModuleMap = palisadeWeights.modules as Record<string, PalisadeWeightRow>;

export function formatKg(kg: number | null | undefined): string {
  if (kg == null || Number.isNaN(kg)) return "UNKNOWN";
  const rounded = Math.round(kg * 100) / 100;
  return `${Number(rounded.toString())} kg`;
}

export function formatLxWxH(
  length: number | null | undefined,
  width: number | null | undefined,
  height: number | null | undefined,
  unit: "mm" | "m"
): string {
  if (length == null || width == null || height == null) return "UNKNOWN";
  return `${length} x ${width} x ${height} ${unit}`;
}

export function swingModuleHardware(sku: string): {
  uncratedDryWeightKg: number | null;
  weightStatus: HardwareFlag;
  dimsStatus: HardwareFlag;
  weightNoteEng?: string;
  dimsNoteEng?: string;
} {
  const row = swingModuleMap[sku];
  if (!row) {
    return {
      uncratedDryWeightKg: null,
      weightStatus: "UNKNOWN",
      dimsStatus: sku.startsWith("SWG-") ? "CONFIRMED" : "UNKNOWN"
    };
  }
  return {
    uncratedDryWeightKg: row.uncratedDryWeightKg ?? null,
    weightStatus: (row.weightStatus as HardwareFlag) || "UNKNOWN",
    dimsStatus: (row.dimsStatus as HardwareFlag) || "CONFIRMED",
    weightNoteEng: row.weightNoteEng,
    dimsNoteEng: row.dimsNoteEng
  };
}

export function swingHardware(
  spec: { sku: string; lengthMm: number; widthMm: number; heightMm: number },
  quantity: number,
  pack?: HardwarePack | null
): HardwareTakeoff {
  const row = swingModuleHardware(spec.sku);
  const unit = row.uncratedDryWeightKg;
  const qty = quantity > 0 ? quantity : 0;
  const extraEng = [row.weightNoteEng, row.dimsNoteEng].filter(Boolean).join(" ");
  return {
    sku: spec.sku,
    quantity: qty,
    unitLengthMm: spec.lengthMm,
    unitWidthMm: spec.widthMm,
    unitHeightMm: spec.heightMm,
    unitDims: formatLxWxH(spec.lengthMm, spec.widthMm, spec.heightMm, "mm"),
    dimsUnit: "mm",
    dimsStatus: row.dimsStatus,
    unitDryWeightKg: unit,
    weightStatus: row.weightStatus,
    totalDryWeightKg: unit != null ? Number((unit * qty).toFixed(2)) : null,
    publicNote: swingWeights.publicSource,
    engNote: extraEng ? `${swingWeights.engSource} ${extraEng}` : swingWeights.engSource,
    pack: pack ?? null
  };
}

export function palisadeHardware(sku: "PAL-130" | "PAL-260" | string, quantity: number): HardwareTakeoff {
  const row = palisadeModuleMap[sku];
  const env = row?.envelopeM ?? null;
  const unit = row?.unitDryWeightKg ?? null;
  const qty = quantity > 0 ? quantity : 0;
  const dimsStatus = (row?.envelopeStatus as HardwareFlag) || "UNKNOWN";
  const catalog = row?.catalogRef;
  const engCatalog = catalog
    ? ` Catalog equivalent ${catalog.sku} ${catalog.dryKg} kg @ ${catalog.areaM2} m2, area-scaled.`
    : "";
  return {
    sku,
    quantity: qty,
    unitLengthMm: env ? Math.round(env[0] * 1000) : null,
    unitWidthMm: env ? Math.round(env[1] * 1000) : null,
    unitHeightMm: env ? Math.round(env[2] * 1000) : null,
    unitDims: env ? formatLxWxH(env[0], env[1], env[2], "m") : "UNKNOWN",
    dimsUnit: env ? "m" : null,
    dimsStatus,
    unitDryWeightKg: unit,
    weightStatus: (row?.weightStatus as HardwareFlag) || "UNKNOWN",
    totalDryWeightKg: unit != null ? Number((unit * qty).toFixed(2)) : null,
    publicNote: palisadeWeights.publicSource,
    engNote: `${palisadeWeights.engSource}${engCatalog}${row?.envelopeNote ? ` ${row.envelopeNote}` : ""}`
  };
}

export function hardwareTableRows(items: HardwareTakeoff[]): HardwareTableRow[] {
  return items.map((h) => ({
    sku: h.sku,
    qty: h.quantity,
    unitDims: h.unitDims,
    dimsFlag: h.dimsStatus,
    unitWeightKg: formatKg(h.unitDryWeightKg),
    weightFlag: h.weightStatus,
    totalWeightKg: formatKg(h.totalDryWeightKg)
  }));
}

export function hardwareFootnote(items: HardwareTakeoff[], role: string): string {
  const unique = [...new Set(items.map((h) => (role === "customer" ? h.publicNote : h.engNote)))];
  return unique.join(" ");
}

export function buildHardwareTable(items: HardwareTakeoff[], role: string): HardwareTable {
  return {
    rows: hardwareTableRows(items),
    footnote: hardwareFootnote(items, role)
  };
}

export const SWING_CARTRIDGE_DRY_KG = swingWeights.cartridgeDryKg;
export const SWING_WEIGHT_PUBLIC_SOURCE = swingWeights.publicSource;
export const SWING_WEIGHT_ENG_SOURCE = swingWeights.engSource;
export const PALISADE_WEIGHT_PUBLIC_SOURCE = palisadeWeights.publicSource;
export const PALISADE_WEIGHT_ENG_SOURCE = palisadeWeights.engSource;
export const PALISADE_PLATE_MM = palisadeWeights.plateMm;
export const PALISADE_CONNECTIONS = palisadeWeights.connections;
