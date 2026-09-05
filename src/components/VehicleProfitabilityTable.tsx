'use client';

import React from 'react';
import { Truck, TrendingUp, TrendingDown, ArrowRight, User } from 'lucide-react';
import { RentabilidadVehiculo } from '@/types/database';

interface VehicleProfitabilityTableProps {
  rentabilidades: RentabilidadVehiculo[];
  onSelectPlaca: (placa: string) => void;
  mesLabel: string;
}

export const VehicleProfitabilityTable: React.FC<VehicleProfitabilityTableProps> = ({
  rentabilidades,
  onSelectPlaca,
  mesLabel,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-950/40">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Rentabilidad por Vehículo — Corte {mesLabel}
          </h3>
          <p className="text-xs text-slate-400">
            Comparativa de cuánto produjo vs cuánto consumió cada camión de la flota
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Vehículo</th>
              <th className="py-3 px-4">Chofer</th>
              <th className="py-3 px-4 text-center">Fletes</th>
              <th className="py-3 px-4 text-right">Ingresos ($)</th>
              <th className="py-3 px-4 text-right">Egresos ($)</th>
              <th className="py-3 px-4 text-right">Utilidad Neta ($)</th>
              <th className="py-3 px-4 text-center">Margen (%)</th>
              <th className="py-3 px-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rentabilidades.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No hay vehículos registrados para calcular el balance.
                </td>
              </tr>
            ) : (
              rentabilidades.map((item) => {
                const isProfit = item.utilidadNeta >= 0;
                const v = item.vehiculo;

                return (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Vehículo */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded inline-block text-[11px]">
                        {v.placa}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {v.marca} {v.modelo}
                      </div>
                    </td>

                    {/* Chofer */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {v.chofer_habitual ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <User className="w-3.5 h-3.5 text-amber-500" />
                          {v.chofer_habitual}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No asignado</span>
                      )}
                    </td>

                    {/* Fletes */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-full font-bold text-[11px]">
                        {item.fletesCount}
                      </span>
                    </td>

                    {/* Ingresos */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-emerald-400">
                      {formatCurrency(item.ingresos)}
                    </td>

                    {/* Egresos */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-red-400">
                      {formatCurrency(item.egresos)}
                    </td>

                    {/* Utilidad Neta */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1 font-extrabold text-sm ${
                          isProfit ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isProfit ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isProfit ? '+' : ''}
                          {formatCurrency(item.utilidadNeta)}
                        </span>
                      </div>
                    </td>

                    {/* Margen % */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`font-bold text-[11px] px-2 py-0.5 rounded-full border ${
                          isProfit
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/10 border-red-500/20 text-red-300'
                        }`}
                      >
                        {item.ingresos > 0
                          ? `${item.margenPorcentaje.toFixed(1)}%`
                          : '0.0%'}
                      </span>
                    </td>

                    {/* Acción */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onSelectPlaca(v.placa)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
                        title="Ver ficha de este camión"
                      >
                        Ver Detalle
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
