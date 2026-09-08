'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { 
  Vehiculo, 
  Gasto, 
  Viaje, 
  ResumenCostos, 
  BalanceMensual, 
  RentabilidadVehiculo,
  Empresa,
  UsuarioPerfil 
} from '@/types/database';
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
import { LoginScreen } from '@/components/LoginScreen';
import { SuperAdminModal } from '@/components/SuperAdminModal';
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
  Navigation,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  LogOut,
  Building2,
  Lock
} from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Home() {
  // Auth & Session State
  const [session, setSession] = useState<Session | null>(null);
  const [usuarioPerfil, setUsuarioPerfil] = useState<UsuarioPerfil | null>(null);
  const [activeEmpresa, setActiveEmpresa] = useState<Empresa | null>(null);
  const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState<boolean>(false);

  // Operational Data State
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

  // Fetch initial data scoped strictly to active company
  const fetchData = async (overrideEmpresaId?: string) => {
    const targetEmpresaId = overrideEmpresaId || activeEmpresa?.id;
    if (!targetEmpresaId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch Vehicles
      const { data: vData, error: vError } = await supabase
        .from('transporte_vehiculos')
        .select('*')
        .eq('empresa_id', targetEmpresaId)
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
        .eq('empresa_id', targetEmpresaId)
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
        .eq('empresa_id', targetEmpresaId)
        .order('fecha_salida', { ascending: false });

      if (tError) throw tError;
      setViajes(tData || []);
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth session on mount & subscribe to changes
  const initSessionData = async (activeSession: Session) => {
    setIsAuthChecking(true);
    try {
      const { data: perfilData, error: perfilError } = await supabase
        .from('transporte_usuarios')
        .select(`
          *,
          empresa:transporte_empresas (*)
        `)
        .eq('user_id', activeSession.user.id)
        .maybeSingle();

      if (perfilError) {
        console.error('Error al cargar perfil de usuario:', perfilError);
      }

      if (perfilData) {
        const perfil = perfilData as UsuarioPerfil;
        setUsuarioPerfil(perfil);
        if (perfil.empresa) {
          setActiveEmpresa(perfil.empresa);
          await fetchData(perfil.empresa.id);
        }

        if (perfil.rol === 'superadmin') {
          const { data: empList } = await supabase
            .from('transporte_empresas')
            .select('*')
            .order('created_at', { ascending: false });
          if (empList) setAllEmpresas(empList);
        }
      }
    } catch (err) {
      console.error('Error en autenticación:', err);
    } finally {
      setIsAuthChecking(false);
    }
  };

  useEffect(() => {
    // 1. Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        initSessionData(session);
      } else {
        setIsAuthChecking(false);
        setIsLoading(false);
      }
    });

    // 2. Auth State Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        initSessionData(session);
      } else {
        setUsuarioPerfil(null);
        setActiveEmpresa(null);
        setVehiculos([]);
        setGastos([]);
        setViajes([]);
        setIsAuthChecking(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // SuperAdmin: switch company view
  const handleSelectEmpresa = async (newEmpresaId: string) => {
    const found = allEmpresas.find((e) => e.id === newEmpresaId);
    if (found) {
      setActiveEmpresa(found);
      setSelectedPlaca('');
      await fetchData(found.id);
    }
  };

  // Refresh companies list after SuperAdmin changes
  const handleEmpresasUpdated = async () => {
    const { data: empList } = await supabase
      .from('transporte_empresas')
      .select('*')
      .order('created_at', { ascending: false });
    if (empList) {
      setAllEmpresas(empList);
      if (activeEmpresa) {
        const refreshed = empList.find((e) => e.id === activeEmpresa.id);
        if (refreshed) setActiveEmpresa(refreshed);
      }
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUsuarioPerfil(null);
    setActiveEmpresa(null);
    setVehiculos([]);
    setGastos([]);
    setViajes([]);
  };

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

  // Update trip status
  const handleUpdateEstadoViaje = async (id: string, nuevoEstado: 'en_ruta' | 'completado' | 'cancelado') => {
    try {
      const { error } = await supabase
        .from('transporte_viajes')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
      setViajes((prev) =>
        prev.map((v) => (v.id === id ? { ...v, estado: nuevoEstado } : v))
      );
    } catch (err: any) {
      alert('Error al actualizar estado del viaje: ' + err.message);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // 1. Loading Initial Authentication Check
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4">
          <Truck className="w-8 h-8 text-amber-500 animate-bounce" />
          <div>
            <h1 className="text-xl font-black text-white">TRANSPORTE <span className="text-amber-500">EDAN</span></h1>
            <p className="text-xs text-slate-400">Verificando credenciales de acceso...</p>
          </div>
        </div>
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  // 2. Unauthenticated: Render SaaS Login Screen
  if (!session) {
    return (
      <LoginScreen
        onLoginSuccess={async () => {
          const { data: { session: s } } = await supabase.auth.getSession();
          if (s) {
            await initSessionData(s);
          }
        }}
      />
    );
  }

  // 3. User with no company profile assigned
  if (!usuarioPerfil || !activeEmpresa) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto text-amber-500">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Cuenta Sin Empresa Asignada</h2>
          <p className="text-xs text-slate-400">
            El usuario <span className="text-amber-400 font-semibold">{session.user.email}</span> no se encuentra vinculado a ninguna empresa de transporte registrada.
          </p>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
            Comunícate con el Administrador del sistema para que cree tu empresa y asigne tu licencia.
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // 4. Check License Status (Suspended or Expired) - Only block non-superadmins
  const isSuperAdmin = usuarioPerfil.rol === 'superadmin';
  const isSuspended = activeEmpresa.estado_licencia === 'suspendido' && !isSuperAdmin;
  const isExpired = (() => {
    if (isSuperAdmin) return false;
    if (!activeEmpresa.fecha_vencimiento) return false;
    const exp = new Date(activeEmpresa.fecha_vencimiento);
    exp.setHours(23, 59, 59, 999);
    return new Date() > exp;
  })();

  if (isSuspended || isExpired) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full mb-2">
              {isSuspended ? 'Licencia Suspendida' : 'Licencia Vencida'}
            </span>
            <h2 className="text-xl font-bold text-white">Acceso Temporalmente Inhabilitado</h2>
            <p className="text-xs text-slate-400 mt-1">
              Empresa: <strong className="text-slate-200">{activeEmpresa.nombre}</strong>
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
            <p>
              {isSuspended
                ? 'El acceso para tu empresa ha sido suspendido temporalmente por el área de licencias.'
                : `Tu suscripción de servicio finalizó el ${activeEmpresa.fecha_vencimiento}.`}
            </p>
            <p className="text-slate-400">
              Para renovar tu licencia comercial, activar el servicio o ampliar vehículos, por favor contáctanos:
            </p>
            <div className="pt-2 border-t border-slate-800/80 font-medium text-amber-400">
              📞 Soporte & Ventas: contacto@transporte-edan.com
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // 5. Main Dashboard View
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Navigation */}
      <Header
        onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        onOpenTripModal={() => setIsTripModalOpen(true)}
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onOpenFleetModal={() => setIsFleetModalOpen(true)}
        empresaNombre={activeEmpresa.nombre}
        userEmail={session.user.email}
        userRol={usuarioPerfil.rol}
        onOpenSuperAdminModal={() => setIsSuperAdminModalOpen(true)}
        onSignOut={handleSignOut}
        empresas={allEmpresas}
        selectedEmpresaId={activeEmpresa.id}
        onSelectEmpresaId={handleSelectEmpresa}
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

        {/* Navigation Tabs (Balances / Viajes / Gastos) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('balance')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'balance'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Estado de Resultados & Balance
            </button>
            <button
              onClick={() => setActiveTab('viajes')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'viajes'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Navigation className="w-4 h-4" />
              Fletes e Ingresos ({filteredViajes.length})
            </button>
            <button
              onClick={() => setActiveTab('gastos')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gastos'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Gastos Operativos ({filteredGastos.length})
            </button>
          </div>

          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors hover:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* TAB 1: BALANCE & ESTADO DE RESULTADOS */}
        {activeTab === 'balance' && (
          <div className="space-y-6">
            <MonthlyFinancialSummary balance={balanceMensual} />
            <VehicleProfitabilityTable
              rentabilidades={rentabilidadesVehiculos}
              onSelectPlaca={setSelectedPlaca}
              mesLabel={mesLabel}
            />
          </div>
        )}

        {/* TAB 2: VIAJES Y FLETES */}
        {activeTab === 'viajes' && (
          <div className="space-y-6">
            {/* Quick summary strip for trips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-xs text-slate-400 font-medium">Total Facturado Fletes</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {formatCurrency(balanceMensual.totalIngresos)}
                </p>
                <span className="text-[11px] text-slate-500">En {balanceMensual.mesLabel}</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-xs text-slate-400 font-medium">Viajes Realizados</span>
                <p className="text-2xl font-black text-white mt-1">
                  {filteredViajes.length}
                </p>
                <span className="text-[11px] text-slate-500">Registrados en corte</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Acción Rápida</span>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">Añadir Nuevo Flete</p>
                </div>
                <button
                  onClick={() => setIsTripModalOpen(true)}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20"
                >
                  + Nuevo Viaje
                </button>
              </div>
            </div>

            <TripsTable
              viajes={filteredViajes}
              onDeleteViaje={handleDeleteViaje}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* TAB 3: GASTOS Y COSTOS */}
        {activeTab === 'gastos' && (
          <div className="space-y-6">
            {/* Key Metric Cards */}
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
        Transporte Edan © {new Date().getFullYear()} • Plataforma SaaS de Control de Carga Pesada & Balances
      </footer>

      {/* Modals */}
      <NewTripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        vehiculos={vehiculos}
        defaultPlaca={selectedPlaca}
        onTripCreated={() => fetchData()}
        empresaId={activeEmpresa.id}
      />

      <NewExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        vehiculos={vehiculos}
        defaultPlaca={selectedPlaca}
        onExpenseCreated={() => fetchData()}
        empresaId={activeEmpresa.id}
      />

      <NewVehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onVehicleCreated={() => fetchData()}
        empresaId={activeEmpresa.id}
        limiteVehiculos={activeEmpresa.limite_vehiculos}
        totalVehiculosActuales={vehiculos.length}
      />

      <ManageFleetModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        vehiculos={vehiculos}
        gastos={gastos}
        onFleetUpdated={() => fetchData()}
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

      {/* SuperAdmin Master Console Modal */}
      {isSuperAdmin && (
        <SuperAdminModal
          isOpen={isSuperAdminModalOpen}
          onClose={() => setIsSuperAdminModalOpen(false)}
          onEmpresasUpdated={handleEmpresasUpdated}
        />
      )}

    </div>
  );
}
