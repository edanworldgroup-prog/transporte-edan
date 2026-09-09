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
  Check,
  Edit3,
  Copy,
  RefreshCw,
  User
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
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string; emp: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit Modal State
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [editNombreEmpresa, setEditNombreEmpresa] = useState('');
  const [editRifRuc, setEditRifRuc] = useState('');
  const [editUsuarioNombre, setEditUsuarioNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLimiteVehiculos, setEditLimiteVehiculos] = useState('15');
  const [editFechaVencimiento, setEditFechaVencimiento] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editCopied, setEditCopied] = useState(false);

  const fetchEmpresas = async () => {
    setIsLoading(true);
    try {
      // 1. Try fetching via RPC function with joined user data
      const { data, error } = await supabase.rpc('obtener_empresas_superadmin');

      if (!error && data) {
        setEmpresas(data as Empresa[]);
        return;
      }

      // 2. Fallback query
      const { data: rawData, error: rawError } = await supabase
        .from('transporte_empresas')
        .select(`
          *,
          vehiculos:transporte_vehiculos(count)
        `)
        .order('created_at', { ascending: false });

      if (rawError) throw rawError;

      const formatted = (rawData || []).map((e: any) => ({
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
      setCreatedCredentials(null);
      setEditingEmpresa(null);
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

  // Generate random password helper
  const generarPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
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
      const { data, error } = await supabase.rpc('crear_empresa_cliente', {
        p_nombre_empresa: nombreEmpresa.trim(),
        p_rif_ruc: rifRuc.trim() || null,
        p_dias_licencia: parseInt(diasLicencia) || 30,
        p_limite_vehiculos: parseInt(limiteVehiculos) || 15,
        p_email: emailCliente.trim(),
        p_password: passwordCliente.trim(),
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.error || 'Error al crear la empresa en Supabase');
      }

      setCreatedCredentials({
        email: emailCliente.trim(),
        pass: passwordCliente.trim(),
        emp: nombreEmpresa.trim(),
      });

      setCreateMsg({
        type: 'success',
        text: `¡Empresa "${nombreEmpresa}" creada exitosamente con licencia activa!`,
      });

      // Clear form
      setNombreEmpresa('');
      setRifRuc('');
      setEmailCliente('');
      setPasswordCliente('');

      await fetchEmpresas();
      await onEmpresasUpdated();
    } catch (err: any) {
      console.error(err);
      setCreateMsg({
        type: 'error',
        text: err.message || 'Error al procesar la creación de la empresa.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Copy credentials to clipboard
  const handleCopyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Open Edit Modal
  const handleOpenEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setEditNombreEmpresa(empresa.nombre || '');
    setEditRifRuc(empresa.rif_ruc || '');
    setEditUsuarioNombre(empresa.usuario_nombre || empresa.nombre || '');
    setEditEmail(empresa.admin_email || '');
    setEditPassword('');
    setEditLimiteVehiculos(empresa.limite_vehiculos?.toString() || '15');
    setEditFechaVencimiento(
      empresa.fecha_vencimiento ? empresa.fecha_vencimiento.split('T')[0] : ''
    );
    setEditMsg(null);
    setEditCopied(false);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpresa) return;

    if (!editNombreEmpresa.trim()) {
      setEditMsg({ type: 'error', text: 'El nombre de la empresa es obligatorio.' });
      return;
    }

    if (editPassword.trim() && editPassword.trim().length < 6) {
      setEditMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setIsSavingEdit(true);
    setEditMsg(null);

    try {
      const { data, error } = await supabase.rpc('actualizar_usuario_empresa', {
        p_empresa_id: editingEmpresa.id,
        p_user_id: editingEmpresa.auth_user_id || null,
        p_nombre_empresa: editNombreEmpresa.trim(),
        p_rif_ruc: editRifRuc.trim() || null,
        p_nombre_usuario: editUsuarioNombre.trim() || editNombreEmpresa.trim(),
        p_email: editEmail.trim() || null,
        p_nueva_password: editPassword.trim() || null,
        p_limite_vehiculos: parseInt(editLimiteVehiculos) || 15,
        p_fecha_vencimiento: editFechaVencimiento || null,
      });

      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.error || 'Error al actualizar los datos');
      }

      setEditMsg({
        type: 'success',
        text: '¡Empresa y credenciales actualizadas con éxito!',
      });

      await fetchEmpresas();
      await onEmpresasUpdated();

      setTimeout(() => {
        setEditingEmpresa(null);
      }, 1300);
    } catch (err: any) {
      console.error(err);
      setEditMsg({
        type: 'error',
        text: err.message || 'Error al guardar los cambios en Supabase.',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredEmpresas = empresas.filter((emp) => {
    const q = busqueda.toLowerCase();
    return (
      emp.nombre?.toLowerCase().includes(q) ||
      emp.rif_ruc?.toLowerCase().includes(q) ||
      emp.admin_email?.toLowerCase().includes(q) ||
      emp.usuario_nombre?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Panel de Licencias SaaS & Control de Clientes
                </h3>
                <span className="text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                  SuperAdmin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestiona las empresas que usan tu sistema, activa o suspende accesos y edita credenciales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('lista')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'lista'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Empresas Clientes</span>
              <span className="bg-slate-950/40 text-current text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {empresas.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('crear')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'crear'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Dar de Alta Nueva Empresa</span>
            </button>
          </div>

          {activeSubTab === 'lista' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar empresa, RIF o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* TAB 1: LIST OF COMPANIES */}
        {activeSubTab === 'lista' && (
          <div className="overflow-x-auto flex-1 max-h-[65vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">Empresa / RIF</th>
                  <th className="py-3 px-4">Usuario / Contacto</th>
                  <th className="py-3 px-4">Flota</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Cargando licencias de clientes...
                    </td>
                  </tr>
                ) : filteredEmpresas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No se encontraron empresas registradas. Haz clic en "Dar de Alta Nueva Empresa".
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

                        {/* Usuario / Correo */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {empresa.admin_email ? (
                            <div>
                              <div className="font-semibold text-slate-200 flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {empresa.usuario_nombre || 'Administrador'}
                              </div>
                              <div className="text-[11px] text-amber-400/90 font-mono mt-0.5">
                                {empresa.admin_email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Sin usuario vinculado</span>
                          )}
                        </td>

                        {/* Flota / Camiones */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Truck className="w-3.5 h-3.5 text-cyan-400" />
                            <span>
                              <strong className="text-white">{empresa.vehiculos_count || 0}</strong> / {empresa.limite_vehiculos} camiones
                            </span>
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
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Botón Editar Empresa & Credenciales */}
                            <button
                              onClick={() => handleOpenEdit(empresa)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                              title="Editar nombre, RIF, correo o contraseña de este cliente"
                            >
                              <Edit3 className="w-3 h-3" />
                              Editar
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

        {/* TAB 2: CREATE NEW COMPANY FORM */}
        {activeSubTab === 'crear' && (
          <div className="p-6 overflow-y-auto max-h-[65vh]">
            <div className="max-w-2xl mx-auto space-y-5">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-amber-500" />
                  Alta de Nueva Empresa de Transporte (Cliente SaaS)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Genera una empresa aislada en la nube con credenciales para su dueño o administrador
                </p>
              </div>

              {createMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                    createMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {createMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{createMsg.text}</span>
                </div>
              )}

              {/* Credentials Box for instant sharing */}
              {createdCredentials && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Key className="w-4 h-4" />
                      Credenciales listas para entregar al cliente:
                    </span>
                    <button
                      onClick={() =>
                        handleCopyCredentials(
                          `¡Hola! Tus accesos a Transporte Edan:\n🌐 Web: https://transporte-edan.pages.dev\n🏢 Empresa: ${createdCredentials.emp}\n✉️ Correo: ${createdCredentials.email}\n🔑 Clave: ${createdCredentials.pass}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? '¡Copiado!' : 'Copiar para WhatsApp'}
                    </button>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl font-mono text-xs text-slate-300 space-y-1">
                    <p>🏢 <strong>Empresa:</strong> {createdCredentials.emp}</p>
                    <p>✉️ <strong>Usuario/Correo:</strong> {createdCredentials.email}</p>
                    <p>🔑 <strong>Contraseña:</strong> {createdCredentials.pass}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleCrearEmpresa} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nombre de la Empresa / Transporte *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Transporte Carga Rápida C.A."
                      value={nombreEmpresa}
                      onChange={(e) => setNombreEmpresa(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      RIF / RUC / Identificación Fiscal
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: J-12345678-9"
                      value={rifRuc}
                      onChange={(e) => setRifRuc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Correo Electrónico del Cliente (Login) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="cliente@transportecarga.com"
                        value={emailCliente}
                        onChange={(e) => setEmailCliente(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Contraseña de Acceso *
                      </label>
                      <button
                        type="button"
                        onClick={() => setPasswordCliente(generarPassword())}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                      >
                        Generar Segura
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={passwordCliente}
                        onChange={(e) => setPasswordCliente(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Vigencia Inicial de la Licencia *
                    </label>
                    <select
                      value={diasLicencia}
                      onChange={(e) => setDiasLicencia(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="30">30 Días (Plan Mensual / Demo)</option>
                      <option value="90">90 Días (Plan Trimestral)</option>
                      <option value="180">180 Días (Plan Semestral)</option>
                      <option value="365">365 Días (Plan Anual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Límite Máximo de Vehículos (Camiones) *
                    </label>
                    <select
                      value={limiteVehiculos}
                      onChange={(e) => setLimiteVehiculos(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="5">Hasta 5 Vehículos</option>
                      <option value="15">Hasta 15 Vehículos (Recomendado)</option>
                      <option value="30">Hasta 30 Vehículos (Flota Mediana)</option>
                      <option value="100">Hasta 100 Vehículos (Flota Grande)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creando empresa y asignando credenciales...
                      </>
                    ) : (
                      'Crear Empresa y Emitir Licencia'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* MODAL OVERLAY: EDIT COMPANY & CREDENTIALS */}
      {editingEmpresa && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  Editar Empresa y Credenciales de Acceso
                </h4>
                <p className="text-[11px] text-slate-400">
                  Modifica datos comerciales, correo de inicio de sesión o asigna una nueva contraseña
                </p>
              </div>
              <button
                onClick={() => setEditingEmpresa(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  editMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {editMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{editMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              {/* Nombre Empresa & RIF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNombreEmpresa}
                    onChange={(e) => setEditNombreEmpresa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    RIF / RUC
                  </label>
                  <input
                    type="text"
                    value={editRifRuc}
                    onChange={(e) => setEditRifRuc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
              </div>

              {/* Nombre Usuario Contacto & Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nombre del Contacto / Usuario
                  </label>
                  <input
                    type="text"
                    value={editUsuarioNombre}
                    onChange={(e) => setEditUsuarioNombre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Correo de Acceso (Login)
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Nueva Contraseña (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generarPassword())}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                  >
                    Generar clave
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Dejar en blanco para conservar la actual"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {editPassword && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Nueva clave asignada: <strong className="text-amber-300">{editPassword}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `Tus nuevos accesos a Transporte Edan:\n🌐 Web: https://transporte-edan.pages.dev\n✉️ Correo: ${editEmail}\n🔑 Clave: ${editPassword}`
                        );
                        setEditCopied(true);
                        setTimeout(() => setEditCopied(false), 2000);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-bold"
                    >
                      {editCopied ? '¡Copiado!' : 'Copiar datos'}
                    </button>
                  </div>
                )}
              </div>

              {/* Límite Camiones & Fecha Expiración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Límite de Vehículos
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={editLimiteVehiculos}
                    onChange={(e) => setEditLimiteVehiculos(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={editFechaVencimiento}
                    onChange={(e) => setEditFechaVencimiento(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmpresa(null)}
                  className="px-3.5 py-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
