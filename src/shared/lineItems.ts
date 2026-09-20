import type { LineItem } from "./types.js";
import type { PalisadeResult } from "./palisade.js";
import type { SwingResult } from "./swing.js";

/** Alper Attachment-3 budgetary stub. Not a Zyramic list price. */
export const ALPER_SWING_BUDGETARY_USD_PER_M2 = 30;

export interface CommercialFlags {
  swingOemUsdPerM2?: number | null;
  palisadeUsdPerM2?: number | null;
  sellMarginPct?: number | null;
}

export function applySellMargin(cost: number | null, marginPct: number | null): number | null {
  if (cost == null || marginPct == null || Number.isNaN(marginPct)) return null;
  return Number((cost * (1 + marginPct / 100)).toFixed(2));
}

function withMargin(item: LineItem, marginPct: number | null): LineItem {
  const cost = item.costUnitPrice ?? item.unitPrice;
  const sellUnit = applySellMargin(cost, marginPct);
  const sellExt =
    sellUnit != null ? Number((sellUnit * item.qty).toFixed(2)) : applySellMargin(item.extendedPrice, marginPct);
  return {
    ...item,
    costUnitPrice: cost,
    sellUnitPrice: sellUnit,
    sellExtendedPrice: sellExt,
    marginPct: cost != null ? marginPct : null,
    unitPrice: sellUnit ?? item.unitPrice,
    extendedPrice: sellExt ?? item.extendedPrice
  };
}

export function palisadeLineItems(result: PalisadeResult, flags: CommercialFlags = {}): LineItem[] {
  const sku = result.selectedModule?.sku ?? "PAL-TBD";
  const qty = result.selectedModule?.moduleCount ?? 0;
  const area = result.selectedModule?.installedAreaM2 ?? 0;
  const palPrice = flags.palisadeUsdPerM2;
  const items: LineItem[] = [
    {
      sku,
      description: `Palisade ${result.selectedModule?.plates ?? "—"}-plate module`,
      qty,
      unit: "module",
      unitPrice: null,
      extendedPrice: null,
      flag: "UNKNOWN",
      note: "Palisade fabrication price TBD — no published fab price is used in this draft.",
      commercialOnly: true
    },
    {
      sku: "LABOR-INSTALL",
      description: "Installation / field labor",
      qty: 1,
      unit: "lot",
      unitPrice: null,
      extendedPrice: null,
      flag: "TBD",
      note: "Labor TBD. Do not invent a man-hour or crew rate.",
      commercialOnly: true
    },
    {
      sku: "PAL-FAB-US",
      description: "Palisade US fabrication",
      qty: 1,
      unit: "lot",
      unitPrice: null,
      extendedPrice: null,
      flag: "TBD",
      note: "Palisade fab TBD.",
      commercialOnly: true
    }
  ];
  if (area > 0) {
    items.push({
      sku: "PAL-AREA",
      description: "Installed membrane area (takeoff)",
      qty: Number(area.toFixed(2)),
      unit: "m²",
      unitPrice: palPrice ?? null,
      extendedPrice: palPrice != null ? Number((palPrice * area).toFixed(2)) : null,
      costUnitPrice: palPrice ?? null,
      flag: palPrice != null ? "OEM_ESTIMATE_STUB" : "UNKNOWN",
      note:
        palPrice != null
          ? "Optional Palisade stub only. Not a list price."
          : "Area takeoff only. Palisade commercial remains UNKNOWN unless a stub is provided.",
      commercialOnly: true
    });
  }
  return items.map((i) => withMargin(i, flags.sellMarginPct ?? null));
}

export function swingLineItems(result: SwingResult, flags: CommercialFlags = {}): LineItem[] {
  const sku = result.selected?.sku ?? "SWG-TBD";
  const eng = result.selected?.engSku;
  const qty = result.selected?.quantity ?? 0;
  const area = result.selected?.installedAreaM2 ?? 0;
  const oem = flags.swingOemUsdPerM2 ?? ALPER_SWING_BUDGETARY_USD_PER_M2;
  const items: LineItem[] = [
    {
      sku,
      description: `Swing MBR module${eng ? ` (${eng})` : ""}`,
      qty,
      unit: "module",
      unitPrice: null,
      extendedPrice: null,
      flag: "UNKNOWN",
      note: "US Swing fabrication TBD. No invented US fab price.",
      commercialOnly: true
    },
    {
      sku: "LABOR-INSTALL",
      description: "Installation / field labor",
      qty: 1,
      unit: "lot",
      unitPrice: null,
      extendedPrice: null,
      flag: "TBD",
      note: "Labor TBD.",
      commercialOnly: true
    },
    {
      sku: "SWG-FAB-US",
      description: "US Swing fabrication",
      qty: 1,
      unit: "lot",
      unitPrice: null,
      extendedPrice: null,
      flag: "TBD",
      note: "US Swing fab TBD.",
      commercialOnly: true
    }
  ];

  if (area > 0 && oem > 0) {
    items.push({
      sku: "SWG-OEM-EST-STUB",
      description: "Budgetary Swing module stub (Alper Attachment-3)",
      qty: Number(area.toFixed(2)),
      unit: "m²",
      unitPrice: oem,
      extendedPrice: Number((oem * area).toFixed(2)),
      costUnitPrice: oem,
      flag: "OEM_ESTIMATE_STUB",
      note: `$${oem}/m² STUB/OEM budgetary screening — not a customer list price, not US fab, not a warranty.`,
      commercialOnly: true
    });
  }

  return items.map((i) => withMargin(i, flags.sellMarginPct ?? null));
}

export function stripCommercialSecrets(items: LineItem[]): LineItem[] {
  return items.map((i) => ({
    ...i,
    unitPrice: null,
    extendedPrice: null,
    costUnitPrice: null,
    sellUnitPrice: null,
    sellExtendedPrice: null,
    marginPct: null,
    note: "Pricing hidden in the sizing zone."
  }));
}

export function unknownCommercialTerms() {
  return {
    warranty: { value: null, flag: "UNKNOWN" as const, note: "No warranty term is published in this draft. Do not invent one." },
    leadTime: { value: null, flag: "UNKNOWN" as const, note: "No lead time is published in this draft. Do not invent one." },
    freight: { value: null, flag: "TBD" as const, note: "Freight TBD." },
    taxes: { value: null, flag: "TBD" as const, note: "Taxes / duties TBD." }
  };
}
