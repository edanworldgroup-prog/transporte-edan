'use client';

import React, { useState } from 'react';
import { Gasto, CategoriaGasto } from '@/types/database';
import { 
  Fuel, 
  Disc, 
  UserCheck, 
  Wrench, 
  Droplet, 
  Trash2, 
  Search,
  Receipt,
  Calendar
} from 'lucide-react';

interface ExpensesTableProps {
  gastos: Gasto[];
  onDeleteGasto: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({
  gastos,
  onDeleteGasto,
  isLoading,
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const getCategoryBadge = (cat: CategoriaGasto) => {
    switch (cat) {
      case 'combustible':
        return {
          label: 'Combustible',
          icon: <Fuel className="w-3.5 h-3.5" />,
          colorClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        };
      case 'caucho':
        return {
          label: 'Cauchos',
          icon: <Disc className="w-3.5 h-3.5" />,
          colorClass: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        };
      case 'chofer':
        return {
          label: 'Chofer / Viáticos',
          icon: <UserCheck className="w-3.5 h-3.5" />,
          colorClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        };
      case 'aceite_lubricante':
        return {
          label: 'Aceite & Filtros',
          icon: <Droplet className="w-3.5 h-3.5" />,
          colorClass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        };
      case 'mecanica':
        return {
          label: 'Mecánica / Taller',
          icon: <Wrench className="w-3.5 h-3.5" />,
          colorClass: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        };
      default:
        return {
          label: cat,
          icon: <Receipt className="w-3.5 h-3.5" />,
          colorClass: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
        };
    }
  };

  const filteredGastos = gastos.filter((g) => {
    const matchCat = categoriaFiltro === 'todos' || g.categoria === categoriaFiltro;
    const matchText =
      busqueda === '' ||
      g.vehiculo?.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
      g.observaciones?.toLowerCase().includes(busqueda.toLowerCase()) ||
      g.comprobante_numero?.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchText;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            Historial de Gastos y Mantenimientos
          </h2>
          <p className="text-xs text-slate-400">
            Registro cronológico detallado conectado a Supabase en la nube
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por placa, comprobante..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full sm:w-64 bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Category Filter Select */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todas las Categorías</option>
            <option value="combustible">⛽ Combustible</option>
            <option value="caucho">🛞 Cauchos</option>
            <option value="chofer">👤 Chofer / Viáticos</option>
            <option value="aceite_lubricante">🛢️ Aceite y Filtros</option>
            <option value="mecanica">🔧 Mecánica / Taller</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Vehículo</th>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4">Detalles & Observaciones</th>
              <th className="py-3 px-4">Odómetro</th>
              <th className="py-3 px-4 text-right">Monto ($)</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Cargando datos desde Supabase...
                </td>
              </tr>
            ) : filteredGastos.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No se encontraron gastos registrados con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredGastos.map((gasto) => {
                const badge = getCategoryBadge(gasto.categoria);
                const details = gasto.detalles as any;

                return (
                  <tr
                    key={gasto.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Fecha */}
                    <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {gasto.fecha}
                      </div>
                    </td>

                    {/* Vehículo */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded inline-block text-[11px]">
                        {gasto.vehiculo?.placa || 'Placa N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {gasto.vehiculo?.marca} {gasto.vehiculo?.modelo}
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.colorClass}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </td>

                    {/* Detalles */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-200 font-medium truncate">
                        {gasto.observaciones || 'Sin observaciones'}
                      </p>
                      <div className="text-[11px] text-slate-400 flex flex-wrap gap-2 mt-0.5">
                        {gasto.comprobante_numero && (
                          <span className="text-slate-500 font-mono">
                            Doc: #{gasto.comprobante_numero}
                          </span>
                        )}
                        {details?.litros && (
                          <span className="text-blue-400">
                            ⛽ {details.litros} Lts {details.estacion ? `en ${details.estacion}` : ''}
                          </span>
                        )}
                        {details?.cantidad && (
                          <span className="text-orange-400">
                            🛞 {details.cantidad} caucho(s) ({details.marca || 'S/M'}) {details.posicion ? `- ${details.posicion}` : ''}
                          </span>
                        )}
                        {details?.chofer && (
                          <span className="text-emerald-400">
                            👤 Chofer: {details.chofer}
                          </span>
                        )}
                        {details?.taller && (
                          <span className="text-purple-400">
                            🔧 Taller: {details.taller}
                          </span>
                        )}
                        {details?.tipo_aceite && (
                          <span className="text-cyan-400">
                            🛢️ {details.tipo_aceite}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Odómetro */}
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {gasto.kilometraje_al_momento
                        ? `${gasto.kilometraje_al_momento.toLocaleString()} Km`
                        : '—'}
                    </td>

                    {/* Monto Total */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="text-sm font-extrabold text-white">
                        {formatCurrency(gasto.monto_total)}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este gasto de Supabase?')) {
                            onDeleteGasto(gasto.id);
                          }
                        }}
                        title="Eliminar gasto"
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
      <div className="p-3 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
        <div>Mostrando {filteredGastos.length} registros</div>
        <div>Total filtrado: <span className="font-bold text-slate-300">{formatCurrency(filteredGastos.reduce((acc, g) => acc + Number(g.monto_total), 0))}</span></div>
      </div>
    </div>
  );
};
