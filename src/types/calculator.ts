export interface NprWearSettings {
  cauchos: {
    cantidad: number;
    costoUnitario: number;
    vidaUtilKm: number;
  };
  aceite: {
    costoCambio: number;
    intervaloKm: number;
    litrosCarter: number;
  };
  filtros: {
    filtroAceiteCosto: number;
    filtroAceiteIntervaloKm: number;
    filtroCombustibleCosto: number;
    filtroCombustibleIntervaloKm: number;
    filtroAireCosto: number;
    filtroAireIntervaloKm: number;
  };
  frenos: {
    costoMantenimiento: number;
    vidaUtilKm: number;
  };
  motor: {
    costoRepuestos: number;
    costoArmado: number;
    vidaUtilKm: number;
  };
  otrosMantenimientos: {
    valvulinaCajaDiferencialCosto: number;
    valvulinaIntervaloKm: number;
    engraseChasisCosto: number;
    engraseIntervaloKm: number;
    suspensionBujesCosto: number;
    suspensionIntervaloKm: number;
  };
}

export interface TripQuoteInput {
  origen: string;
  destino: string;
  kilometros: number;
  tipoTrayecto: 'solo_ida' | 'ida_vuelta';
  precioCombustibleLitro: number;
  rendimientoKmLitro: number;
  peajes: number;
  viaticos: number;
  pagoChofer: number;
  otrosGastosDirectos: number;
  margenUtilidadPorcentaje: number;
}

export interface TripQuoteResult {
  kmTotalesEfectivos: number;
  costoPorKm: {
    cauchos: number;
    aceite: number;
    filtros: number;
    frenos: number;
    motor: number;
    otros: number;
    totalDesgaste: number;
    combustible: number;
    totalOperativoKm: number;
  };
  reservaMantenimientoViaje: {
    cauchos: number;
    aceite: number;
    filtros: number;
    frenos: number;
    motorRepuestos: number;
    motorArmado: number;
    motorTotal: number;
    otros: number;
    totalDesgasteMecanico: number;
  };
  gastosOperativosViaje: {
    desgasteMecanico: number;
    combustible: number;
    peajes: number;
    viaticos: number;
    pagoChofer: number;
    otrosGastos: number;
    totalCostoOperativo: number;
  };
  precioSugerido: number;
  utilidadNeta: number;
  margenRealPorcentaje: number;
}

export const DEFAULT_NPR_SETTINGS: NprWearSettings = {
  cauchos: {
    cantidad: 6,
    costoUnitario: 150, // USD por neumático (7.50R16 o equivalente)
    vidaUtilKm: 60000,
  },
  aceite: {
    costoCambio: 55, // 10.5 a 11 litros de 15W-40 diésel
    intervaloKm: 5000,
    litrosCarter: 10.5,
  },
  filtros: {
    filtroAceiteCosto: 14,
    filtroAceiteIntervaloKm: 5000,
    filtroCombustibleCosto: 24, // Combustible secundario + trampa de agua
    filtroCombustibleIntervaloKm: 10000,
    filtroAireCosto: 26, // Filtro cilíndrico seco
    filtroAireIntervaloKm: 15000,
  },
  frenos: {
    costoMantenimiento: 150, // Bandas, tambores, rectificación y bombines
    vidaUtilKm: 35000,
  },
  motor: {
    costoRepuestos: 1100, // Kit de ajuste (camisas, pistones, conchas, anillos, empacaduras, bomba de aceite)
    costoArmado: 500, // Mano de obra de armado + rectificadora de bloque/cámara
    vidaUtilKm: 400000, // Vida útil estimada motor Isuzu 4HF1 atmosférico
  },
  otrosMantenimientos: {
    valvulinaCajaDiferencialCosto: 45, // Cambio de aceite transmisión y diferencial
    valvulinaIntervaloKm: 35000,
    engraseChasisCosto: 15, // Engrase de cardán, muñones y terminales
    engraseIntervaloKm: 4000,
    suspensionBujesCosto: 120, // Bujes de ballesta y amortiguadores
    suspensionIntervaloKm: 50000,
  },
};

export function calculateNprFreight(
  input: TripQuoteInput,
  settings: NprWearSettings = DEFAULT_NPR_SETTINGS
): TripQuoteResult {
  // 1. Distancia efectiva
  const factorTrayecto = input.tipoTrayecto === 'ida_vuelta' ? 2 : 1;
  const kmEfectivos = Math.max(0, (input.kilometros || 0) * factorTrayecto);

  // 2. Costo por Kilómetro (CPK) de cada componente
  // Cauchos
  const cpkCauchos =
    settings.cauchos.vidaUtilKm > 0
      ? (settings.cauchos.cantidad * settings.cauchos.costoUnitario) / settings.cauchos.vidaUtilKm
      : 0;

  // Aceite
  const cpkAceite =
    settings.aceite.intervaloKm > 0
      ? settings.aceite.costoCambio / settings.aceite.intervaloKm
      : 0;

  // Filtros
  const cpkFiltroAceite =
    settings.filtros.filtroAceiteIntervaloKm > 0
      ? settings.filtros.filtroAceiteCosto / settings.filtros.filtroAceiteIntervaloKm
      : 0;
  const cpkFiltroCombustible =
    settings.filtros.filtroCombustibleIntervaloKm > 0
      ? settings.filtros.filtroCombustibleCosto / settings.filtros.filtroCombustibleIntervaloKm
      : 0;
  const cpkFiltroAire =
    settings.filtros.filtroAireIntervaloKm > 0
      ? settings.filtros.filtroAireCosto / settings.filtros.filtroAireIntervaloKm
      : 0;
  const cpkFiltros = cpkFiltroAceite + cpkFiltroCombustible + cpkFiltroAire;

  // Frenos
  const cpkFrenos =
    settings.frenos.vidaUtilKm > 0
      ? settings.frenos.costoMantenimiento / settings.frenos.vidaUtilKm
      : 0;

  // Motor (Repuestos + Armado)
  const cpkMotorRepuestos =
    settings.motor.vidaUtilKm > 0
      ? settings.motor.costoRepuestos / settings.motor.vidaUtilKm
      : 0;
  const cpkMotorArmado =
    settings.motor.vidaUtilKm > 0
      ? settings.motor.costoArmado / settings.motor.vidaUtilKm
      : 0;
  const cpkMotor = cpkMotorRepuestos + cpkMotorArmado;

  // Otros mantenimientos (Caja, engrase, suspensión)
  const cpkValvulina =
    settings.otrosMantenimientos.valvulinaIntervaloKm > 0
      ? settings.otrosMantenimientos.valvulinaCajaDiferencialCosto /
        settings.otrosMantenimientos.valvulinaIntervaloKm
      : 0;
  const cpkEngrase =
    settings.otrosMantenimientos.engraseIntervaloKm > 0
      ? settings.otrosMantenimientos.engraseChasisCosto /
        settings.otrosMantenimientos.engraseIntervaloKm
      : 0;
  const cpkSuspension =
    settings.otrosMantenimientos.suspensionIntervaloKm > 0
      ? settings.otrosMantenimientos.suspensionBujesCosto /
        settings.otrosMantenimientos.suspensionIntervaloKm
      : 0;
  const cpkOtros = cpkValvulina + cpkEngrase + cpkSuspension;

  // Total Desgaste Mecánico CPK
  const cpkTotalDesgaste = cpkCauchos + cpkAceite + cpkFiltros + cpkFrenos + cpkMotor + cpkOtros;

  // Combustible CPK
  const cpkCombustible =
    input.rendimientoKmLitro > 0 ? input.precioCombustibleLitro / input.rendimientoKmLitro : 0;

  const cpkTotalOperativo = cpkTotalDesgaste + cpkCombustible;

  // 3. Totales de Reserva de Mantenimiento para este viaje específico ($)
  const reservaCauchos = cpkCauchos * kmEfectivos;
  const reservaAceite = cpkAceite * kmEfectivos;
  const reservaFiltros = cpkFiltros * kmEfectivos;
  const reservaFrenos = cpkFrenos * kmEfectivos;
  const reservaMotorRepuestos = cpkMotorRepuestos * kmEfectivos;
  const reservaMotorArmado = cpkMotorArmado * kmEfectivos;
  const reservaMotorTotal = cpkMotor * kmEfectivos;
  const reservaOtros = cpkOtros * kmEfectivos;
  const totalDesgasteMecanico = cpkTotalDesgaste * kmEfectivos;

  // 4. Totales de Costo Operativo del Viaje
  const costoCombustibleViaje = cpkCombustible * kmEfectivos;
  const peajes = Math.max(0, input.peajes || 0);
  const viaticos = Math.max(0, input.viaticos || 0);
  const pagoChofer = Math.max(0, input.pagoChofer || 0);
  const otrosGastos = Math.max(0, input.otrosGastosDirectos || 0);

  const totalCostoOperativo =
    totalDesgasteMecanico +
    costoCombustibleViaje +
    peajes +
    viaticos +
    pagoChofer +
    otrosGastos;

  // 5. Precio Sugerido según margen comercial deseado
  // Fórmula de margen comercial: Precio = Costo / (1 - Margen%)
  const margenPct = Math.min(95, Math.max(0, input.margenUtilidadPorcentaje || 0));
  let precioSugerido = 0;
  if (margenPct >= 90) {
    precioSugerido = totalCostoOperativo * (1 + margenPct / 100);
  } else {
    precioSugerido = totalCostoOperativo / (1 - margenPct / 100);
  }

  precioSugerido = Math.round(precioSugerido * 100) / 100;
  const utilidadNeta = Math.max(0, Math.round((precioSugerido - totalCostoOperativo) * 100) / 100);
  const margenRealPorcentaje =
    precioSugerido > 0 ? Math.round((utilidadNeta / precioSugerido) * 1000) / 10 : 0;

  return {
    kmTotalesEfectivos: kmEfectivos,
    costoPorKm: {
      cauchos: cpkCauchos,
      aceite: cpkAceite,
      filtros: cpkFiltros,
      frenos: cpkFrenos,
      motor: cpkMotor,
      otros: cpkOtros,
      totalDesgaste: cpkTotalDesgaste,
      combustible: cpkCombustible,
      totalOperativoKm: cpkTotalOperativo,
    },
    reservaMantenimientoViaje: {
      cauchos: reservaCauchos,
      aceite: reservaAceite,
      filtros: reservaFiltros,
      frenos: reservaFrenos,
      motorRepuestos: reservaMotorRepuestos,
      motorArmado: reservaMotorArmado,
      motorTotal: reservaMotorTotal,
      otros: reservaOtros,
      totalDesgasteMecanico,
    },
    gastosOperativosViaje: {
      desgasteMecanico: totalDesgasteMecanico,
      combustible: costoCombustibleViaje,
      peajes,
      viaticos,
      pagoChofer,
      otrosGastos,
      totalCostoOperativo,
    },
    precioSugerido,
    utilidadNeta,
    margenRealPorcentaje,
  };
}
