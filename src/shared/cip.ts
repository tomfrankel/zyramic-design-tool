export interface CipInput {
  tankWorkingVolumeL?: number | null;
  maintenanceCl2MgL?: number | null;
  recoveryCl2MgL?: number | null;
  upperRecoveryCl2MgL?: number | null;
  stockWtPct?: number | null;
  stockDensityKgL?: number | null;
  phTarget?: number | null;
  temperatureC?: number | null;
  initialContactH?: number | null;
  circulationM3h?: number | null;
  circulationH?: number | null;
  maxSuctionKpa?: number | null;
  loopInternalL?: number | null;
  loopHeadersL?: number | null;
  loopSuctionL?: number | null;
  loopPumpL?: number | null;
  loopReturnL?: number | null;
  rinseVolumeL?: number | null;
  hydrostaticKpa?: number | null;
  pipeLossKpa?: number | null;
  fittingsLossKpa?: number | null;
  headerLossKpa?: number | null;
  moduleLossKpa?: number | null;
}

export function stockDoseL(
  targetMgL: number,
  tankL: number,
  stockWtPct: number,
  densityKgL: number
): number {
  return (targetMgL * tankL) / ((stockWtPct / 100) * densityKgL * 1_000_000);
}

export function screenPalisadeCip(input: CipInput = {}) {
  const tank = input.tankWorkingVolumeL ?? 4000;
  const maint = input.maintenanceCl2MgL ?? 300;
  const recovery = input.recoveryCl2MgL ?? 1500;
  const upper = input.upperRecoveryCl2MgL ?? 2000;
  const stock = input.stockWtPct ?? 12;
  const density = input.stockDensityKgL ?? 1.2;
  const loop =
    (input.loopInternalL ?? 60) +
    (input.loopHeadersL ?? 10) +
    (input.loopSuctionL ?? 15) +
    (input.loopPumpL ?? 5) +
    (input.loopReturnL ?? 10);
  const circM3h = input.circulationM3h ?? 2;
  const circH = input.circulationH ?? 0.5;
  const circLmin = (circM3h * 1000) / 60;
  const circMin = circH * 60;
  const sweeps = loop > 0 ? (circLmin * circMin) / loop : null;
  const rinse = input.rinseVolumeL ?? 1000;
  const rinseRatio = loop > 0 ? rinse / loop : null;
  const rinseCC0 = rinseRatio != null ? Math.exp(-rinseRatio) : null;
  const dP =
    (input.hydrostaticKpa ?? 0) +
    (input.pipeLossKpa ?? 0) +
    (input.fittingsLossKpa ?? 0) +
    (input.headerLossKpa ?? 0) +
    (input.moduleLossKpa ?? 0);
  const maxTmp = input.maxSuctionKpa ?? 15;

  return {
    documentStatus: "PRELIMINARY / VALIDATION-GATED — NOT A ZYRAMIC-APPROVED CIP RECIPE",
    architecture: {
      vessel: "Isolated membrane tank as CIP vessel",
      dilutionWater: "MBR permeate where quality is suitable",
      commonPermeateRule: "Never return NaOCl-containing CIP solution to a common permeate / RO tank",
      tankTurnover: "100% tank turnover is not the design objective",
      scourDuringSoak: "OFF — preliminary engineering basis",
      backwash: "Reverse-pressure backwash is not used",
      circulation: "Proposed small permeate-side circulation after initial contact — validation-gated"
    },
    defaultsAreExamples: true,
    chemistry: {
      note: "Preliminary benchmark framework only. Final concentration, pH, temperature and contact time require written Zyramic approval. Membrane-material compatibility is not complete-assembly approval.",
      maintenanceDoseL: stockDoseL(maint, tank, stock, density),
      recoveryDoseL: stockDoseL(recovery, tank, stock, density),
      upperRecoveryDoseL: stockDoseL(upper, tank, stock, density),
      maintenanceTargetMgL: maint,
      recoveryTargetMgL: recovery,
      upperRecoveryTargetMgL: upper,
      tankWorkingVolumeL: tank,
      stockWtPct: stock,
      stockDensityKgL: density,
      phTarget: input.phTarget ?? 10.5,
      temperatureC: input.temperatureC ?? 25
    },
    loop: {
      loopVolumeL: loop,
      circulationLmin: circLmin,
      circulationMin: circMin,
      theoreticalSweeps: sweeps,
      rinseVolumeL: rinse,
      rinseVolumeRatio: rinseRatio,
      idealizedRinseCC0: rinseCC0,
      interpretation:
        "Closed-loop sweeps indicate exposure / homogenization only; they do not dilute the tank. Rinse C/C0 is an idealized screening model. Field residual, pH and temperature measurements control."
    },
    hydraulics: {
      requiredDifferentialKpa: dP,
      maxCipSuctionKpa: maxTmp,
      pressureCheck: dP > maxTmp ? "LIMIT EXCEEDED" : "OK",
      note: "A displayed 0 kPa means example loss inputs are zero; project hydraulic inputs are still required. Motor power is out of scope."
    },
    sequence: [
      { step: 1, action: "Isolate selected membrane train and protect common permeate/RO path.", scour: "OFF", pump: "OFF", status: "Required" },
      { step: 2, action: "Drain mixed liquor from isolated membrane tank.", scour: "OFF", pump: "OFF", status: "Required" },
      { step: 3, action: "Fill tank with suitable MBR permeate and prepare chemical solution.", scour: "OFF", pump: "OFF", status: "Required" },
      { step: 4, action: "Add validated chemistry and record target concentration, pH, temperature.", scour: "OFF", pump: "OFF", status: "Validation-gated" },
      { step: 5, action: "Initial bulk/surface contact and short soak.", scour: "OFF", pump: "OFF", status: "Preliminary basis" },
      { step: 6, action: "Start controlled permeate-side circulation if validated.", scour: "OFF", pump: "ON", status: "Validation-gated" },
      { step: 7, action: "Continue approved circulation / soak.", scour: "OFF", pump: "As approved", status: "Validation-gated" },
      { step: 8, action: "Stop chemical circulation and drain to designated route. No return to common permeate/RO.", scour: "OFF", pump: "OFF", status: "Required" },
      { step: 9, action: "Rinse with suitable water to a chemistry-based endpoint.", scour: "OFF", pump: "As approved", status: "Required" },
      { step: 10, action: "If an acid stage is required, perform only after safe changeover/rinse. Never allow acid to contact residual hypochlorite.", scour: "OFF", pump: "As approved", status: "Validation-gated" },
      { step: 11, action: "Final rinse and return train to service after residual/pH acceptance.", scour: "OFF", pump: "OFF", status: "Required" }
    ],
    validationOpen: [
      "Complete wetted-assembly chemical compatibility",
      "Maintenance and recovery active-chlorine targets",
      "Cleaning pH and temperature limits",
      "Contact / soak time",
      "Scour OFF during soak",
      "Permeate-side circulation concept",
      "Maximum CIP suction/TMP",
      "Loop volume from project CAD",
      "Rinse / neutralization / disposal route",
      "Permeability / TMP recovery acceptance criterion"
    ]
  };
}

export type CipResult = ReturnType<typeof screenPalisadeCip>;
