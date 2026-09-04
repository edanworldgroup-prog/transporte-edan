'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehiculo, Gasto, ResumenCostos } from '@/types/database';
import { Header } from '@/components/Header';
import { MetricCards } from '@/components/MetricCards';
import { VehicleSelector } from '@/components/VehicleSelector';
import { ExpensesTable } from '@/components/ExpensesTable';
import { NewExpenseModal } from '@/components/NewExpenseModal';
import { NewVehicleModal } from '@/components/NewVehicleModal';
import { 
  Fuel, 
  Disc, 
  UserCheck, 
  Wrench, 
  Droplet, 
  RefreshCw,
  PieChart,
  Truck
} from 'lucide-react';

export default function Home() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [selectedPlaca, setSelectedPlaca] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);

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
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered expenses based on selected vehicle placa
  const filteredGastos = useMemo(() => {
    if (!selectedPlaca) return gastos;
    return gastos.filter((g) => g.vehiculo?.placa === selectedPlaca);
  }, [gastos, selectedPlaca]);

  // Selected vehicle object
  const selectedVehiculo = useMemo(() => {
    if (!selectedPlaca) return null;
    return vehiculos.find((v) => v.placa === selectedPlaca) || null;
  }, [vehiculos, selectedPlaca]);

  // Compute reactive summary KPIs
  const resumen = useMemo<ResumenCostos>(() => {
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
      alert('Error al eliminar: ' + err.message);
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
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Fleet & Vehicle Selector Bar */}
        <VehicleSelector
          vehiculos={vehiculos}
          selectedPlaca={selectedPlaca}
          onSelectPlaca={setSelectedPlaca}
        />

        {/* Refresh & Title Row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              {selectedVehiculo
                ? `Costo Operativo - Placa ${selectedVehiculo.placa} (${selectedVehiculo.marca} ${selectedVehiculo.modelo})`
                : 'Resumen Global de Costos - Toda la Flota'}
            </h2>
            <p className="text-xs text-slate-400">
              {selectedVehiculo
                ? `Chofer: ${selectedVehiculo.chofer_habitual || 'No asignado'} • ${selectedVehiculo.kilometraje_actual.toLocaleString()} Km acumulados`
                : `${vehiculos.length} vehículos registrados con seguimiento de gastos en tiempo real`}
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors hover:bg-slate-800"
            title="Recargar datos de Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <MetricCards
          resumen={resumen}
          selectedVehiculo={selectedVehiculo}
        />

        {/* Cost Breakdown Progress Bars */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              Distribución Porcentual del Gasto {selectedVehiculo ? `(${selectedVehiculo.placa})` : '(Flota)'}
            </h3>
            <span className="text-xs text-slate-400">
              Total Invertido: <strong className="text-amber-400">{formatCurrency(resumen.totalGeneral)}</strong>
            </span>
          </div>

          {resumen.totalGeneral > 0 ? (
            <div className="space-y-3">
              {/* Stacked Bar */}
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  style={{ width: `${(resumen.totalCombustible / resumen.totalGeneral) * 100}%` }}
                  className="bg-blue-500 h-full"
                  title={`Combustible: ${formatCurrency(resumen.totalCombustible)}`}
                />
                <div
                  style={{ width: `${(resumen.totalCauchos / resumen.totalGeneral) * 100}%` }}
                  className="bg-orange-500 h-full"
                  title={`Cauchos: ${formatCurrency(resumen.totalCauchos)}`}
                />
                <div
                  style={{ width: `${(resumen.totalChofer / resumen.totalGeneral) * 100}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Chofer: ${formatCurrency(resumen.totalChofer)}`}
                />
                <div
                  style={{ width: `${(resumen.totalAceite / resumen.totalGeneral) * 100}%` }}
                  className="bg-cyan-500 h-full"
                  title={`Aceite: ${formatCurrency(resumen.totalAceite)}`}
                />
                <div
                  style={{ width: `${(resumen.totalMecanica / resumen.totalGeneral) * 100}%` }}
                  className="bg-purple-500 h-full"
                  title={`Mecánica: ${formatCurrency(resumen.totalMecanica)}`}
                />
              </div>

              {/* Legend with values and percentages */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <div>
                    <span className="text-slate-400 block">Combustible</span>
                    <strong className="text-white">{formatCurrency(resumen.totalCombustible)}</strong>
                    <span className="text-slate-500 text-[10px] ml-1">
                      ({Math.round((resumen.totalCombustible / resumen.totalGeneral) * 100 || 0)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <div>
                    <span className="text-slate-400 block">Cauchos</span>
                    <strong className="text-white">{formatCurrency(resumen.totalCauchos)}</strong>
                    <span className="text-slate-500 text-[10px] ml-1">
                      ({Math.round((resumen.totalCauchos / resumen.totalGeneral) * 100 || 0)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <span className="text-slate-400 block">Chofer / Viáticos</span>
                    <strong className="text-white">{formatCurrency(resumen.totalChofer)}</strong>
                    <span className="text-slate-500 text-[10px] ml-1">
                      ({Math.round((resumen.totalChofer / resumen.totalGeneral) * 100 || 0)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <div>
                    <span className="text-slate-400 block">Aceite y Filtros</span>
                    <strong className="text-white">{formatCurrency(resumen.totalAceite)}</strong>
                    <span className="text-slate-500 text-[10px] ml-1">
                      ({Math.round((resumen.totalAceite / resumen.totalGeneral) * 100 || 0)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <div>
                    <span className="text-slate-400 block">Mecánica / Taller</span>
                    <strong className="text-white">{formatCurrency(resumen.totalMecanica)}</strong>
                    <span className="text-slate-500 text-[10px] ml-1">
                      ({Math.round((resumen.totalMecanica / resumen.totalGeneral) * 100 || 0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No hay gastos registrados todavía para calcular la distribución. Haz clic en "Registrar Gasto" arriba.
            </p>
          )}
        </div>

        {/* Expenses List & Filter Table */}
        <ExpensesTable
          gastos={filteredGastos}
          onDeleteGasto={handleDeleteGasto}
          isLoading={isLoading}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Transporte Edan © {new Date().getFullYear()} • Sistema de Control de Carga Pesada conectado a Supabase Cloud
      </footer>

      {/* Modals */}
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

    </div>
  );
}
