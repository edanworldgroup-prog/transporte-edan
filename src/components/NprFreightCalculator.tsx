'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Truck, 
  Fuel, 
  Wrench, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  RotateCcw, 
  Save, 
  Copy, 
  Check, 
  ArrowRight, 
  Info, 
  Settings2, 
  AlertCircle,
  Percent,
  MapPin,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Vehiculo } from '@/types/database';
import { 
  NprWearSettings, 
  TripQuoteInput, 
  TripQuoteResult, 
  DEFAULT_NPR_SETTINGS, 
  calculateNprFreight 
} from '@/types/calculator';

interface NprFreightCalculatorProps {
  vehiculos: Vehiculo[];
  onOpenTripModalWithData?: (data: {
    vehiculoId?: string;
    origen?: string;
    destino?: string;
    ingresoFlete?: number;
    observaciones?: string;
  }) => void;
}

const STORAGE_KEY = 'transporte_edan_npr_settings_v1';

export const NprFreightCalculator: React.FC<NprFreightCalculatorProps> = ({
  vehiculos,
  onOpenTripModalWithData,
}) => {
  // NPR Wear Settings (with localStorage persistence)
  const [settings, setSettings] = useState<NprWearSettings>(DEFAULT_NPR_SETTINGS);
  const [isSavedAlert, setIsSavedAlert] = useState<boolean>(false);
  const [isCopiedAlert, setIsCopiedAlert] = useState<boolean>(false);

  // Selected Vehicle (optional)
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string>('');

  // Active settings tab
  const [activeSettingsTab, setActiveSettingsTab] = useState<'cauchos_frenos' | 'aceite_filtros' | 'motor' | 'caja_otros'>('cauchos_frenos');

  // Trip Input State
  const [tripInput, setTripInput] = useState<TripQuoteInput>({
    origen: '',
    destino: '',
    kilometros: 350,
    tipoTrayecto: 'ida_vuelta',
    precioCombustibleLitro: 0.50, // Precio referencial gasoil
    rendimientoKmLitro: 6.2, // ~6.2 km/L para NPR sin turbo
    peajes: 15,
    viaticos: 40,
    pagoChofer: 60,
    otrosGastosDirectos: 0,
    margenUtilidadPorcentaje: 30,
  });

  // Load custom saved settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          cauchos: { ...prev.cauchos, ...(parsed.cauchos || {}) },
          aceite: { ...prev.aceite, ...(parsed.aceite || {}) },
          filtros: { ...prev.filtros, ...(parsed.filtros || {}) },
          frenos: { ...prev.frenos, ...(parsed.frenos || {}) },
          motor: { ...prev.motor, ...(parsed.motor || {}) },
          otrosMantenimientos: { ...prev.otrosMantenimientos, ...(parsed.otrosMantenimientos || {}) },
        }));
      }
    } catch (e) {
      console.warn('No se pudo cargar configuración guardada de NPR:', e);
    }
  }, []);

  // Filter NPR trucks from fleet if any
  const nprVehiculos = useMemo(() => {
    return vehiculos.filter((v) => {
      const txt = `${v.marca} ${v.modelo}`.toLowerCase();
      return txt.includes('npr') || txt.includes('isuzu') || txt.includes('chevrolet');
    });
  }, [vehiculos]);

  // Handle vehicle select
  const handleSelectVehiculo = (id: string) => {
    setSelectedVehiculoId(id);
  };

  // Perform calculation
  const quoteResult: TripQuoteResult = useMemo(() => {
    return calculateNprFreight(tripInput, settings);
  }, [tripInput, settings]);

  // Save settings
  const handleSaveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setIsSavedAlert(true);
      setTimeout(() => setIsSavedAlert(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Reset to default factory NPR settings
  const handleResetSettings = () => {
    if (confirm('¿Deseas restablecer todos los costos de desgaste a los valores de fábrica recomendados para el NPR sin turbo?')) {
      setSettings(DEFAULT_NPR_SETTINGS);
      localStorage.removeItem(STORAGE_KEY);
      setIsSavedAlert(true);
      setTimeout(() => setIsSavedAlert(false), 2000);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const formatCpk = (val: number) => {
    return (val || 0).toFixed(4);
  };

  // Copy WhatsApp summary
  const handleCopyWhatsAppQuote = () => {
    const origenStr = tripInput.origen.trim() || 'Punto de Carga';
    const destinoStr = tripInput.destino.trim() || 'Punto de Descarga';
    const tipoStr = tripInput.tipoTrayecto === 'ida_vuelta' ? 'Ida y Vuelta (Retorno)' : 'Solo Ida';
    
    const text = `🚚 *COTIZACIÓN DE FLETE - TRANSPORTE EDAN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Ruta:* ${origenStr} ➔ ${destinoStr}
🛣️ *Modalidad:* ${tipoStr}
📏 *Distancia:* ${quoteResult.kmTotalesEfectivos} km totales
🚛 *Unidad:* Chevrolet NPR (Plataforma / Furgón)

💵 *TARIFA TOTAL SUGERIDA:* *${formatCurrency(quoteResult.precioSugerido)}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Incluye:*
✅ Operación y combustible diésel
✅ Viáticos y honorarios del chofer
✅ Peajes de ruta
✅ Mantenimiento preventivo de la unidad

_Cotización válida por 5 días hábiles._
_Transporte Edan - Seguridad, Puntualidad y Eficiencia en Carga Pesada._`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopiedAlert(true);
      setTimeout(() => setIsCopiedAlert(false), 3000);
    });
  };

  // Register in system
  const handleRegisterAsTrip = () => {
    if (!onOpenTripModalWithData) return;
    const origenStr = tripInput.origen.trim();
    const destinoStr = tripInput.destino.trim();
    const observacionesStr = `Cotizado con Calculadora NPR: ${quoteResult.kmTotalesEfectivos} km (${tripInput.tipoTrayecto === 'ida_vuelta' ? 'Ida y Vuelta' : 'Solo Ida'}). Desgaste mecánico estimado: ${formatCurrency(quoteResult.gastosOperativosViaje.desgasteMecanico)} (Reserva motor: ${formatCurrency(quoteResult.reservaMantenimientoViaje.motorTotal)}, cauchos: ${formatCurrency(quoteResult.reservaMantenimientoViaje.cauchos)}).`;

    onOpenTripModalWithData({
      vehiculoId: selectedVehiculoId || (nprVehiculos[0]?.id ?? vehiculos[0]?.id),
      origen: origenStr,
      destino: destinoStr,
      ingresoFlete: quoteResult.precioSugerido,
      observaciones: observacionesStr,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Introduction */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-amber-500">
          <Truck className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Truck className="w-3.5 h-3.5" />
                Módulo Especializado NPR
              </span>
              <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                Motor Isuzu 4HF1 / 4HG1 (Sin Turbo)
              </span>
              <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                6 Cauchos 7.50R16
              </span>
              <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                Cárter 10.5 L
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Calculadora de Fletes & Desgaste Operativo por Km
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Calcula la tarifa real de tu viaje considerando el desgaste real de cauchos, aceite, filtros, frenos, y apartando el <strong className="text-amber-400 font-semibold">fondo de reserva para repuestos y armado de motor</strong>.
            </p>
          </div>

          {/* Quick stats badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:px-4 sm:py-3 flex-shrink-0 flex items-center gap-4">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Costo Por Km Desgaste</span>
              <span className="text-lg font-black text-amber-400">${formatCpk(quoteResult.costoPorKm.totalDesgaste)} <span className="text-xs text-slate-500 font-normal">USD/km</span></span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Costo Total por Km</span>
              <span className="text-lg font-black text-white">${formatCpk(quoteResult.costoPorKm.totalOperativoKm)} <span className="text-xs text-slate-500 font-normal">USD/km</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Inputs & Settings) / Right (Results & Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Inputs & NPR Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Card 1: Trip & Route Parameters */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                1. Datos del Flete y Distancia
              </h3>
              {vehiculos.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Asignar a:</span>
                  <select
                    value={selectedVehiculoId}
                    onChange={(e) => handleSelectVehiculo(e.target.value)}
                    className="text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">Simulación General (NPR Genérico)</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.placa} - {v.marca} {v.modelo}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Route row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Origen / Punto de Carga
                </label>
                <input
                  type="text"
                  value={tripInput.origen}
                  onChange={(e) => setTripInput({ ...tripInput, origen: e.target.value })}
                  placeholder="Ej: Valencia / Zona Industrial"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destino / Entrega
                </label>
                <input
                  type="text"
                  value={tripInput.destino}
                  onChange={(e) => setTripInput({ ...tripInput, destino: e.target.value })}
                  placeholder="Ej: Puerto Cabello / Muelles"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Distance & Trip Type row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Distancia del Trayecto (Km)
                  </label>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">
                    {tripInput.kilometros} km
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={tripInput.kilometros || ''}
                  onChange={(e) => setTripInput({ ...tripInput, kilometros: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Modalidad de Retorno
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTripInput({ ...tripInput, tipoTrayecto: 'solo_ida' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
                      tripInput.tipoTrayecto === 'solo_ida'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Solo Ida ({tripInput.kilometros} km)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripInput({ ...tripInput, tipoTrayecto: 'ida_vuelta' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
                      tripInput.tipoTrayecto === 'ida_vuelta'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Ida y Vuelta ({tripInput.kilometros * 2} km)
                  </button>
                </div>
              </div>
            </div>

            {/* Fuel & Direct expenses */}
            <div className="border-t border-slate-800/80 pt-4 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Combustible & Gastos de Ruta
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Precio Gasoil ($/L)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={tripInput.precioCombustibleLitro}
                      onChange={(e) => setTripInput({ ...tripInput, precioCombustibleLitro: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rendimiento (Km/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={tripInput.rendimientoKmLitro}
                    onChange={(e) => setTripInput({ ...tripInput, rendimientoKmLitro: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    title="Promedio NPR sin turbo: 6.0 a 6.5 km/l"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Peajes ($)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={tripInput.peajes}
                      onChange={(e) => setTripInput({ ...tripInput, peajes: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Viáticos Chofer ($)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={tripInput.viaticos}
                      onChange={(e) => setTripInput({ ...tripInput, viaticos: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Pago Chofer ($)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={tripInput.pagoChofer}
                      onChange={(e) => setTripInput({ ...tripInput, pagoChofer: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Otros Directos ($)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={tripInput.otrosGastosDirectos}
                      onChange={(e) => setTripInput({ ...tripInput, otrosGastosDirectos: parseFloat(e.target.value) || 0 })}
                      placeholder="Caleta, etc."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-400">Margen Utilidad</label>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {tripInput.margenUtilidadPorcentaje}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="1"
                    value={tripInput.margenUtilidadPorcentaje}
                    onChange={(e) => setTripInput({ ...tripInput, margenUtilidadPorcentaje: parseInt(e.target.value) || 30 })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Mechanical Wear Parameters Settings (Accordion / Tabs) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  2. Configuración de Desgaste Mecánico (NPR Sin Turbo)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Precios de repuestos, lubricantes y mano de obra ajustables según tu proveedor local.
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
                  title="Restablecer a valores de fábrica"
                >
                  <RotateCcw className="w-3 h-3" />
                  Valores Fábrica
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all shadow-sm shadow-amber-500/20"
                >
                  <Save className="w-3 h-3" />
                  Guardar Costos
                </button>
              </div>
            </div>

            {/* Success alert */}
            {isSavedAlert && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
                <Check className="w-4 h-4" />
                Configuración de costos guardada exitosamente en la memoria del navegador.
              </div>
            )}

            {/* Sub-tabs for Wear Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSettingsTab('cauchos_frenos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSettingsTab === 'cauchos_frenos'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                🛞 Cauchos y Frenos
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('aceite_filtros')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSettingsTab === 'aceite_filtros'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                🛢️ Aceite y Filtros
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('motor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSettingsTab === 'motor'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                ⚙️ Motor & Armado (Overhaul)
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('caja_otros')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSettingsTab === 'caja_otros'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                🔩 Caja, Engrase y Tren
              </button>
            </div>

            {/* TAB CONTENT 1: Cauchos y Frenos */}
            {activeSettingsTab === 'cauchos_frenos' && (
              <div className="space-y-4 pt-1">
                {/* Cauchos */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      Cauchos (Neumáticos NPR - Medida 7.50R16 / 215/75R17.5)
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">
                      CPK: ${formatCpk(quoteResult.costoPorKm.cauchos)}/km
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nº Cauchos del Camión</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.cauchos.cantidad}
                        onChange={(e) => setSettings({
                          ...settings,
                          cauchos: { ...settings.cauchos, cantidad: parseInt(e.target.value) || 6 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Costo Unitario ($ c/u)</label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={settings.cauchos.costoUnitario}
                        onChange={(e) => setSettings({
                          ...settings,
                          cauchos: { ...settings.cauchos, costoUnitario: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Vida Útil Estimada (Km)</label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={settings.cauchos.vidaUtilKm}
                        onChange={(e) => setSettings({
                          ...settings,
                          cauchos: { ...settings.cauchos, vidaUtilKm: parseInt(e.target.value) || 60000 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Juego de {settings.cauchos.cantidad} cauchos = {formatCurrency(settings.cauchos.cantidad * settings.cauchos.costoUnitario)}. Reposición prorrateada cada {settings.cauchos.vidaUtilKm.toLocaleString()} km.
                  </div>
                </div>

                {/* Frenos */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      Sistema de Frenos (Bandas, Tambores, Rectificación y Cilindros)
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">
                      CPK: ${formatCpk(quoteResult.costoPorKm.frenos)}/km
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Costo Mantenimiento / Repuestos ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={settings.frenos.costoMantenimiento}
                        onChange={(e) => setSettings({
                          ...settings,
                          frenos: { ...settings.frenos, costoMantenimiento: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Vida Útil Estimada (Km)</label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={settings.frenos.vidaUtilKm}
                        onChange={(e) => setSettings({
                          ...settings,
                          frenos: { ...settings.frenos, vidaUtilKm: parseInt(e.target.value) || 35000 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Aceite y Filtros */}
            {activeSettingsTab === 'aceite_filtros' && (
              <div className="space-y-4 pt-1">
                {/* Aceite */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Aceite de Motor Diésel 15W-40
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Capacidad NPR con filtro: ~10.5 a 11 litros
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">
                      CPK: ${formatCpk(quoteResult.costoPorKm.aceite)}/km
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Costo Total Cambio de Aceite ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="2"
                        value={settings.aceite.costoCambio}
                        onChange={(e) => setSettings({
                          ...settings,
                          aceite: { ...settings.aceite, costoCambio: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Frecuencia de Cambio (Km)</label>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={settings.aceite.intervaloKm}
                        onChange={(e) => setSettings({
                          ...settings,
                          aceite: { ...settings.aceite, intervaloKm: parseInt(e.target.value) || 5000 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Filtros */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Kit de Filtros de Servicio</span>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">
                      CPK Filtros: ${formatCpk(quoteResult.costoPorKm.filtros)}/km
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Filtro Aceite */}
                    <div className="grid grid-cols-3 gap-2 items-center bg-slate-900/80 p-2 rounded-lg text-xs">
                      <span className="text-slate-300 font-medium">Filtro Aceite</span>
                      <div>
                        <input
                          type="number"
                          step="1"
                          value={settings.filtros.filtroAceiteCosto}
                          onChange={(e) => setSettings({
                            ...settings,
                            filtros: { ...settings.filtros, filtroAceiteCosto: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                          placeholder="Costo $"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="500"
                          value={settings.filtros.filtroAceiteIntervaloKm}
                          onChange={(e) => setSettings({
                            ...settings,
                            filtros: { ...settings.filtros, filtroAceiteIntervaloKm: parseInt(e.target.value) || 5000 }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                          placeholder="Cada Km"
                        />
                      </div>
                    </div>

                    {/* Filtro Combustible */}
                    <div className="grid grid-cols-3 gap-2 items-center bg-slate-900/80 p-2 rounded-lg text-xs">
                      <span className="text-slate-300 font-medium">Filtro Gasoil / Trampa</span>
                      <div>
                        <input
                          type="number"
                          step="1"
                          value={settings.filtros.filtroCombustibleCosto}
                          onChange={(e) => setSettings({
                            ...settings,
                            filtros: { ...settings.filtros, filtroCombustibleCosto: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                          placeholder="Costo $"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="1000"
                          value={settings.filtros.filtroCombustibleIntervaloKm}
                          onChange={(e) => setSettings({
                            ...settings,
                            filtros: { ...settings.filtros, filtroCombustibleIntervaloKm: parseInt(e.target.value) || 10000 }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                          placeholder="Cada Km"
                        />
                      </div>
                    </div>

                    {/* Filtro Aire */}
                    <div className="grid grid-cols-3 gap-2 items-center bg-slate-900/80 p-2 rounded-lg text-xs">
                      <span className="text-slate-300 font-medium">Filtro de Aire</span>
                      <div>
                        <input
                          type="number"
                          step="1"
                          value={settings.filtros.filtroAireCosto}
                          onChange={(e) => setSettings({
                            ...settings,
                            filtros: { ...settings.filtros, filtroAireCosto: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                          placeholder="Costo $"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="1000"
                          value={settings.filtros.filtroAireIntervaloKm}
                          onChange={(e) => setSettings({
                            ...settings,
                            filtros: { ...settings.filtros, filtroAireIntervaloKm: parseInt(e.target.value) || 15000 }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                          placeholder="Cada Km"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Motor (Overhaul / Ajuste Completo Isuzu 4HF1) */}
            {activeSettingsTab === 'motor' && (
              <div className="space-y-4 pt-1">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Info className="w-4 h-4" />
                    Fondo de Reserva para Overhaul de Motor (Isuzu 4HF1 / 4HG1)
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Un motor Isuzu bien lubricado dura entre 350,000 y 450,000 km antes de ajuste mayor. Este fondo aparta centavos de dólar por cada kilómetro recorrido para que cuando llegue el momento de hacer motor completo, el dinero ya esté ahorrado del flete.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Costos de Ajuste y Armado de Motor
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">
                      CPK Motor: ${formatCpk(quoteResult.costoPorKm.motor)}/km
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Costo Repuestos de Motor ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={settings.motor.costoRepuestos}
                        onChange={(e) => setSettings({
                          ...settings,
                          motor: { ...settings.motor, costoRepuestos: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        title="Kit de camisas, pistones, anillos, conchas de biela y bancada, empacaduras, bomba de aceite"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Kit camisas, pistones, anillos</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Costo Armado y Mano de Obra ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={settings.motor.costoArmado}
                        onChange={(e) => setSettings({
                          ...settings,
                          motor: { ...settings.motor, costoArmado: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        title="Mecánico calificado + rectificadora de bloque, cigüeñal y cámara"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Mecánico + rectificadora</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Vida Útil Estimada Motor (Km)
                      </label>
                      <input
                        type="number"
                        min="50000"
                        step="25000"
                        value={settings.motor.vidaUtilKm}
                        onChange={(e) => setSettings({
                          ...settings,
                          motor: { ...settings.motor, vidaUtilKm: parseInt(e.target.value) || 400000 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Estándar: 350.000 a 450.000 km</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                    <span>Total Presupuesto Reconstrucción:</span>
                    <span className="font-bold font-mono text-amber-400">
                      {formatCurrency(settings.motor.costoRepuestos + settings.motor.costoArmado)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: Caja, Engrase y Tren */}
            {activeSettingsTab === 'caja_otros' && (
              <div className="space-y-4 pt-1">
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Lubricación Transmisión, Chasis y Suspensión
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">
                      CPK Otros: ${formatCpk(quoteResult.costoPorKm.otros)}/km
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Valvulina */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 p-2.5 rounded-lg">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Aceite Caja y Diferencial (Valvulina 80W90)</label>
                        <input
                          type="number"
                          step="5"
                          value={settings.otrosMantenimientos.valvulinaCajaDiferencialCosto}
                          onChange={(e) => setSettings({
                            ...settings,
                            otrosMantenimientos: {
                              ...settings.otrosMantenimientos,
                              valvulinaCajaDiferencialCosto: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                          placeholder="Costo $"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Intervalo de Cambio (Km)</label>
                        <input
                          type="number"
                          step="5000"
                          value={settings.otrosMantenimientos.valvulinaIntervaloKm}
                          onChange={(e) => setSettings({
                            ...settings,
                            otrosMantenimientos: {
                              ...settings.otrosMantenimientos,
                              valvulinaIntervaloKm: parseInt(e.target.value) || 35000
                            }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                          placeholder="Cada Km"
                        />
                      </div>
                    </div>

                    {/* Engrase Chasis */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 p-2.5 rounded-lg">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Engrase de Chasis y Cardán ($)</label>
                        <input
                          type="number"
                          step="2"
                          value={settings.otrosMantenimientos.engraseChasisCosto}
                          onChange={(e) => setSettings({
                            ...settings,
                            otrosMantenimientos: {
                              ...settings.otrosMantenimientos,
                              engraseChasisCosto: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Frecuencia Engrase (Km)</label>
                        <input
                          type="number"
                          step="1000"
                          value={settings.otrosMantenimientos.engraseIntervaloKm}
                          onChange={(e) => setSettings({
                            ...settings,
                            otrosMantenimientos: {
                              ...settings.otrosMantenimientos,
                              engraseIntervaloKm: parseInt(e.target.value) || 4000
                            }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Suspensión */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 p-2.5 rounded-lg">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Bujes de Ballesta y Amortiguadores ($)</label>
                        <input
                          type="number"
                          step="10"
                          value={settings.otrosMantenimientos.suspensionBujesCosto}
                          onChange={(e) => setSettings({
                            ...settings,
                            otrosMantenimientos: {
                              ...settings.otrosMantenimientos,
                              suspensionBujesCosto: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Intervalo Mantenimiento (Km)</label>
                        <input
                          type="number"
                          step="5000"
                          value={settings.otrosMantenimientos.suspensionIntervaloKm}
                          onChange={(e) => setSettings({
                            ...settings,
                            otrosMantenimientos: {
                              ...settings.otrosMantenimientos,
                              suspensionIntervaloKm: parseInt(e.target.value) || 50000
                            }
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Results, Breakdown & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Result Card: Suggested Freight Price */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Tarifa de Flete Sugerida
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {quoteResult.margenRealPorcentaje}% Margen
              </span>
            </div>

            <div className="space-y-1 text-center py-2 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <span className="text-xs text-slate-400 font-medium block">Precio Recomendado a Cobrar</span>
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
                {formatCurrency(quoteResult.precioSugerido)}
              </div>
              <span className="text-[11px] text-slate-400">
                Ruta: {quoteResult.kmTotalesEfectivos} km totales efectivas
              </span>
            </div>

            {/* Profit & Total Operational Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ganancia Neta</span>
                <span className="text-xl font-black text-emerald-400 mt-0.5 block">
                  {formatCurrency(quoteResult.utilidadNeta)}
                </span>
                <span className="text-[10px] text-slate-500">Utilidad libre de gastos</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Costo Operativo</span>
                <span className="text-xl font-black text-rose-400 mt-0.5 block">
                  {formatCurrency(quoteResult.gastosOperativosViaje.totalCostoOperativo)}
                </span>
                <span className="text-[10px] text-slate-500">Gastos + desgaste</span>
              </div>
            </div>

            {/* Operational Cost Breakdown Bar */}
            <div className="space-y-2 border-t border-slate-800/80 pt-4">
              <span className="text-xs font-bold text-slate-300 block">
                Composición del Costo Operativo del Flete
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    Combustible Diésel ({Math.round((quoteResult.kmTotalesEfectivos / tripInput.rendimientoKmLitro) * 10) / 10} L)
                  </span>
                  <span className="font-mono font-semibold">{formatCurrency(quoteResult.gastosOperativosViaje.combustible)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-rose-400" />
                    Desgaste Mecánico Total
                  </span>
                  <span className="font-mono font-semibold text-rose-300">{formatCurrency(quoteResult.gastosOperativosViaje.desgasteMecanico)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                    Chofer + Viáticos
                  </span>
                  <span className="font-mono font-semibold">{formatCurrency(quoteResult.gastosOperativosViaje.pagoChofer + quoteResult.gastosOperativosViaje.viaticos)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    Peajes y Otros
                  </span>
                  <span className="font-mono font-semibold">{formatCurrency(quoteResult.gastosOperativosViaje.peajes + quoteResult.gastosOperativosViaje.otrosGastos)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCopyWhatsAppQuote}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-slate-700 shadow-md"
              >
                {isCopiedAlert ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    ¡Cotización Copiada al Portapapeles!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    Copiar Cotización para WhatsApp
                  </>
                )}
              </button>

              {onOpenTripModalWithData && (
                <button
                  type="button"
                  onClick={handleRegisterAsTrip}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  Registrar Flete en Transporte Edan
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Piggy Bank / Maintenance Reserve Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Bolsa de Mantenimiento por Viaje ({quoteResult.kmTotalesEfectivos} km)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Monto que debes apartar de este flete para futuros reemplazos de piezas:
              </p>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-300">🛞 Fondo para Cauchos (6)</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatCurrency(quoteResult.reservaMantenimientoViaje.cauchos)}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-300">🛢️ Fondo Cambio de Aceite 15W40</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatCurrency(quoteResult.reservaMantenimientoViaje.aceite)}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-300">🔍 Fondo Kit de Filtros</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatCurrency(quoteResult.reservaMantenimientoViaje.filtros)}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-300">🛑 Fondo de Frenos</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatCurrency(quoteResult.reservaMantenimientoViaje.frenos)}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 block">⚙️ Fondo Repuestos Motor</span>
                  <span className="text-[10px] text-slate-500">Camisas, pistones, conchas, bomba</span>
                </div>
                <span className="font-mono font-bold text-amber-400">
                  {formatCurrency(quoteResult.reservaMantenimientoViaje.motorRepuestos)}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 block">🔧 Fondo Armado de Motor</span>
                  <span className="text-[10px] text-slate-500">Mano de obra + rectificadora</span>
                </div>
                <span className="font-mono font-bold text-amber-400">
                  {formatCurrency(quoteResult.reservaMantenimientoViaje.motorArmado)}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-300">🔩 Fondo Caja, Engrase y Tren</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatCurrency(quoteResult.reservaMantenimientoViaje.otros)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 p-3 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">Total a Reservar en Banco</span>
                <span className="text-[10px] text-slate-400">Desgaste mecánico total acumulado</span>
              </div>
              <span className="text-base font-black text-rose-400 font-mono">
                {formatCurrency(quoteResult.reservaMantenimientoViaje.totalDesgasteMecanico)}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
