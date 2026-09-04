export type CategoriaGasto = 
  | 'combustible' 
  | 'caucho' 
  | 'chofer' 
  | 'aceite_lubricante' 
  | 'mecanica';

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  chofer_habitual?: string;
  kilometraje_actual: number;
  estado: 'activo' | 'mantenimiento' | 'inactivo';
  created_at: string;
}

export interface GastoCombustibleDetalle {
  litros?: number;
  precio_litro?: number;
  estacion?: string;
}

export interface GastoCauchoDetalle {
  marca?: string;
  cantidad?: number;
  posicion?: string; // Delantero Izq/Der, Tracción, Batea
}

export interface GastoChoferDetalle {
  tipo?: string; // Viáticos, Peajes, Comida, Sueldo, Bono
  chofer?: string;
}

export interface GastoAceiteDetalle {
  tipo_aceite?: string;
  filtros?: string;
  proximo_cambio_km?: number;
}

export interface GastoMecanicaDetalle {
  taller?: string;
  tipo?: 'Preventivo' | 'Correctivo';
  repuestos?: string;
  mano_obra?: number;
}

export type GastoDetalles = 
  | GastoCombustibleDetalle 
  | GastoCauchoDetalle 
  | GastoChoferDetalle 
  | GastoAceiteDetalle 
  | GastoMecanicaDetalle
  | Record<string, any>;

export interface Gasto {
  id: string;
  vehiculo_id: string;
  categoria: CategoriaGasto;
  fecha: string;
  monto_total: number;
  kilometraje_al_momento?: number;
  comprobante_numero?: string;
  observaciones?: string;
  detalles?: GastoDetalles;
  created_at: string;
  // Joins
  vehiculo?: Vehiculo;
}

export interface ResumenCostos {
  totalGeneral: number;
  totalCombustible: number;
  totalCauchos: number;
  totalChofer: number;
  totalAceite: number;
  totalMecanica: number;
  totalLitrosCombustible: number;
  gastosCount: number;
  vehiculosCount: number;
}
