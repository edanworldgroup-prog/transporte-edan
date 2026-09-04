'use client';

import React from 'react';
import { Truck, PlusCircle, Database, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenExpenseModal: () => void;
  onOpenVehicleModal: () => void;
  onOpenFleetModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExpenseModal,
  onOpenVehicleModal,
  onOpenFleetModal,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo & Info */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shadow-inner">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  TRANSPORTE <span className="text-amber-500">EDAN</span>
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  <Database className="w-3 h-3" />
                  Supabase Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Control Operativo de Carga Pesada & Base de Datos de Costos
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenVehicleModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm"
            >
              <Truck className="w-4 h-4 text-slate-400" />
              + Vehículo
            </button>
            <button
              onClick={onOpenExpenseModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors shadow-md shadow-amber-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              Registrar Gasto
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
