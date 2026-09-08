'use client';

import React, { useState } from 'react';
import { X, Truck, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleCreated: () => Promise<void>;
  empresaId?: string;
  limiteVehiculos?: number;
  totalVehiculosActuales?: number;
}

export const NewVehicleModal: React.FC<NewVehicleModalProps> = ({
  isOpen,
  onClose,
  onVehicleCreated,
  empresaId,
  limiteVehiculos,
  totalVehiculosActuales = 0,
}) => {
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [choferHabitual, setChoferHabitual] = useState('');
  const [kilometrajeActual, setKilometrajeActual] = useState('');
  const [estado, setEstado] = useState<'activo' | 'mantenimiento' | 'inactivo'>('activo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const haAlcanzadoLimite = limiteVehiculos ? totalVehiculosActuales >= limiteVehiculos : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (haAlcanzadoLimite) {
      setErrorMsg(`Has alcanzado el límite máximo de ${limiteVehiculos} vehículos permitidos por tu suscripción.`);
      return;
    }

    if (!placa.trim() || !marca.trim() || !modelo.trim()) {
      setErrorMsg('Por favor completa los campos obligatorios (Placa, Marca y Modelo).');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('transporte_vehiculos').insert({
        placa: placa.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: anio ? parseInt(anio) : null,
        chofer_habitual: choferHabitual.trim() || null,
        kilometraje_actual: kilometrajeActual ? parseFloat(kilometrajeActual) : 0,
        estado,
        empresa_id: empresaId || null,
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error(`La placa ${placa.toUpperCase()} ya se encuentra registrada en esta empresa.`);
        }
        throw error;
      }

      await onVehicleCreated();
      onClose();
      // Reset
      setPlaca('');
      setMarca('');
      setModelo('');
      setAnio('');
      setChoferHabitual('');
      setKilometrajeActual('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al guardar el vehículo en Supabase');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Registrar Nuevo Vehículo
            </h3>
            <p className="text-xs text-slate-400">
              Añade un camión o chasis a la base de datos de Transporte Edan
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {haAlcanzadoLimite && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <span className="font-bold">⚠️ Límite de flota alcanzado:</span>
              <span>Has alcanzado el límite de {limiteVehiculos} vehículos incluidos en tu plan de suscripción actual.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Placa & Año */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Placa del Vehículo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: A72BB4D"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono uppercase text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Año de Fabricación
              </label>
              <input
                type="number"
                placeholder="Ej: 2020"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Marca & Modelo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Marca *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Mack, Freightliner, Volvo"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Granite 64FR, Cascadia"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Chofer Habitual & Kilometraje Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chofer Habitual Asignado
              </label>
              <input
                type="text"
                placeholder="Ej: Carlos Mendoza"
                value={choferHabitual}
                onChange={(e) => setChoferHabitual(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kilometraje Inicial / Actual
              </label>
              <input
                type="number"
                placeholder="Ej: 195000"
                value={kilometrajeActual}
                onChange={(e) => setKilometrajeActual(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Estado Operativo
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="activo">🟢 Activo (Operativo en ruta)</option>
              <option value="mantenimiento">🟡 En Mantenimiento (Taller)</option>
              <option value="inactivo">🔴 Inactivo (Parado)</option>
            </select>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors disabled:opacity-50 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Crear Vehículo
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
