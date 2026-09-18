import type { Role } from "./roles.js";

export type ProductFamily = "palisade" | "swing";

export type StatusTag =
  | "CONFIRMED"
  | "CALCULATED"
  | "ENGINEER INPUT"
  | "ENGINEERING ASSUMPTION"
  | "PRELIMINARY"
  | "VALIDATION REQUIRED"
  | "SCIENTIFICALLY ESTABLISHED"
  | "OUT OF SCOPE"
  | "UNKNOWN"
  | "TBD";

export interface FieldNote {
  id: string;
  label: string;
  value: string | number | null;
  unit?: string;
  status: StatusTag;
  note?: string;
}

export interface WarningItem {
  code: string;
  severity: "info" | "warning" | "block";
  message: string;
}

export interface AssumptionItem {
  id: string;
  topic: string;
  basis: string;
  value: string;
  action: string;
  status: "OPEN" | "CLOSED";
}

export interface LineItem {
  sku: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number | null;
  extendedPrice: number | null;
  flag: "priced" | "UNKNOWN" | "TBD" | "OEM_ESTIMATE_STUB";
  note: string;
  commercialOnly: boolean;
}

export interface PalisadeInput {
  projectName?: string;
  siteLocation?: string;
  application?: string;
  designer?: string;
  date?: string;
  averageFeedM3d?: number | null;
  designFeedM3d?: number | null;
  peakFeedM3d?: number | null;
  targetPermeateM3d?: number | null;
  recoveryPct?: number | null;
  codMgL?: number | null;
  bod5MgL?: number | null;
  tssMgL?: number | null;
  nh4nMgL?: number | null;
  ph?: number | null;
  oilGreaseMgL?: number | null;
  tnMgL?: number | null;
  tpMgL?: number | null;
  hardnessMgL?: number | null;
  silicaMgL?: number | null;
  mlssMgL?: number | null;
  mlvssMgL?: number | null;
  srtD?: number | null;
  minTemperatureC?: number | null;
  onPeriodFluxLmh?: number;
  cycleOnMin?: number;
  cycleRelaxMin?: number;
  tmpLimitKpa?: number;
  actualTmpKpa?: number | null;
  selectedModulePlates?: 130 | 260 | null;
  submergenceM?: number | null;
  pipeLossKpa?: number | null;
  fittingsLossKpa?: number | null;
  headerLossKpa?: number | null;
  moduleLossKpa?: number | null;
  targetWaterQuality?: string;
}

export interface SwingInput {
  projectName?: string;
  siteLocation?: string;
  capacityM3d: number;
  tankLengthMm: number;
  tankWidthMm: number;
  tankHeightMm: number;
  industry: SwingIndustry;
  selectedSku?: string | null;
  preferSeries?: "8" | "9" | "auto";
}

export type SwingIndustry =
  | "Domestic and Municipal"
  | "Food and Beverage"
  | "Textile Printing and Dyeing"
  | "Pharmaceuticals"
  | "Slaughter"
  | "Aquaculture"
  | "Garbage Leachate";

export interface SessionUser {
  role: Role;
  label: string;
}

export interface PersistPayload {
  projectId: string;
  product: ProductFamily;
  rfq: Record<string, unknown>;
  selection: Record<string, unknown>;
  includePricing: boolean;
}
