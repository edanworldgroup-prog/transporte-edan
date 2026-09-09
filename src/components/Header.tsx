'use client';

import React from 'react';
import { 
  Truck, 
  PlusCircle, 
  Database, 
  ShieldCheck, 
  SlidersHorizontal, 
  Navigation,
  Building2,
  LogOut,
  Crown,
  ChevronDown
} from 'lucide-react';
import { Empresa } from '@/types/database';

interface HeaderProps {
  onOpenExpenseModal: () => void;
  onOpenVehicleModal: () => void;
  onOpenTripModal?: () => void;
  onOpenFleetModal?: () => void;
  empresaNombre?: string;
  userEmail?: string;
  userRol?: 'superadmin' | 'admin_empresa' | 'operador';
  onOpenSuperAdminModal?: () => void;
  onSignOut?: () => void;
  empresas?: Empresa[];
  selectedEmpresaId?: string;
  onSelectEmpresaId?: (empresaId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExpenseModal,
  onOpenVehicleModal,
  onOpenTripModal,
  onOpenFleetModal,
  empresaNombre = 'Transporte Edan',
  userEmail,
  userRol,
  onOpenSuperAdminModal,
  onSignOut,
  empresas = [],
  selectedEmpresaId,
  onSelectEmpresaId,
}) => {
  // Dynamic brand title matching user's custom company name
  const cleanEmpresaName = React.useMemo(() => {
    if (!empresaNombre) return 'EDAN';
    let name = empresaNombre.replace(/\s*\(Principal\)/i, '').trim();
    if (name.toLowerCase().startsWith('transporte ')) {
      name = name.slice(11).trim();
    } else if (name.toLowerCase().startsWith('transportes ')) {
      name = name.slice(12).trim();
    }
    return name.toUpperCase() || 'EDAN';
  }, [empresaNombre]);

  const isSuperAdmin = userRol === 'superadmin';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Left: Logo & Company Identification */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shadow-inner flex-shrink-0">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-1.5">
                  TRANSPORTE <span className="text-amber-500">{cleanEmpresaName}</span>
                </h1>

                {/* SuperAdmin Switcher if multiple companies exist */}
                {isSuperAdmin && empresas.length > 1 && onSelectEmpresaId && (
                  <div className="relative inline-block">
                    <select
                      value={selectedEmpresaId || ''}
                      onChange={(e) => onSelectEmpresaId(e.target.value)}
                      className="text-xs bg-slate-950 border border-amber-500/40 text-amber-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium cursor-pointer"
                      title="Cambiar vista de empresa cliente"
                    >
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                          🏢 {emp.nombre} {emp.estado_licencia === 'suspendido' ? '(Suspendida)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Plataforma de Control Operativo de Carga Pesada & Costos
              </p>
            </div>
          </div>

          {/* Right: Actions & User Session */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* SuperAdmin Master Control Button */}
            {isSuperAdmin && onOpenSuperAdminModal && (
              <button
                onClick={onOpenSuperAdminModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-lg transition-colors shadow-sm animate-pulse"
                title="Panel de Control Maestro para Administrar Empresas y Licencias"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Licencias SaaS</span>
                {empresas.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {empresas.length}
                  </span>
                )}
              </button>
            )}

            {/* Fleet Management */}
            {onOpenFleetModal && (
              <button
                onClick={onOpenFleetModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Gestionar Flota</span>
                <span className="sm:hidden">Flota</span>
              </button>
            )}

            {/* Add Vehicle */}
            <button
              onClick={onOpenVehicleModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm"
            >
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              <span>+ Vehículo</span>
            </button>

            {/* Add Trip */}
            {onOpenTripModal && (
              <button
                onClick={onOpenTripModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-md shadow-emerald-500/10"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>+ Viaje</span>
              </button>
            )}

            {/* Add Expense */}
            <button
              onClick={onOpenExpenseModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors shadow-md shadow-amber-500/10"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Gasto</span>
            </button>

            {/* User Session & Logout */}
            {onSignOut && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                {userEmail && (
                  <div className="hidden lg:flex flex-col text-right leading-tight">
                    <span className="text-[11px] font-semibold text-slate-300 max-w-[130px] truncate">
                      {userEmail}
                    </span>
                    <span className="text-[10px] text-amber-400 capitalize">
                      {userRol === 'superadmin' ? 'SuperAdmin' : 'Admin'}
                    </span>
                  </div>
                )}
                <button
                  onClick={onSignOut}
                  title="Cerrar Sesión"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
