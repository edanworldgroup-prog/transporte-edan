'use client';

import React from 'react';
import { Vehiculo } from '@/types/database';
import { Truck, Filter, CheckCircle2, AlertTriangle, XCircle, User } from 'lucide-react';

interface VehicleSelectorProps {
  vehiculos: Vehiculo[];
  selectedPlaca: string;
  onSelectPlaca: (placa: string) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehiculos,
  selectedPlaca,
  onSelectPlaca,
}) => {
  const currentVehiculo = vehiculos.find((v) => v.placa === selectedPlaca);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Selector Header & Chips */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 text-slate-400 rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Filtrar por Vehículo
            </span>
            <div className="text-sm font-medium text-slate-200">
              Selecciona una placa para ver su hoja de costos específica
            </div>
          </div>
        </div>

        {/* Buttons / Chips for Vehicles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectPlaca('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              selectedPlaca === ''
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            🚛 Toda la Flota ({vehiculos.length})
          </button>

          {vehiculos.map((v) => {
            const isSelected = selectedPlaca === v.placa;
            return (
              <button
                key={v.id}
                onClick={() => onSelectPlaca(v.placa)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span className="font-mono font-bold">{v.placa}</span>
                <span className="text-[10px] opacity-75">({v.marca})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Vehicle Mini Details Bar */}
      {currentVehiculo && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-300">
            <div>
              <span className="text-slate-500">Unidad: </span>
              <strong className="text-white font-mono">{currentVehiculo.placa}</strong> — {currentVehiculo.marca} {currentVehiculo.modelo} ({currentVehiculo.anio || 'S/A'})
            </div>
            {currentVehiculo.chofer_habitual && (
              <div className="flex items-center gap-1 text-slate-300">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Chofer: <strong>{currentVehiculo.chofer_habitual}</strong></span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-slate-400">
              Odómetro Actual: <strong className="text-white font-mono">{currentVehiculo.kilometraje_actual.toLocaleString()} Km</strong>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                currentVehiculo.estado === 'activo'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : currentVehiculo.estado === 'mantenimiento'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {currentVehiculo.estado === 'activo' && <CheckCircle2 className="w-3 h-3" />}
              {currentVehiculo.estado === 'mantenimiento' && <AlertTriangle className="w-3 h-3" />}
              {currentVehiculo.estado === 'inactivo' && <XCircle className="w-3 h-3" />}
              {currentVehiculo.estado.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
