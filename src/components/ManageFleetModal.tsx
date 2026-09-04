'use client';

import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Trash2, 
  Power, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Archive, 
  Search, 
  User, 
  Gauge, 
  DollarSign, 
  Loader2 
} from 'lucide-react';
import { Vehiculo, Gasto } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface ManageFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculos: Vehiculo[];
  gastos: Gasto[];
  onFleetUpdated: () => Promise<void>;
  onVehicleDeleted?: (placa: string) => void;
}

export const ManageFleetModal: React.FC<ManageFleetModalProps> = ({
  isOpen,
  onClose,
  vehiculos,
  gastos,
  onFleetUpdated,
  onVehicleDeleted,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Compute cost and expense count per vehicle
  const getVehicleStats = (vehiculoId: string) => {
    const vGastos = gastos.filter((g) => g.vehiculo_id === vehiculoId);
    const totalCost = vGastos.reduce((acc, g) => acc + Number(g.monto_total || 0), 0);
    return {
      count: vGastos.length,
      totalCost,
    };
  };

  // Toggle Incorporation / Decommission (Desincorporar / Incorporar)
  const handleToggleEstado = async (vehiculo: Vehiculo) => {
    const isDesincorporado = vehiculo.estado === 'desincorporado';
    const nuevoEstado = isDesincorporado ? 'activo' : 'desincorporado';

    const confirmMsg = isDesincorporado
      ? `¿Deseas volver a incorporar el vehículo ${vehiculo.placa} a la flota activa?`
      : `¿Deseas desincorporar el vehículo ${vehiculo.placa}? Ya no aparecerá para registrar nuevos gastos, pero conservará su historial.`;

    if (!confirm(confirmMsg)) return;

    setLoadingId(vehiculo.id);
    try {
      const { error } = await supabase
        .from('transporte_vehiculos')
        .update({ estado: nuevoEstado })
        .eq('id', vehiculo.id);

      if (error) throw error;
      await onFleetUpdated();
    } catch (err: any) {
      alert('Error al cambiar estado: ' + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  // Hard Delete (Eliminar Definitivamente)
  const handleDeleteVehiculo = async (vehiculo: Vehiculo) => {
    const stats = getVehicleStats(vehiculo.id);
    
    let advertencia = `⚠️ ¿Estás seguro de ELIMINAR DEFINITIVAMENTE el vehículo con placa ${vehiculo.placa}?\n\n`;
    if (stats.count > 0) {
      advertencia += `ATENCIÓN: Este vehículo tiene ${stats.count} gastos asociados por un total de ${formatCurrency(stats.totalCost)}. Se eliminará todo su historial.\n\n`;
      advertencia += `Si solo deseas sacarlo de circulación sin perder el historial, es preferible usar "Desincorporar".\n\n`;
    }
    advertencia += `Escribe ACEPTAR si deseas continuar con la eliminación definitiva.`;

    const respuesta = prompt(advertencia, '');
    if (!respuesta || respuesta.trim().toUpperCase() !== 'ACEPTAR') {
      return;
    }

    setDeletingId(vehiculo.id);
    try {
      const { error } = await supabase
        .from('transporte_vehiculos')
        .delete()
        .eq('id', vehiculo.id);

      if (error) throw error;

      if (onVehicleDeleted) {
        onVehicleDeleted(vehiculo.placa);
      }

      await onFleetUpdated();
    } catch (err: any) {
      alert('Error al eliminar vehículo de Supabase: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVehiculos = vehiculos.filter((v) => {
    const matchesSearch =
      busqueda === '' ||
      v.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.chofer_habitual && v.chofer_habitual.toLowerCase().includes(busqueda.toLowerCase()));

    const matchesEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && v.estado !== 'desincorporado') ||
      (filtroEstado === 'desincorporados' && v.estado === 'desincorporado');

    return matchesSearch && matchesEstado;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Gestión y Administración de Flota
            </h3>
            <p className="text-xs text-slate-400">
              Desincorpora, re-incorpora o elimina vehículos definitivamente en Supabase
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por placa, modelo, chofer..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                filtroEstado === 'todos'
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              Todos ({vehiculos.length})
            </button>
            <button
              onClick={() => setFiltroEstado('activos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                filtroEstado === 'activos'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              En Servicio ({vehiculos.filter((v) => v.estado !== 'desincorporado').length})
            </button>
            <button
              onClick={() => setFiltroEstado('desincorporados')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                filtroEstado === 'desincorporados'
                  ? 'bg-slate-700 text-white border-slate-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              Desincorporados ({vehiculos.filter((v) => v.estado === 'desincorporado').length})
            </button>
          </div>
        </div>

        {/* Vehicles List Table */}
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="py-3 px-4">Vehículo / Placa</th>
                <th className="py-3 px-4">Chofer Asignado</th>
                <th className="py-3 px-4">Odómetro</th>
                <th className="py-3 px-4">Historial de Costos</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVehiculos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No se encontraron vehículos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredVehiculos.map((vehiculo) => {
                  const stats = getVehicleStats(vehiculo.id);
                  const isDesincorporado = vehiculo.estado === 'desincorporado';
                  const isOperating = loadingId === vehiculo.id || deletingId === vehiculo.id;

                  return (
                    <tr
                      key={vehiculo.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isDesincorporado ? 'opacity-60 bg-slate-950/40' : ''
                      }`}
                    >
                      {/* Placa & Info */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-sm text-amber-400">
                          {vehiculo.placa}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio ? `(${vehiculo.anio})` : ''}
                        </div>
                      </td>

                      {/* Chofer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {vehiculo.chofer_habitual ? (
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <User className="w-3.5 h-3.5 text-amber-500" />
                            {vehiculo.chofer_habitual}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No asignado</span>
                        )}
                      </td>

                      {/* Odómetro */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                        <div className="flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                          {vehiculo.kilometraje_actual ? vehiculo.kilometraje_actual.toLocaleString() : 0} Km
                        </div>
                      </td>

                      {/* Costos Asociados */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-white">
                          {formatCurrency(stats.totalCost)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {stats.count} registros de gastos
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            vehiculo.estado === 'activo'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : vehiculo.estado === 'mantenimiento'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                          }`}
                        >
                          {vehiculo.estado === 'activo' && <CheckCircle2 className="w-3 h-3" />}
                          {vehiculo.estado === 'mantenimiento' && <AlertTriangle className="w-3 h-3" />}
                          {vehiculo.estado === 'desincorporado' && <Archive className="w-3 h-3" />}
                          {vehiculo.estado.toUpperCase()}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Toggle Desincorporar / Incorporar */}
                          <button
                            onClick={() => handleToggleEstado(vehiculo)}
                            disabled={isOperating}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              isDesincorporado
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                            title={isDesincorporado ? 'Reincorporar a la flota activa' : 'Desincorporar vehículo (conserva historial)'}
                          >
                            {loadingId === vehiculo.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                            {isDesincorporado ? 'Incorporar' : 'Desincorporar'}
                          </button>

                          {/* Delete Definitively */}
                          <button
                            onClick={() => handleDeleteVehiculo(vehiculo)}
                            disabled={isOperating}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                            title="Eliminar definitivamente de Supabase"
                          >
                            {deletingId === vehiculo.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & close */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            💡 <strong>Desincorporar</strong> mantiene el historial contable. <strong>Eliminar</strong> borra todo permanentemente de Supabase.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
