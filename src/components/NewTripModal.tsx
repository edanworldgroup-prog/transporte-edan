'use client';

import React, { useState } from 'react';
import { X, Truck, Check, Loader2, DollarSign, MapPin, Calendar, Building } from 'lucide-react';
import { Vehiculo } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculos: Vehiculo[];
  defaultPlaca?: string;
  onTripCreated: () => Promise<void>;
  empresaId?: string;
}

export const NewTripModal: React.FC<NewTripModalProps> = ({
  isOpen,
  onClose,
  vehiculos,
  defaultPlaca,
  onTripCreated,
  empresaId,
}) => {
  const [vehiculoId, setVehiculoId] = useState<string>(
    vehiculos.find((v) => v.placa === defaultPlaca)?.id || (vehiculos[0]?.id ?? '')
  );
  const [cliente, setCliente] = useState<string>('');
  const [origen, setOrigen] = useState<string>('');
  const [destino, setDestino] = useState<string>('');
  const [ingresoFlete, setIngresoFlete] = useState<string>('');
  const [fechaSalida, setFechaSalida] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaLlegada, setFechaLlegada] = useState<string>('');
  const [codigoViaje, setCodigoViaje] = useState<string>('');
  const [estado, setEstado] = useState<'completado' | 'en_ruta'>('completado');
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!vehiculoId) {
      setErrorMsg('Debes seleccionar un vehículo asignado al viaje.');
      return;
    }

    if (!cliente.trim() || !origen.trim() || !destino.trim()) {
      setErrorMsg('Por favor completa el cliente, origen y destino del flete.');
      return;
    }

    if (!ingresoFlete || parseFloat(ingresoFlete) <= 0) {
      setErrorMsg('Ingresa un monto de flete cobrado válido mayor a 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('transporte_viajes').insert({
        vehiculo_id: vehiculoId,
        cliente: cliente.trim(),
        origen: origen.trim(),
        destino: destino.trim(),
        ingreso_flete: parseFloat(ingresoFlete),
        fecha_salida: fechaSalida,
        fecha_llegada: fechaLlegada || null,
        codigo_viaje: codigoViaje.trim() || null,
        estado,
        observaciones: observaciones.trim() || null,
        empresa_id: empresaId || null,
      });

      if (error) throw error;

      await onTripCreated();
      onClose();

      // Reset
      setCliente('');
      setOrigen('');
      setDestino('');
      setIngresoFlete('');
      setFechaLlegada('');
      setCodigoViaje('');
      setObservaciones('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al registrar el viaje en Supabase');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-500" />
              Registrar Nuevo Viaje / Flete (Ingreso)
            </h3>
            <p className="text-xs text-slate-400">
              Registra el servicio prestado, la ruta y el monto del flete cobrado
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
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Vehículo & Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vehículo (Placa) *
              </label>
              <select
                value={vehiculoId}
                onChange={(e) => setVehiculoId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="">Selecciona una placa...</option>
                {vehiculos.map((v) => (
                  <option
                    key={v.id}
                    value={v.id}
                    disabled={v.estado === 'desincorporado'}
                  >
                    {v.placa} — {v.marca} {v.modelo} {v.estado === 'desincorporado' ? '(Desinc.)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Cliente / Empresa *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Empresas Polar, Cargill"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Ruta: Origen & Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Origen (Carga) *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Valencia, Carabobo"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Destino (Entrega) *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Puerto Cabello, Caracas"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Monto del Flete & Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Monto del Flete Cobrado ($ USD) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="Ej: 1200.00"
                value={ingresoFlete}
                onChange={(e) => setIngresoFlete(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado del Viaje
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="completado">🟢 Completado (Entregado y cobrado)</option>
                <option value="en_ruta">🟡 En Ruta (En tránsito)</option>
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Fecha de Salida *
              </label>
              <input
                type="date"
                required
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Fecha de Llegada / Entrega (Opcional)
              </label>
              <input
                type="date"
                value={fechaLlegada}
                onChange={(e) => setFechaLlegada(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Código Guía / Control */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nº Guía / Código de Control (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: GUIA-9921 / FLETE-01"
              value={codigoViaje}
              onChange={(e) => setCodigoViaje(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Detalles de la Carga / Observaciones
            </label>
            <input
              type="text"
              placeholder="Ej: 15 toneladas de bobinas, viaje ida y vuelta, carga refrigerada..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando en Supabase...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Guardar Flete (Ingreso)
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
