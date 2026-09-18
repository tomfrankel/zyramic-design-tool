import type { LineItem } from "./types.js";
import type { PalisadeResult } from "./palisade.js";
import type { SwingResult } from "./swing.js";

export interface CommercialFlags {
  swingOemUsdPerM2?: number | null;
}

export function palisadeLineItems(result: PalisadeResult, flags: CommercialFlags = {}): LineItem[] {
  const sku = result.selectedModule?.sku ?? "PAL-TBD";
  const qty = result.selectedModule?.moduleCount ?? 0;
  const area = result.selectedModule?.installedAreaM2 ?? 0;
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
      unitPrice: null,
      extendedPrice: null,
      flag: "UNKNOWN",
      note: "Area takeoff only. Not a price.",
      commercialOnly: true
    });
  }
  void flags;
  return items;
}

export function swingLineItems(result: SwingResult, flags: CommercialFlags = {}): LineItem[] {
  const sku = result.selected?.sku ?? "SWG-TBD";
  const qty = result.selected?.quantity ?? 0;
  const area = result.selected?.installedAreaM2 ?? 0;
  const items: LineItem[] = [
    {
      sku,
      description: "Swing MBR module",
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

  const oem = flags.swingOemUsdPerM2;
  if (oem != null && oem > 0 && area > 0) {
    items.push({
      sku: "SWG-OEM-EST-STUB",
      description: "Optional Chinese OEM estimate stub (not a customer price)",
      qty: Number(area.toFixed(2)),
      unit: "m²",
      unitPrice: oem,
      extendedPrice: Number((oem * area).toFixed(2)),
      flag: "OEM_ESTIMATE_STUB",
      note: "Environment stub only. Screening estimate — not a quote, not a warranty, not US fab.",
      commercialOnly: true
    });
  } else {
    items.push({
      sku: "SWG-OEM-EST-STUB",
      description: "Optional Chinese OEM estimate stub",
      qty: Number(area.toFixed(2)),
      unit: "m²",
      unitPrice: null,
      extendedPrice: null,
      flag: "UNKNOWN",
      note: "Set SWING_OEM_ESTIMATE_USD_PER_M2 to enable the screening stub. Blank = unknown.",
      commercialOnly: true
    });
  }
  return items;
}

export function unknownCommercialTerms() {
  return {
    warranty: { value: null, flag: "UNKNOWN" as const, note: "No warranty term is published in this draft. Do not invent one." },
    leadTime: { value: null, flag: "UNKNOWN" as const, note: "No lead time is published in this draft. Do not invent one." },
    freight: { value: null, flag: "TBD" as const, note: "Freight TBD." },
    taxes: { value: null, flag: "TBD" as const, note: "Taxes / duties TBD." }
  };
}
