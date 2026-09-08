export type CategoriaGasto = 
  | 'combustible' 
  | 'caucho' 
  | 'chofer' 
  | 'aceite_lubricante' 
  | 'mecanica';

export interface Empresa {
  id: string;
  nombre: string;
  rif_ruc?: string;
  estado_licencia: 'activo' | 'suspendido' | 'vencido';
  fecha_vencimiento: string;
  limite_vehiculos: number;
  created_at: string;
  vehiculos_count?: number;
  admin_email?: string;
}

export interface UsuarioPerfil {
  id: string;
  user_id: string;
  empresa_id: string;
  rol: 'superadmin' | 'admin_empresa' | 'operador';
  nombre?: string;
  email?: string;
  empresa?: Empresa;
}

export interface Vehiculo {
  id: string;
  empresa_id?: string;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  chofer_habitual?: string;
  kilometraje_actual: number;
  estado: 'activo' | 'mantenimiento' | 'inactivo' | 'desincorporado';
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

export interface Viaje {
  id: string;
  vehiculo_id: string;
  codigo_viaje?: string;
  cliente: string;
  origen: string;
  destino: string;
  fecha_salida: string;
  fecha_llegada?: string;
  ingreso_flete: number;
  estado: 'completado' | 'en_ruta' | 'cancelado';
  observaciones?: string;
  created_at: string;
  // Joins
  vehiculo?: Vehiculo;
}

export interface BalanceMensual {
  mesStr: string; // "YYYY-MM"
  mesLabel: string; // "Septiembre 2026"
  totalIngresos: number;
  totalEgresos: number;
  utilidadNeta: number;
  margenPorcentaje: number;
  fletesCount: number;
  gastosCount: number;
}

export interface RentabilidadVehiculo {
  vehiculo: Vehiculo;
  fletesCount: number;
  ingresos: number;
  egresos: number;
  utilidadNeta: number;
  margenPorcentaje: number;
}

