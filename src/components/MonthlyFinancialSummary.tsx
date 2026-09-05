'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Percent, 
  Truck, 
  Receipt 
} from 'lucide-react';
import { BalanceMensual } from '@/types/database';

interface MonthlyFinancialSummaryProps {
  balance: BalanceMensual;
  vehicleName?: string | null;
}

export const MonthlyFinancialSummary: React.FC<MonthlyFinancialSummaryProps> = ({
  balance,
  vehicleName,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const isProfit = balance.utilidadNeta >= 0;

  return (
    <div className="space-y-4">
      {/* 4 Financial Master KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Ingresos Totales (Fletes) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Ingresos (Fletes)
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {formatCurrency(balance.totalIngresos)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{balance.fletesCount} flete(s) cobrado(s)</span>
            <span className="text-emerald-400 font-semibold">{balance.mesLabel}</span>
          </p>
        </div>

        {/* 2. Egresos Totales (Gastos) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-red-500/40 transition-all shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
              Egresos (Gastos)
            </span>
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {formatCurrency(balance.totalEgresos)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{balance.gastosCount} gasto(s) operativo(s)</span>
            <span className="text-red-400 font-semibold">{balance.mesLabel}</span>
          </p>
        </div>

        {/* 3. Utilidad o Pérdida Neta */}
        <div
          className={`border rounded-xl p-4 relative overflow-hidden transition-all shadow-sm ${
            isProfit
              ? 'bg-slate-900 border-emerald-500/40 hover:border-emerald-500/60'
              : 'bg-slate-900 border-red-500/40 hover:border-red-500/60'
          }`}
        >
          <div
            className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none ${
              isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}
          />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isProfit ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isProfit ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              {isProfit ? 'Ganancia Neta' : 'Pérdida Neta'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isProfit
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}
            >
              {isProfit ? 'BALANCE POSITIVO' : 'BALANCE NEGATIVO'}
            </span>
          </div>

          <div
            className={`text-2xl font-black tracking-tight ${
              isProfit ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isProfit ? '+' : ''}
            {formatCurrency(balance.utilidadNeta)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {vehicleName ? `Corte ${vehicleName}` : 'Balance neto consolidado de la flota'}
          </p>
        </div>

        {/* 4. Margen de Rentabilidad (%) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-cyan-400" />
              Margen de Ganancia
            </span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {balance.totalIngresos > 0 ? `${balance.margenPorcentaje.toFixed(1)}%` : '0.0%'}
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-800">
            <div
              style={{
                width: `${Math.max(0, Math.min(100, balance.margenPorcentaje))}%`,
              }}
              className={`h-full transition-all duration-500 ${
                isProfit ? 'bg-emerald-400' : 'bg-red-500'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {balance.totalIngresos > 0
              ? `${formatCurrency(balance.utilidadNeta)} de ganancia por flete`
              : 'Sin ingresos registrados'}
          </p>
        </div>

      </div>

      {/* Narrative Summary Bar */}
      <div
        className={`border rounded-xl p-3.5 px-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isProfit
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
            : 'bg-red-950/20 border-red-800/40 text-red-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {isProfit ? (
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>
            <strong>Resumen del Corte ({balance.mesLabel}):</strong>{' '}
            {isProfit ? (
              <>
                Se generaron <strong>{formatCurrency(balance.totalIngresos)}</strong> en fletes y se ejecutaron <strong>{formatCurrency(balance.totalEgresos)}</strong> en gastos operativos, dejando una utilidad neta de{' '}
                <strong className="text-emerald-400">+{formatCurrency(balance.utilidadNeta)}</strong> ({balance.margenPorcentaje.toFixed(1)}% de margen).
              </>
            ) : (
              <>
                Los gastos operativos (<strong>{formatCurrency(balance.totalEgresos)}</strong>) superaron a los ingresos por fletes (<strong>{formatCurrency(balance.totalIngresos)}</strong>), resultando en un balance deficitario de{' '}
                <strong className="text-red-400">{formatCurrency(balance.utilidadNeta)}</strong>.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
