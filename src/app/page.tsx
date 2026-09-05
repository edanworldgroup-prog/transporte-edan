'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehiculo, Gasto, Viaje, ResumenCostos, BalanceMensual, RentabilidadVehiculo } from '@/types/database';
import { Header } from '@/components/Header';
import { MonthlySelector } from '@/components/MonthlySelector';
import { MonthlyFinancialSummary } from '@/components/MonthlyFinancialSummary';
import { VehicleProfitabilityTable } from '@/components/VehicleProfitabilityTable';
import { VehicleSelector } from '@/components/VehicleSelector';
import { MetricCards } from '@/components/MetricCards';
import { ExpensesTable } from '@/components/ExpensesTable';
import { TripsTable } from '@/components/TripsTable';
import { NewExpenseModal } from '@/components/NewExpenseModal';
import { NewTripModal } from '@/components/NewTripModal';
import { NewVehicleModal } from '@/components/NewVehicleModal';
import { ManageFleetModal } from '@/components/ManageFleetModal';
import { EditVehicleModal } from '@/components/EditVehicleModal';
import { 
  Fuel, 
  Disc, 
  UserCheck, 
  Wrench, 
  Droplet, 
  RefreshCw,
  PieChart,
  Truck,
  TrendingUp,
  Receipt,
  Navigation
} from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Home() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [selectedPlaca, setSelectedPlaca] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Month-by-month accounting state (default to current year-month, e.g. "2026-09")
  const getCurrentYearMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());
  const [isAllTime, setIsAllTime] = useState<boolean>(false);

  // Navigation tab state: 'balance' | 'viajes' | 'gastos'
  const [activeTab, setActiveTab] = useState<'balance' | 'viajes' | 'gastos'>('balance');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState<boolean>(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState<boolean>(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Vehicles
      const { data: vData, error: vError } = await supabase
        .from('transporte_vehiculos')
        .select('*')
        .order('created_at', { ascending: false });

      if (vError) throw vError;
      setVehiculos(vData || []);

      // 2. Fetch Expenses with vehicle joined
      const { data: gData, error: gError } = await supabase
        .from('transporte_gastos')
        .select(`
          *,
          vehiculo:transporte_vehiculos (*)
        `)
        .order('fecha', { ascending: false });

      if (gError) throw gError;
      setGastos(gData || []);

      // 3. Fetch Trips (Fletes / Viajes) with vehicle joined
      const { data: tData, error: tError } = await supabase
        .from('transporte_viajes')
        .select(`
          *,
          vehiculo:transporte_vehiculos (*)
        `)
        .order('fecha_salida', { ascending: false });

      if (tError) throw tError;
      setViajes(tData || []);
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format month label
  const mesLabel = useMemo(() => {
    if (isAllTime) return 'Todo el Histórico';
    const [y, m] = selectedMonth.split('-');
    const mNum = parseInt(m, 10);
    return `${MESES[mNum - 1] || m} ${y}`;
  }, [selectedMonth, isAllTime]);

  // Filtered Expenses by Month and Placa
  const filteredGastos = useMemo(() => {
    return gastos.filter((g) => {
      const matchMonth = isAllTime || g.fecha.startsWith(selectedMonth);
      const matchPlaca = !selectedPlaca || g.vehiculo?.placa === selectedPlaca;
      return matchMonth && matchPlaca;
    });
  }, [gastos, selectedMonth, isAllTime, selectedPlaca]);

  // Filtered Trips (Viajes) by Month and Placa
  const filteredViajes = useMemo(() => {
    return viajes.filter((v) => {
      const matchMonth = isAllTime || v.fecha_salida.startsWith(selectedMonth);
      const matchPlaca = !selectedPlaca || v.vehiculo?.placa === selectedPlaca;
      return matchMonth && matchPlaca;
    });
  }, [viajes, selectedMonth, isAllTime, selectedPlaca]);

  // Selected vehicle object
  const selectedVehiculo = useMemo(() => {
    if (!selectedPlaca) return null;
    return vehiculos.find((v) => v.placa === selectedPlaca) || null;
  }, [vehiculos, selectedPlaca]);

  // Financial Balance (P&L) of the active month/cutoff
  const balanceMensual = useMemo<BalanceMensual>(() => {
    const totalIngresos = filteredViajes.reduce(
      (acc, v) => acc + Number(v.ingreso_flete || 0),
      0
    );
    const totalEgresos = filteredGastos.reduce(
      (acc, g) => acc + Number(g.monto_total || 0),
      0
    );
    const utilidadNeta = totalIngresos - totalEgresos;
    const margenPorcentaje =
      totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;

    return {
      mesStr: selectedMonth,
      mesLabel,
      totalIngresos,
      totalEgresos,
      utilidadNeta,
      margenPorcentaje,
      fletesCount: filteredViajes.length,
      gastosCount: filteredGastos.length,
    };
  }, [filteredViajes, filteredGastos, selectedMonth, mesLabel]);

  // Vehicle Profitability Ranking (Rentabilidad por Vehículo)
  const rentabilidadesVehiculos = useMemo<RentabilidadVehiculo[]>(() => {
    const vehiculosList = selectedPlaca
      ? vehiculos.filter((v) => v.placa === selectedPlaca)
      : vehiculos;

    return vehiculosList.map((v) => {
      const vViajes = viajes.filter((t) => {
        const matchV = t.vehiculo_id === v.id;
        const matchM = isAllTime || t.fecha_salida.startsWith(selectedMonth);
        return matchV && matchM;
      });

      const vGastos = gastos.filter((g) => {
        const matchV = g.vehiculo_id === v.id;
        const matchM = isAllTime || g.fecha.startsWith(selectedMonth);
        return matchV && matchM;
      });

      const ingresos = vViajes.reduce((acc, t) => acc + Number(t.ingreso_flete || 0), 0);
      const egresos = vGastos.reduce((acc, g) => acc + Number(g.monto_total || 0), 0);
      const utilidadNeta = ingresos - egresos;
      const margenPorcentaje = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0;

      return {
        vehiculo: v,
        fletesCount: vViajes.length,
        ingresos,
        egresos,
        utilidadNeta,
        margenPorcentaje,
      };
    });
  }, [vehiculos, viajes, gastos, selectedMonth, isAllTime, selectedPlaca]);

  // Expense breakdown metrics (KPIs)
  const resumenGastos = useMemo<ResumenCostos>(() => {
    let totalGeneral = 0;
    let totalCombustible = 0;
    let totalCauchos = 0;
    let totalChofer = 0;
    let totalAceite = 0;
    let totalMecanica = 0;
    let totalLitrosCombustible = 0;

    filteredGastos.forEach((g) => {
      const monto = Number(g.monto_total) || 0;
      totalGeneral += monto;

      switch (g.categoria) {
        case 'combustible':
          totalCombustible += monto;
          if (g.detalles && (g.detalles as any).litros) {
            totalLitrosCombustible += Number((g.detalles as any).litros) || 0;
          }
          break;
        case 'caucho':
          totalCauchos += monto;
          break;
        case 'chofer':
          totalChofer += monto;
          break;
        case 'aceite_lubricante':
          totalAceite += monto;
          break;
        case 'mecanica':
          totalMecanica += monto;
          break;
      }
    });

    return {
      totalGeneral,
      totalCombustible,
      totalCauchos,
      totalChofer,
      totalAceite,
      totalMecanica,
      totalLitrosCombustible,
      gastosCount: filteredGastos.length,
      vehiculosCount: selectedVehiculo ? 1 : vehiculos.length,
    };
  }, [filteredGastos, selectedVehiculo, vehiculos.length]);

  // Delete expense
  const handleDeleteGasto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transporte_gastos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setGastos((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      alert('Error al eliminar gasto: ' + err.message);
    }
  };

  // Delete trip
  const handleDeleteViaje = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transporte_viajes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setViajes((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      alert('Error al eliminar viaje: ' + err.message);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Navigation */}
      <Header
        onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        onOpenTripModal={() => setIsTripModalOpen(true)}
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onOpenFleetModal={() => setIsFleetModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Month Selector / Corte Mensual */}
        <MonthlySelector
          selectedYearMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
          isAllTime={isAllTime}
          onToggleAllTime={setIsAllTime}
        />

        {/* Fleet & Vehicle Selector Bar */}
        <VehicleSelector
          vehiculos={vehiculos}
          selectedPlaca={selectedPlaca}
          onSelectPlaca={setSelectedPlaca}
          onEditVehicle={(v) => setEditingVehiculo(v)}
        />

        {/* View Tabs & Refresh Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          
          {/* 3 Main View Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('balance')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'balance'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Balance & Corte Mensual</span>
            </button>

            <button
              onClick={() => setActiveTab('viajes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'viajes'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Fletes y Viajes ({filteredViajes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gastos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'gastos'
                  ? 'bg-blue-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Gastos y Taller ({filteredGastos.length})</span>
            </button>
          </div>

          {/* Sync status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Corte activo: <strong className="text-white">{mesLabel}</strong>
            </span>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors hover:bg-slate-800"
              title="Recargar datos de Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
          </div>

        </div>

        {/* ========================================================= */}
        {/* TAB 1: BALANCE & CORTE MENSUAL (P&L)                      */}
        {/* ========================================================= */}
        {activeTab === 'balance' && (
          <div className="space-y-6">
            {/* Master Income, Expenses & Net Profit Cards */}
            <MonthlyFinancialSummary
              balance={balanceMensual}
              vehicleName={selectedVehiculo ? `Placa ${selectedVehiculo.placa}` : null}
            />

            {/* Vehicle by Vehicle Profitability Table */}
            <VehicleProfitabilityTable
              rentabilidades={rentabilidadesVehiculos}
              onSelectPlaca={setSelectedPlaca}
              mesLabel={mesLabel}
            />

            {/* Cost Breakdown Progress Bars */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-amber-500" />
                  Distribución de Gastos Operativos ({mesLabel})
                </h3>
                <span className="text-xs text-slate-400">
                  Total Egresos: <strong className="text-red-400">{formatCurrency(resumenGastos.totalGeneral)}</strong>
                </span>
              </div>

              {resumenGastos.totalGeneral > 0 ? (
                <div className="space-y-3">
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                    <div
                      style={{ width: `${(resumenGastos.totalCombustible / resumenGastos.totalGeneral) * 100}%` }}
                      className="bg-blue-500 h-full"
                      title={`Combustible: ${formatCurrency(resumenGastos.totalCombustible)}`}
                    />
                    <div
                      style={{ width: `${(resumenGastos.totalCauchos / resumenGastos.totalGeneral) * 100}%` }}
                      className="bg-orange-500 h-full"
                      title={`Cauchos: ${formatCurrency(resumenGastos.totalCauchos)}`}
                    />
                    <div
                      style={{ width: `${(resumenGastos.totalChofer / resumenGastos.totalGeneral) * 100}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Chofer: ${formatCurrency(resumenGastos.totalChofer)}`}
                    />
                    <div
                      style={{ width: `${(resumenGastos.totalAceite / resumenGastos.totalGeneral) * 100}%` }}
                      className="bg-cyan-500 h-full"
                      title={`Aceite: ${formatCurrency(resumenGastos.totalAceite)}`}
                    />
                    <div
                      style={{ width: `${(resumenGastos.totalMecanica / resumenGastos.totalGeneral) * 100}%` }}
                      className="bg-purple-500 h-full"
                      title={`Mecánica: ${formatCurrency(resumenGastos.totalMecanica)}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <div>
                        <span className="text-slate-400 block">Combustible</span>
                        <strong className="text-white">{formatCurrency(resumenGastos.totalCombustible)}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <div>
                        <span className="text-slate-400 block">Cauchos</span>
                        <strong className="text-white">{formatCurrency(resumenGastos.totalCauchos)}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <span className="text-slate-400 block">Chofer</span>
                        <strong className="text-white">{formatCurrency(resumenGastos.totalChofer)}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      <div>
                        <span className="text-slate-400 block">Aceite & Filtros</span>
                        <strong className="text-white">{formatCurrency(resumenGastos.totalAceite)}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <div>
                        <span className="text-slate-400 block">Mecánica / Taller</span>
                        <strong className="text-white">{formatCurrency(resumenGastos.totalMecanica)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No hay gastos registrados en este período ({mesLabel}).
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: FLETES Y VIAJES (INGRESOS)                         */}
        {/* ========================================================= */}
        {activeTab === 'viajes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-500" />
                  Servicios de Fletes y Viajes — {mesLabel}
                </h2>
                <p className="text-xs text-slate-400">
                  Ingresos facturados por flete de carga pesada
                </p>
              </div>
              <button
                onClick={() => setIsTripModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                + Registrar Flete
              </button>
            </div>

            <TripsTable
              viajes={filteredViajes}
              onDeleteViaje={handleDeleteViaje}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: GASTOS Y MANTENIMIENTO (EGRESOS)                   */}
        {/* ========================================================= */}
        {activeTab === 'gastos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" />
                  Gastos Operativos y Mantenimiento — {mesLabel}
                </h2>
                <p className="text-xs text-slate-400">
                  Combustible, cauchos, viáticos de chofer y servicios de taller
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors shadow-sm"
              >
                <Receipt className="w-3.5 h-3.5" />
                + Registrar Gasto
              </button>
            </div>

            {/* Detailed Metric Cards for Expenses */}
            <MetricCards
              resumen={resumenGastos}
              selectedVehiculo={selectedVehiculo}
            />

            {/* Expenses List & Filter Table */}
            <ExpensesTable
              gastos={filteredGastos}
              onDeleteGasto={handleDeleteGasto}
              isLoading={isLoading}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Transporte Edan © {new Date().getFullYear()} • Sistema de Control de Carga Pesada & Balances conectado a Supabase Cloud
      </footer>

      {/* Modals */}
      <NewTripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        vehiculos={vehiculos}
        defaultPlaca={selectedPlaca}
        onTripCreated={fetchData}
      />

      <NewExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        vehiculos={vehiculos}
        defaultPlaca={selectedPlaca}
        onExpenseCreated={fetchData}
      />

      <NewVehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onVehicleCreated={fetchData}
      />

      <ManageFleetModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        vehiculos={vehiculos}
        gastos={gastos}
        onFleetUpdated={fetchData}
        onVehicleDeleted={(placa) => {
          if (selectedPlaca === placa) {
            setSelectedPlaca('');
          }
        }}
        onEditVehicle={(vehiculo) => {
          setIsFleetModalOpen(false);
          setEditingVehiculo(vehiculo);
        }}
      />

      <EditVehicleModal
        isOpen={!!editingVehiculo}
        onClose={() => setEditingVehiculo(null)}
        vehiculo={editingVehiculo}
        onVehicleUpdated={async (newPlaca) => {
          if (selectedPlaca === editingVehiculo?.placa) {
            setSelectedPlaca(newPlaca);
          }
          await fetchData();
        }}
      />

    </div>
  );
}
