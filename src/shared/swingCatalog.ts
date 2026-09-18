export interface SwingModuleSpec {
  sku: string;
  series: "8" | "9";
  decks: number;
  columns: number;
  areaM2: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  filtrateDn: string;
  airDn: string;
  scourAirM3h: number;
  municipalCapacityM3d: number;
}

/** Public Swing SKUs. Geometry and scour values come from the Swing design-tool Database sheet. */
export const SWING_MODULES: SwingModuleSpec[] = [
  { sku: "SWG-8-0.5-1", series: "8", decks: 0.5, columns: 1, areaM2: 6.25, lengthMm: 500, widthMm: 700, heightMm: 900, filtrateDn: "DN15", airDn: "DN25", scourAirM3h: 10, municipalCapacityM3d: 2.1875 },
  { sku: "SWG-8-1-1", series: "8", decks: 1, columns: 1, areaM2: 12.5, lengthMm: 500, widthMm: 700, heightMm: 1230, filtrateDn: "DN25", airDn: "DN25", scourAirM3h: 10, municipalCapacityM3d: 4.375 },
  { sku: "SWG-8-1-2", series: "8", decks: 1, columns: 2, areaM2: 25, lengthMm: 750, widthMm: 700, heightMm: 1230, filtrateDn: "DN32", airDn: "DN32", scourAirM3h: 20, municipalCapacityM3d: 8.75 },
  { sku: "SWG-8-1-3", series: "8", decks: 1, columns: 3, areaM2: 37.5, lengthMm: 1000, widthMm: 700, heightMm: 1230, filtrateDn: "DN32", airDn: "DN32", scourAirM3h: 30, municipalCapacityM3d: 13.125 },
  { sku: "SWG-8-1-4", series: "8", decks: 1, columns: 4, areaM2: 50, lengthMm: 1250, widthMm: 700, heightMm: 1230, filtrateDn: "DN32", airDn: "DN40", scourAirM3h: 40, municipalCapacityM3d: 17.5 },
  { sku: "SWG-8-1-5", series: "8", decks: 1, columns: 5, areaM2: 62.5, lengthMm: 1500, widthMm: 700, heightMm: 1230, filtrateDn: "DN32", airDn: "DN40", scourAirM3h: 50, municipalCapacityM3d: 21.875 },
  { sku: "SWG-8-1-6", series: "8", decks: 1, columns: 6, areaM2: 75, lengthMm: 1750, widthMm: 700, heightMm: 1230, filtrateDn: "DN32", airDn: "DN50", scourAirM3h: 60, municipalCapacityM3d: 26.25 },
  { sku: "SWG-8-1.5-1", series: "8", decks: 1.5, columns: 1, areaM2: 18.75, lengthMm: 500, widthMm: 700, heightMm: 1570, filtrateDn: "DN32", airDn: "DN32", scourAirM3h: 11, municipalCapacityM3d: 6.5625 },
  { sku: "SWG-8-1.5-2", series: "8", decks: 1.5, columns: 2, areaM2: 37.5, lengthMm: 750, widthMm: 700, heightMm: 1570, filtrateDn: "DN32", airDn: "DN32", scourAirM3h: 22, municipalCapacityM3d: 13.125 },
  { sku: "SWG-8-1.5-3", series: "8", decks: 1.5, columns: 3, areaM2: 56.25, lengthMm: 1000, widthMm: 700, heightMm: 1570, filtrateDn: "DN32", airDn: "DN40", scourAirM3h: 33, municipalCapacityM3d: 19.6875 },
  { sku: "SWG-8-1.5-4", series: "8", decks: 1.5, columns: 4, areaM2: 75, lengthMm: 1250, widthMm: 700, heightMm: 1570, filtrateDn: "DN32", airDn: "DN40", scourAirM3h: 44, municipalCapacityM3d: 26.25 },
  { sku: "SWG-8-1.5-5", series: "8", decks: 1.5, columns: 5, areaM2: 93.75, lengthMm: 1500, widthMm: 700, heightMm: 1570, filtrateDn: "DN32", airDn: "DN50", scourAirM3h: 55, municipalCapacityM3d: 32.8125 },
  { sku: "SWG-8-1.5-6", series: "8", decks: 1.5, columns: 6, areaM2: 112.5, lengthMm: 1750, widthMm: 700, heightMm: 1570, filtrateDn: "DN32", airDn: "DN50", scourAirM3h: 66, municipalCapacityM3d: 39.375 },
  { sku: "SWG-8-1.5-7", series: "8", decks: 1.5, columns: 7, areaM2: 131.25, lengthMm: 2050, widthMm: 700, heightMm: 1570, filtrateDn: "DN40", airDn: "DN50", scourAirM3h: 77, municipalCapacityM3d: 45.9375 },
  { sku: "SWG-8-1.5-8", series: "8", decks: 1.5, columns: 8, areaM2: 150, lengthMm: 2300, widthMm: 700, heightMm: 1570, filtrateDn: "DN40", airDn: "DN50", scourAirM3h: 88, municipalCapacityM3d: 52.5 },
  { sku: "SWG-8-2-1", series: "8", decks: 2, columns: 1, areaM2: 25, lengthMm: 400, widthMm: 700, heightMm: 1830, filtrateDn: "DN32", airDn: "DN32", scourAirM3h: 13, municipalCapacityM3d: 8.75 },
  { sku: "SWG-8-2-2", series: "8", decks: 2, columns: 2, areaM2: 50, lengthMm: 700, widthMm: 700, heightMm: 1830, filtrateDn: "DN32", airDn: "DN32", scourAirM3h: 26, municipalCapacityM3d: 17.5 },
  { sku: "SWG-8-2-3", series: "8", decks: 2, columns: 3, areaM2: 75, lengthMm: 1000, widthMm: 700, heightMm: 1830, filtrateDn: "DN32", airDn: "DN40", scourAirM3h: 39, municipalCapacityM3d: 26.25 },
  { sku: "SWG-8-2-4", series: "8", decks: 2, columns: 4, areaM2: 100, lengthMm: 1250, widthMm: 700, heightMm: 1830, filtrateDn: "DN32", airDn: "DN40", scourAirM3h: 54, municipalCapacityM3d: 35 },
  { sku: "SWG-8-2-5", series: "8", decks: 2, columns: 5, areaM2: 125, lengthMm: 1500, widthMm: 700, heightMm: 1830, filtrateDn: "DN40", airDn: "DN50", scourAirM3h: 65, municipalCapacityM3d: 43.75 },
  { sku: "SWG-8-2-6", series: "8", decks: 2, columns: 6, areaM2: 150, lengthMm: 1750, widthMm: 700, heightMm: 1830, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 81, municipalCapacityM3d: 52.5 },
  { sku: "SWG-8-2-7", series: "8", decks: 2, columns: 7, areaM2: 175, lengthMm: 2050, widthMm: 700, heightMm: 1830, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 91, municipalCapacityM3d: 61.25 },
  { sku: "SWG-8-2-8", series: "8", decks: 2, columns: 8, areaM2: 200, lengthMm: 2300, widthMm: 700, heightMm: 1830, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 104, municipalCapacityM3d: 70 },
  { sku: "SWG-8-2-9", series: "8", decks: 2, columns: 9, areaM2: 225, lengthMm: 2550, widthMm: 700, heightMm: 1830, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 117, municipalCapacityM3d: 78.75 },
  { sku: "SWG-8-2-10", series: "8", decks: 2, columns: 10, areaM2: 250, lengthMm: 2800, widthMm: 700, heightMm: 1830, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 130, municipalCapacityM3d: 87.5 },
  { sku: "SWG-8-2.5-4", series: "8", decks: 2.5, columns: 4, areaM2: 125, lengthMm: 1250, widthMm: 700, heightMm: 2160, filtrateDn: "DN40", airDn: "DN50", scourAirM3h: 52, municipalCapacityM3d: 43.75 },
  { sku: "SWG-8-2.5-5", series: "8", decks: 2.5, columns: 5, areaM2: 156.3, lengthMm: 1500, widthMm: 700, heightMm: 2160, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 65, municipalCapacityM3d: 54.705 },
  { sku: "SWG-8-2.5-6", series: "8", decks: 2.5, columns: 6, areaM2: 187.5, lengthMm: 1750, widthMm: 700, heightMm: 2160, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 78, municipalCapacityM3d: 65.625 },
  { sku: "SWG-8-2.5-7", series: "8", decks: 2.5, columns: 7, areaM2: 218.8, lengthMm: 2050, widthMm: 700, heightMm: 2160, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 91, municipalCapacityM3d: 76.58 },
  { sku: "SWG-8-2.5-8", series: "8", decks: 2.5, columns: 8, areaM2: 250, lengthMm: 2300, widthMm: 700, heightMm: 2160, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 104, municipalCapacityM3d: 87.5 },
  { sku: "SWG-8-2.5-9", series: "8", decks: 2.5, columns: 9, areaM2: 281.3, lengthMm: 2550, widthMm: 700, heightMm: 2160, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 117, municipalCapacityM3d: 98.455 },
  { sku: "SWG-8-2.5-10", series: "8", decks: 2.5, columns: 10, areaM2: 312.5, lengthMm: 2800, widthMm: 700, heightMm: 2160, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 130, municipalCapacityM3d: 109.375 },
  { sku: "SWG-8-3-4", series: "8", decks: 3, columns: 4, areaM2: 150, lengthMm: 1250, widthMm: 700, heightMm: 2430, filtrateDn: "DN40", airDn: "DN50", scourAirM3h: 60, municipalCapacityM3d: 52.5 },
  { sku: "SWG-8-3-5", series: "8", decks: 3, columns: 5, areaM2: 187.5, lengthMm: 1500, widthMm: 700, heightMm: 2430, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 75, municipalCapacityM3d: 65.625 },
  { sku: "SWG-8-3-6", series: "8", decks: 3, columns: 6, areaM2: 225, lengthMm: 1750, widthMm: 700, heightMm: 2430, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 87, municipalCapacityM3d: 78.75 },
  { sku: "SWG-8-3-7", series: "8", decks: 3, columns: 7, areaM2: 262.5, lengthMm: 2050, widthMm: 700, heightMm: 2430, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 105, municipalCapacityM3d: 91.875 },
  { sku: "SWG-8-3-8", series: "8", decks: 3, columns: 8, areaM2: 300, lengthMm: 2300, widthMm: 700, heightMm: 2430, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 116, municipalCapacityM3d: 105 },
  { sku: "SWG-8-3-9", series: "8", decks: 3, columns: 9, areaM2: 337.5, lengthMm: 2550, widthMm: 700, heightMm: 2430, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 135, municipalCapacityM3d: 118.125 },
  { sku: "SWG-8-3-10", series: "8", decks: 3, columns: 10, areaM2: 375, lengthMm: 2800, widthMm: 700, heightMm: 2430, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 150, municipalCapacityM3d: 131.25 },
  { sku: "SWG-8-4-6", series: "8", decks: 4, columns: 6, areaM2: 300, lengthMm: 1750, widthMm: 700, heightMm: 2980, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 114, municipalCapacityM3d: 105 },
  { sku: "SWG-8-4-7", series: "8", decks: 4, columns: 7, areaM2: 350, lengthMm: 2000, widthMm: 700, heightMm: 2980, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 133, municipalCapacityM3d: 122.5 },
  { sku: "SWG-8-4-8", series: "8", decks: 4, columns: 8, areaM2: 400, lengthMm: 2300, widthMm: 700, heightMm: 2980, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 135, municipalCapacityM3d: 140 },
  { sku: "SWG-8-4-10", series: "8", decks: 4, columns: 10, areaM2: 500, lengthMm: 2800, widthMm: 700, heightMm: 2980, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 190, municipalCapacityM3d: 175 },
  { sku: "SWG-8-6-8", series: "8", decks: 6, columns: 8, areaM2: 600, lengthMm: 2400, widthMm: 700, heightMm: 4250, filtrateDn: "DN65", airDn: "DN65", scourAirM3h: 150, municipalCapacityM3d: 210 },
  { sku: "SWG-9-1-1", series: "9", decks: 1, columns: 1, areaM2: 23, lengthMm: 500, widthMm: 1100, heightMm: 1230, filtrateDn: "DN25", airDn: "DN32", scourAirM3h: 18.4, municipalCapacityM3d: 8.05 },
  { sku: "SWG-9-1-2", series: "9", decks: 1, columns: 2, areaM2: 46, lengthMm: 750, widthMm: 1100, heightMm: 1230, filtrateDn: "DN32", airDn: "DN32", scourAirM3h: 37, municipalCapacityM3d: 16.1 },
  { sku: "SWG-9-1-3", series: "9", decks: 1, columns: 3, areaM2: 69, lengthMm: 1000, widthMm: 1100, heightMm: 1230, filtrateDn: "DN32", airDn: "DN50", scourAirM3h: 54, municipalCapacityM3d: 24.15 },
  { sku: "SWG-9-1-4", series: "9", decks: 1, columns: 4, areaM2: 92, lengthMm: 1250, widthMm: 1100, heightMm: 1230, filtrateDn: "DN32", airDn: "DN50", scourAirM3h: 72, municipalCapacityM3d: 32.2 },
  { sku: "SWG-9-1-5", series: "9", decks: 1, columns: 5, areaM2: 115, lengthMm: 1500, widthMm: 1100, heightMm: 1230, filtrateDn: "DN40", airDn: "DN50", scourAirM3h: 90, municipalCapacityM3d: 40.25 },
  { sku: "SWG-9-1-6", series: "9", decks: 1, columns: 6, areaM2: 138, lengthMm: 1750, widthMm: 1100, heightMm: 1230, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 108, municipalCapacityM3d: 48.3 },
  { sku: "SWG-9-1.5-1", series: "9", decks: 1.5, columns: 1, areaM2: 34.5, lengthMm: 500, widthMm: 1100, heightMm: 1570, filtrateDn: "DN32", airDn: "DN40", scourAirM3h: 20.24, municipalCapacityM3d: 12.075 },
  { sku: "SWG-9-1.5-2", series: "9", decks: 1.5, columns: 2, areaM2: 69, lengthMm: 750, widthMm: 1100, heightMm: 1570, filtrateDn: "DN32", airDn: "DN40", scourAirM3h: 40.48, municipalCapacityM3d: 24.15 },
  { sku: "SWG-9-1.5-3", series: "9", decks: 1.5, columns: 3, areaM2: 103.5, lengthMm: 1000, widthMm: 1100, heightMm: 1570, filtrateDn: "DN40", airDn: "DN50", scourAirM3h: 60.72, municipalCapacityM3d: 36.225 },
  { sku: "SWG-9-1.5-4", series: "9", decks: 1.5, columns: 4, areaM2: 138, lengthMm: 1250, widthMm: 1100, heightMm: 1570, filtrateDn: "DN40", airDn: "DN50", scourAirM3h: 80.96, municipalCapacityM3d: 48.3 },
  { sku: "SWG-9-1.5-5", series: "9", decks: 1.5, columns: 5, areaM2: 172.5, lengthMm: 1500, widthMm: 1100, heightMm: 1570, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 101.2, municipalCapacityM3d: 60.375 },
  { sku: "SWG-9-1.5-6", series: "9", decks: 1.5, columns: 6, areaM2: 207, lengthMm: 1750, widthMm: 1100, heightMm: 1570, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 121.44, municipalCapacityM3d: 72.45 },
  { sku: "SWG-9-1.5-7", series: "9", decks: 1.5, columns: 7, areaM2: 241.5, lengthMm: 2050, widthMm: 1100, heightMm: 1570, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 141.68, municipalCapacityM3d: 84.525 },
  { sku: "SWG-9-1.5-8", series: "9", decks: 1.5, columns: 8, areaM2: 276, lengthMm: 2430, widthMm: 1100, heightMm: 1570, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 161.92, municipalCapacityM3d: 96.6 },
  { sku: "SWG-9-2-2", series: "9", decks: 2, columns: 2, areaM2: 92, lengthMm: 700, widthMm: 1100, heightMm: 1830, filtrateDn: "DN32", airDn: "DN40", scourAirM3h: 47.84, municipalCapacityM3d: 32.2 },
  { sku: "SWG-9-2-3", series: "9", decks: 2, columns: 3, areaM2: 138, lengthMm: 1000, widthMm: 1100, heightMm: 1830, filtrateDn: "DN40", airDn: "DN50", scourAirM3h: 71.76, municipalCapacityM3d: 48.3 },
  { sku: "SWG-9-2-4", series: "9", decks: 2, columns: 4, areaM2: 184, lengthMm: 1250, widthMm: 1100, heightMm: 1830, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 95.68, municipalCapacityM3d: 64.4 },
  { sku: "SWG-9-2-5", series: "9", decks: 2, columns: 5, areaM2: 230, lengthMm: 1500, widthMm: 1100, heightMm: 1830, filtrateDn: "DN50", airDn: "DN50", scourAirM3h: 119.6, municipalCapacityM3d: 80.5 },
  { sku: "SWG-9-2-6", series: "9", decks: 2, columns: 6, areaM2: 276, lengthMm: 1750, widthMm: 1100, heightMm: 1830, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 143.52, municipalCapacityM3d: 96.6 },
  { sku: "SWG-9-2-7", series: "9", decks: 2, columns: 7, areaM2: 322, lengthMm: 2050, widthMm: 1100, heightMm: 1830, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 167.44, municipalCapacityM3d: 112.7 },
  { sku: "SWG-9-2-8", series: "9", decks: 2, columns: 8, areaM2: 368, lengthMm: 2430, widthMm: 1100, heightMm: 1830, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 191.36, municipalCapacityM3d: 128.8 },
  { sku: "SWG-9-3-6", series: "9", decks: 3, columns: 6, areaM2: 414, lengthMm: 1750, widthMm: 1100, heightMm: 2430, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 165.6, municipalCapacityM3d: 144.9 },
  { sku: "SWG-9-3-7", series: "9", decks: 3, columns: 7, areaM2: 483, lengthMm: 2050, widthMm: 1100, heightMm: 2430, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 193.2, municipalCapacityM3d: 169.05 },
  { sku: "SWG-9-3-8", series: "9", decks: 3, columns: 8, areaM2: 552, lengthMm: 2430, widthMm: 1100, heightMm: 2430, filtrateDn: "DN50", airDn: "DN65", scourAirM3h: 220.8, municipalCapacityM3d: 193.2 },
  { sku: "SWG-9-3-9", series: "9", decks: 3, columns: 9, areaM2: 621, lengthMm: 2550, widthMm: 1100, heightMm: 2430, filtrateDn: "DN65", airDn: "DN80", scourAirM3h: 248.4, municipalCapacityM3d: 217.35 },
  { sku: "SWG-9-3-10", series: "9", decks: 3, columns: 10, areaM2: 690, lengthMm: 2800, widthMm: 1100, heightMm: 2430, filtrateDn: "DN65", airDn: "DN80", scourAirM3h: 276, municipalCapacityM3d: 241.5 }
];

export const SWING_INDUSTRY_FLUX_M3_M2_D: Record<string, number> = {
  "Domestic and Municipal": 0.34,
  "Food and Beverage": 0.25,
  "Textile Printing and Dyeing": 0.2,
  Pharmaceuticals: 0.15,
  Slaughter: 0.2,
  Aquaculture: 0.22,
  "Garbage Leachate": 0.1
};

export const SWING_TANK_LENGTHS_MM = [
  2200, 2750, 3300, 3850, 4400, 4950, 5500, 6050, 6600, 7150, 7700, 8250, 8800, 9900, 11000
];
export const SWING_TANK_WIDTHS_MM = [1650, 2200, 2750, 3300, 3850, 4400];
export const SWING_MODULE_PITCH_MM = 1100;
