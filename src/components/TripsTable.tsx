'use client';

import React, { useState } from 'react';
import { Viaje } from '@/types/database';
import { 
  Truck, 
  Search, 
  Trash2, 
  MapPin, 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Building 
} from 'lucide-react';

interface TripsTableProps {
  viajes: Viaje[];
  onDeleteViaje: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const TripsTable: React.FC<TripsTableProps> = ({
  viajes,
  onDeleteViaje,
  isLoading,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const filteredViajes = viajes.filter((v) => {
    const matchEstado =
      filtroEstado === 'todos' || v.estado === filtroEstado;
    const matchText =
      busqueda === '' ||
      v.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.origen.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.destino.toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.codigo_viaje && v.codigo_viaje.toLowerCase().includes(busqueda.toLowerCase())) ||
      (v.vehiculo?.placa && v.vehiculo.placa.toLowerCase().includes(busqueda.toLowerCase()));

    return matchEstado && matchText;
  });

  const totalIngresoFiltrado = filteredViajes.reduce(
    (acc, v) => acc + Number(v.ingreso_flete || 0),
    0
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/40">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-500" />
            Historial de Fletes y Viajes (Ingresos)
          </h3>
          <p className="text-xs text-slate-400">
            Registro de servicios prestados, rutas y cobro de fletes por camión
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, ruta, placa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full sm:w-64 bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="completado">🟢 Completados</option>
            <option value="en_ruta">🟡 En Ruta</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Fecha Salida</th>
              <th className="py-3 px-4">Vehículo</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Ruta (Origen ➔ Destino)</th>
              <th className="py-3 px-4">Control / Guía</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Flete Cobrado ($)</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  Cargando fletes desde Supabase...
                </td>
              </tr>
            ) : filteredViajes.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No hay fletes registrados en este período. Usa el botón "+ Registrar Viaje" arriba.
                </td>
              </tr>
            ) : (
              filteredViajes.map((viaje) => {
                const isCompletado = viaje.estado === 'completado';

                return (
                  <tr
                    key={viaje.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Fecha */}
                    <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {viaje.fecha_salida}
                      </div>
                      {viaje.fecha_llegada && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Entrega: {viaje.fecha_llegada}
                        </div>
                      )}
                    </td>

                    {/* Vehículo */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded inline-block text-[11px]">
                        {viaje.vehiculo?.placa || 'Placa N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {viaje.vehiculo?.marca} {viaje.vehiculo?.modelo}
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {viaje.cliente}
                      </div>
                      {viaje.observaciones && (
                        <div className="text-[10px] text-slate-400 max-w-xs truncate mt-0.5">
                          {viaje.observaciones}
                        </div>
                      )}
                    </td>

                    {/* Ruta */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <span className="text-blue-400 font-medium">{viaje.origen}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-emerald-400 font-medium">{viaje.destino}</span>
                      </div>
                    </td>

                    {/* Guía */}
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {viaje.codigo_viaje ? (
                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px]">
                          {viaje.codigo_viaje}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCompletado
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}
                      >
                        {isCompletado ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {isCompletado ? 'COMPLETADO' : 'EN RUTA'}
                      </span>
                    </td>

                    {/* Monto Cobrado */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="text-sm font-extrabold text-emerald-400">
                        {formatCurrency(viaje.ingreso_flete)}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar este flete para ${viaje.cliente}?`)) {
                            onDeleteViaje(viaje.id);
                          }
                        }}
                        title="Eliminar flete"
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div>Mostrando {filteredViajes.length} fletes</div>
        <div>
          Total Ingresos Filtrados:{' '}
          <strong className="text-emerald-400 font-mono text-xs">
            {formatCurrency(totalIngresoFiltrado)}
          </strong>
        </div>
      </div>
    </div>
  );
};
