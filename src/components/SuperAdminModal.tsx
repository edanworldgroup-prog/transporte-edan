'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  Truck, 
  Key, 
  Mail, 
  Lock, 
  Power, 
  Loader2, 
  UserCheck, 
  Search,
  Check
} from 'lucide-react';
import { Empresa } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmpresasUpdated: () => Promise<void>;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({
  isOpen,
  onClose,
  onEmpresasUpdated,
}) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'lista' | 'crear'>('lista');
  const [busqueda, setBusqueda] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form states for creating new client company
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [rifRuc, setRifRuc] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [passwordCliente, setPasswordCliente] = useState('');
  const [diasLicencia, setDiasLicencia] = useState('30');
  const [limiteVehiculos, setLimiteVehiculos] = useState('15');
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEmpresas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transporte_empresas')
        .select(`
          *,
          vehiculos:transporte_vehiculos(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((e: any) => ({
        ...e,
        vehiculos_count: e.vehiculos?.[0]?.count || 0,
      }));

      setEmpresas(formatted);
    } catch (err) {
      console.error('Error al cargar empresas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmpresas();
      setCreateMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle Activo / Suspendido
  const handleToggleEstado = async (empresa: Empresa) => {
    const nuevoEstado = empresa.estado_licencia === 'activo' ? 'suspendido' : 'activo';
    const confirmMsg = nuevoEstado === 'suspendido'
      ? `¿Estás seguro de SUSPENDER la licencia de "${empresa.nombre}"? Sus usuarios no podrán ingresar al sistema.`
      : `¿Reactivar la licencia de "${empresa.nombre}"?`;

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(empresa.id);
    try {
      const { error } = await supabase
        .from('transporte_empresas')
        .update({ estado_licencia: nuevoEstado })
        .eq('id', empresa.id);

      if (error) throw error;
      await fetchEmpresas();
      await onEmpresasUpdated();
    } catch (err: any) {
      alert('Error al actualizar estado: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Extend License (+30 days / +1 year)
  const handleExtendLicencia = async (empresa: Empresa, dias: number) => {
    setActionLoadingId(empresa.id);
    try {
      const fechaActual = new Date(empresa.fecha_vencimiento || new Date());
      fechaActual.setDate(fechaActual.getDate() + dias);
      const nuevaFecha = fechaActual.toISOString().split('T')[0];

      const { error } = await supabase
        .from('transporte_empresas')
        .update({
          fecha_vencimiento: nuevaFecha,
          estado_licencia: 'activo',
        })
        .eq('id', empresa.id);

      if (error) throw error;
      await fetchEmpresas();
      await onEmpresasUpdated();
    } catch (err: any) {
      alert('Error al extender licencia: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create new company and user
  const handleCrearEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg(null);

    if (!nombreEmpresa.trim() || !emailCliente.trim() || !passwordCliente.trim()) {
      setCreateMsg({ type: 'error', text: 'Por favor completa todos los campos requeridos.' });
      return;
    }

    if (passwordCliente.length < 6) {
      setCreateMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setIsCreating(true);

    try {
      // Call Postgres RPC function
      const { data, error } = await supabase.rpc('crear_empresa_cliente', {
        p_nombre_empresa: nombreEmpresa.trim(),
        p_rif_ruc: rifRuc.trim() || null,
        p_dias_licencia: parseInt(diasLicencia, 10),
        p_limite_vehiculos: parseInt(limiteVehiculos, 10),
        p_email: emailCliente.trim().toLowerCase(),
        p_password: passwordCliente.trim(),
      });

      if (error) throw error;

      if (data && data.success === false) {
        throw new Error(data.error || 'Error al crear la empresa');
      }

      setCreateMsg({
        type: 'success',
        text: `¡Empresa "${nombreEmpresa}" creada exitosamente! Se configuró el usuario ${emailCliente}.`,
      });

      // Reset form
      setNombreEmpresa('');
      setRifRuc('');
      setEmailCliente('');
      setPasswordCliente('');
      await fetchEmpresas();
      await onEmpresasUpdated();
    } catch (err: any) {
      console.error(err);
      setCreateMsg({ type: 'error', text: err.message || 'Error al crear empresa' });
    } finally {
      setIsCreating(false);
    }
  };

  const filteredEmpresas = empresas.filter(
    (e) =>
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.rif_ruc && e.rif_ruc.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Panel de Licencias y Empresas (SuperAdmin)
              </h3>
              <p className="text-xs text-slate-400">
                Administra los clientes que han contratado el sistema de transporte
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs: Ver Empresas vs Crear Empresa */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('lista')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeSubTab === 'lista'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              Empresas Clientes ({empresas.length})
            </button>
            <button
              onClick={() => setActiveSubTab('crear')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeSubTab === 'crear'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              + Dar de Alta Nueva Empresa
            </button>
          </div>

          {activeSubTab === 'lista' && (
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar empresa, RIF..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* Tab 1: List of Companies & Licenses */}
        {activeSubTab === 'lista' && (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Flota</th>
                  <th className="py-3 px-4">Vencimiento Licencia</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Cargando licencias de clientes...
                    </td>
                  </tr>
                ) : filteredEmpresas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No hay empresas registradas. Haz clic en "+ Dar de Alta Nueva Empresa".
                    </td>
                  </tr>
                ) : (
                  filteredEmpresas.map((empresa) => {
                    const isOperating = actionLoadingId === empresa.id;
                    const isActivo = empresa.estado_licencia === 'activo';
                    const isVencido = new Date(empresa.fecha_vencimiento) < new Date();

                    return (
                      <tr
                        key={empresa.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Nombre & RIF */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                            {empresa.nombre}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            {empresa.rif_ruc || 'Sin RIF/RUC'}
                          </div>
                        </td>

                        {/* Flota / Camiones */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Truck className="w-3.5 h-3.5 text-cyan-400" />
                            <span><strong>{empresa.vehiculos_count || 0}</strong> / {empresa.limite_vehiculos} camiones</span>
                          </div>
                        </td>

                        {/* Fecha de Vencimiento */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{empresa.fecha_vencimiento}</span>
                            {isVencido && (
                              <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/20">
                                VENCIDA
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Estado Licencia */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isActivo && !isVencido
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                          >
                            {isActivo && !isVencido ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <ShieldAlert className="w-3 h-3" />
                            )}
                            {isActivo && !isVencido ? 'ACTIVA' : 'SUSPENDIDA'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* Toggle Activar/Suspender */}
                            <button
                              onClick={() => handleToggleEstado(empresa)}
                              disabled={isOperating}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                isActivo
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                              title={isActivo ? 'Suspender acceso a la empresa' : 'Reactivar acceso'}
                            >
                              <Power className="w-3 h-3" />
                              {isActivo ? 'Suspender' : 'Activar'}
                            </button>

                            {/* Extender +30 Días */}
                            <button
                              onClick={() => handleExtendLicencia(empresa, 30)}
                              disabled={isOperating}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-colors"
                              title="Renovar licencia por 30 días adicionales"
                            >
                              +30 días
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
        )}

        {/* Tab 2: Create New Company Form */}
        {activeSubTab === 'crear' && (
          <form onSubmit={handleCrearEmpresa} className="p-6 space-y-4">
            {createMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                  createMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {createMsg.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{createMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de la Empresa de Transporte *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Transportes Rápidos Los Llanos C.A."
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  RIF / RUC / Identificación Fiscal
                </label>
                <input
                  type="text"
                  placeholder="Ej: J-40891234-1"
                  value={rifRuc}
                  onChange={(e) => setRifRuc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                Credenciales de Acceso para el Cliente
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Correo Electrónico (Usuario) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@transportellosllanos.com"
                    value={emailCliente}
                    onChange={(e) => setEmailCliente(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Contraseña Inicial *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={passwordCliente}
                    onChange={(e) => setPasswordCliente(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vigencia de la Licencia
                </label>
                <select
                  value={diasLicencia}
                  onChange={(e) => setDiasLicencia(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="30">1 Mes (30 días)</option>
                  <option value="90">3 Meses (90 días)</option>
                  <option value="180">6 Meses (180 días)</option>
                  <option value="365">1 Año (365 días)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Límite de Vehículos / Camiones
                </label>
                <select
                  value={limiteVehiculos}
                  onChange={(e) => setLimiteVehiculos(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="5">Plan Básico (Hasta 5 camiones)</option>
                  <option value="15">Plan Estándar (Hasta 15 camiones)</option>
                  <option value="50">Plan Flota Grande (Hasta 50 camiones)</option>
                  <option value="999">Plan Ilimitado</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveSubTab('lista')}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
              >
                Volver a la Lista
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/10"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando Empresa y Usuario...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Crear Empresa y Generar Licencia
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            🔐 Acceso restringido exclusivo para el Propietario de Transporte Edan.
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
