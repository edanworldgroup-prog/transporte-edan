'use client';

import React, { useState } from 'react';
import { 
  X, 
  Fuel, 
  Disc, 
  UserCheck, 
  Droplet, 
  Wrench, 
  Check, 
  Loader2 
} from 'lucide-react';
import { Vehiculo, CategoriaGasto } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculos: Vehiculo[];
  defaultPlaca?: string;
  onExpenseCreated: () => Promise<void>;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  vehiculos,
  defaultPlaca,
  onExpenseCreated,
}) => {
  const [categoria, setCategoria] = useState<CategoriaGasto>('combustible');
  const [vehiculoId, setVehiculoId] = useState<string>(
    vehiculos.find((v) => v.placa === defaultPlaca)?.id || (vehiculos[0]?.id ?? '')
  );
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [montoTotal, setMontoTotal] = useState<string>('');
  const [kilometraje, setKilometraje] = useState<string>('');
  const [comprobanteNumero, setComprobanteNumero] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Specific details
  // 1. Combustible
  const [litros, setLitros] = useState<string>('');
  const [precioLitro, setPrecioLitro] = useState<string>('');
  const [estacion, setEstacion] = useState<string>('');

  // 2. Cauchos
  const [cantidadCauchos, setCantidadCauchos] = useState<string>('2');
  const [marcaCaucho, setMarcaCaucho] = useState<string>('');
  const [posicionCaucho, setPosicionCaucho] = useState<string>('Eje Delantero');

  // 3. Chofer
  const [tipoChoferGasto, setTipoChoferGasto] = useState<string>('Viáticos y Peajes');
  const [nombreChofer, setNombreChofer] = useState<string>('');

  // 4. Aceite y Lubricantes
  const [tipoAceite, setTipoAceite] = useState<string>('15W40 Mineral Diésel');
  const [filtrosCambiados, setFiltrosCambiados] = useState<string>('Aceite y Combustible');
  const [proximoCambioKm, setProximoCambioKm] = useState<string>('');

  // 5. Mecánica
  const [tallerMecanica, setTallerMecanica] = useState<string>('');
  const [tipoMantenimiento, setTipoMantenimiento] = useState<'Preventivo' | 'Correctivo'>('Correctivo');
  const [repuestos, setRepuestos] = useState<string>('');

  // Auto-calculate fuel total
  const handleLitrosChange = (l: string) => {
    setLitros(l);
    if (l && precioLitro) {
      setMontoTotal((parseFloat(l) * parseFloat(precioLitro)).toFixed(2));
    }
  };

  const handlePrecioLitroChange = (p: string) => {
    setPrecioLitro(p);
    if (p && litros) {
      setMontoTotal((parseFloat(litros) * parseFloat(p)).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!vehiculoId) {
      setErrorMsg('Debes seleccionar un vehículo.');
      return;
    }

    if (!montoTotal || parseFloat(montoTotal) <= 0) {
      setErrorMsg('Ingresa un monto válido mayor a 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build details JSON
      let detalles: any = {};
      if (categoria === 'combustible') {
        detalles = {
          litros: litros ? parseFloat(litros) : null,
          precio_litro: precioLitro ? parseFloat(precioLitro) : null,
          estacion: estacion.trim() || null,
        };
      } else if (categoria === 'caucho') {
        detalles = {
          cantidad: cantidadCauchos ? parseInt(cantidadCauchos) : 1,
          marca: marcaCaucho.trim() || null,
          posicion: posicionCaucho,
        };
      } else if (categoria === 'chofer') {
        detalles = {
          tipo: tipoChoferGasto,
          chofer: nombreChofer.trim() || null,
        };
      } else if (categoria === 'aceite_lubricante') {
        detalles = {
          tipo_aceite: tipoAceite,
          filtros: filtrosCambiados,
          proximo_cambio_km: proximoCambioKm ? parseFloat(proximoCambioKm) : null,
        };
      } else if (categoria === 'mecanica') {
        detalles = {
          taller: tallerMecanica.trim() || null,
          tipo: tipoMantenimiento,
          repuestos: repuestos.trim() || null,
        };
      }

      const { error } = await supabase.from('transporte_gastos').insert({
        vehiculo_id: vehiculoId,
        categoria,
        fecha,
        monto_total: parseFloat(montoTotal),
        kilometraje_al_momento: kilometraje ? parseFloat(kilometraje) : null,
        comprobante_numero: comprobanteNumero.trim() || null,
        observaciones: observaciones.trim() || null,
        detalles,
      });

      if (error) throw error;

      // Update vehicle current mileage if higher
      if (kilometraje) {
        const vKm = parseFloat(kilometraje);
        const currentV = vehiculos.find((v) => v.id === vehiculoId);
        if (currentV && vKm > (currentV.kilometraje_actual || 0)) {
          await supabase
            .from('transporte_vehiculos')
            .update({ kilometraje_actual: vKm })
            .eq('id', vehiculoId);
        }
      }

      await onExpenseCreated();
      onClose();
      // Reset form
      setMontoTotal('');
      setKilometraje('');
      setComprobanteNumero('');
      setObservaciones('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al guardar el gasto en Supabase');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Registrar Nuevo Gasto de Transporte
            </h3>
            <p className="text-xs text-slate-400">
              Guarda y vincula el costo a la placa del vehículo en Supabase
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Categoría Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Tipo de Gasto
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setCategoria('combustible')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  categoria === 'combustible'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Fuel className="w-5 h-5 mb-1" />
                Combustible
              </button>

              <button
                type="button"
                onClick={() => setCategoria('caucho')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  categoria === 'caucho'
                    ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Disc className="w-5 h-5 mb-1" />
                Cauchos
              </button>

              <button
                type="button"
                onClick={() => setCategoria('chofer')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  categoria === 'chofer'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <UserCheck className="w-5 h-5 mb-1" />
                Chofer
              </button>

              <button
                type="button"
                onClick={() => setCategoria('aceite_lubricante')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  categoria === 'aceite_lubricante'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Droplet className="w-5 h-5 mb-1" />
                Aceite
              </button>

              <button
                type="button"
                onClick={() => setCategoria('mecanica')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  categoria === 'mecanica'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Wrench className="w-5 h-5 mb-1" />
                Mecánica
              </button>
            </div>
          </div>

          {/* Vehicle and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Vehículo (Placa) *
              </label>
              <select
                value={vehiculoId}
                onChange={(e) => setVehiculoId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Selecciona una placa...</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} — {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Fecha del Gasto *
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
              </input>
            </div>
          </div>

          {/* Dynamic Category Specific Form Fields */}
          <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Detalles específicos de {categoria.replace('_', ' ')}
            </span>

            {/* Combustible fields */}
            {categoria === 'combustible' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Litros cargados</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej: 350"
                    value={litros}
                    onChange={(e) => handleLitrosChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Precio por litro ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej: 0.80"
                    value={precioLitro}
                    onChange={(e) => handlePrecioLitroChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Estación de servicio</label>
                  <input
                    type="text"
                    placeholder="Ej: Bomba Palito"
                    value={estacion}
                    onChange={(e) => setEstacion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Cauchos fields */}
            {categoria === 'caucho' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Cantidad de cauchos</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadCauchos}
                    onChange={(e) => setCantidadCauchos(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Marca / Medida</label>
                  <input
                    type="text"
                    placeholder="Ej: Pirelli 295/80 R22.5"
                    value={marcaCaucho}
                    onChange={(e) => setMarcaCaucho(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Posición / Eje</label>
                  <select
                    value={posicionCaucho}
                    onChange={(e) => setPosicionCaucho(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Eje Delantero">Eje Delantero (Direccional)</option>
                    <option value="Eje Tracción Posterior">Eje Tracción Posterior</option>
                    <option value="Eje Intermedio">Eje Intermedio</option>
                    <option value="Batea / Remolque">Batea / Remolque</option>
                    <option value="Repuesto">Caucho de Repuesto</option>
                  </select>
                </div>
              </div>
            )}

            {/* Chofer fields */}
            {categoria === 'chofer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Concepto / Tipo</label>
                  <select
                    value={tipoChoferGasto}
                    onChange={(e) => setTipoChoferGasto(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Viáticos y Peajes">Viáticos y Peajes de Ruta</option>
                    <option value="Comidas y Hospedaje">Comidas y Hospedaje</option>
                    <option value="Sueldo / Comisión">Sueldo / Comisión de Viaje</option>
                    <option value="Anticipo">Anticipo de Viaje</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nombre del Chofer</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Mendoza"
                    value={nombreChofer}
                    onChange={(e) => setNombreChofer(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Aceite fields */}
            {categoria === 'aceite_lubricante' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Tipo de Aceite / Lubricante</label>
                  <input
                    type="text"
                    placeholder="Ej: 15W40 Diésel"
                    value={tipoAceite}
                    onChange={(e) => setTipoAceite(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Filtros reemplazados</label>
                  <input
                    type="text"
                    placeholder="Ej: Aceite, Combustible, Aire"
                    value={filtrosCambiados}
                    onChange={(e) => setFiltrosCambiados(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Próximo cambio (Km)</label>
                  <input
                    type="number"
                    placeholder="Ej: 295000"
                    value={proximoCambioKm}
                    onChange={(e) => setProximoCambioKm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* Mecánica fields */}
            {categoria === 'mecanica' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Taller / Mecánico</label>
                  <input
                    type="text"
                    placeholder="Ej: Taller Central Diesel"
                    value={tallerMecanica}
                    onChange={(e) => setTallerMecanica(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tipo de Servicio</label>
                  <select
                    value={tipoMantenimiento}
                    onChange={(e) => setTipoMantenimiento(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Correctivo">Correctivo (Reparación)</option>
                    <option value="Preventivo">Preventivo (Revisión)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Repuestos instalados</label>
                  <input
                    type="text"
                    placeholder="Ej: Bandas de freno, mangueras"
                    value={repuestos}
                    onChange={(e) => setRepuestos(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Common Financial & Mileage Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Monto Total ($ USD) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-base font-bold text-amber-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Odómetro / Km al momento
              </label>
              <input
                type="number"
                placeholder="Ej: 285400"
                value={kilometraje}
                onChange={(e) => setKilometraje(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Comprobante / Factura #
              </label>
              <input
                type="text"
                placeholder="Ej: FACT-9821"
                value={comprobanteNumero}
                onChange={(e) => setComprobanteNumero(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción / Observaciones
            </label>
            <input
              type="text"
              placeholder="Detalles sobre el viaje, la reparación o el motivo del gasto..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Submit Buttons */}
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
                  Guardando en Supabase...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Guardar Gasto
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
