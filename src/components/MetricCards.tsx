'use client';

import React from 'react';
import { DollarSign, Fuel, Disc, UserCheck, Wrench, Gauge } from 'lucide-react';
import { ResumenCostos, Vehiculo } from '@/types/database';

interface MetricCardsProps {
  resumen: ResumenCostos;
  selectedVehiculo: Vehiculo | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ resumen, selectedVehiculo }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      
      {/* 1. Costo Total */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Costo Total</span>
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight">
          {formatCurrency(resumen.totalGeneral)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {selectedVehiculo ? `Placa ${selectedVehiculo.placa}` : `${resumen.gastosCount} registros`}
        </p>
      </div>

      {/* 2. Combustible */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Combustible</span>
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Fuel className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight">
          {formatCurrency(resumen.totalCombustible)}
        </div>
        <p className="text-[11px] text-blue-400/80 mt-1">
          {resumen.totalLitrosCombustible > 0 ? `${resumen.totalLitrosCombustible.toLocaleString()} Litros diésel` : 'Diésel / Gasoil'}
        </p>
      </div>

      {/* 3. Cauchos / Neumáticos */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-orange-500/30 transition-all">
        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Cauchos</span>
          <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
            <Disc className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight">
          {formatCurrency(resumen.totalCauchos)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Reemplazos & Mantenimiento
        </p>
      </div>

      {/* 4. Gastos de Chofer */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Gastos Chofer</span>
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight">
          {formatCurrency(resumen.totalChofer)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Viáticos, peajes y pagos
        </p>
      </div>

      {/* 5. Mecánica y Aceites */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-purple-500/30 transition-all">
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Taller & Aceite</span>
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <Wrench className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight">
          {formatCurrency(resumen.totalMecanica + resumen.totalAceite)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Aceite: {formatCurrency(resumen.totalAceite)} | Taller: {formatCurrency(resumen.totalMecanica)}
        </p>
      </div>

      {/* 6. Info de Odómetro / Kilometraje */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-cyan-500/30 transition-all">
        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Kilometraje</span>
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight">
          {selectedVehiculo
            ? `${selectedVehiculo.kilometraje_actual.toLocaleString()} Km`
            : `${resumen.vehiculosCount} Unidades`}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {selectedVehiculo
            ? `${selectedVehiculo.marca} ${selectedVehiculo.modelo}`
            : 'Flota activa total'}
        </p>
      </div>

    </div>
  );
};
