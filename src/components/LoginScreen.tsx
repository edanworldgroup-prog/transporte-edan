'use client';

import React, { useState } from 'react';
import { 
  Truck, 
  Lock, 
  Mail, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password recovery view state
  const [isForgotView, setIsForgotView] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        throw error;
      }

      await onLoginSuccess();
    } catch (err: any) {
      console.error('Error de login:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('Credenciales inválidas. Revisa tu correo o contraseña.');
      } else {
        setErrorMsg(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!recoveryEmail.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico registrado.');
      return;
    }

    setIsSendingRecovery(true);

    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setSuccessMsg(
        '¡Enlace de recuperación enviado! Revisa tu bandeja de entrada (o carpeta de spam) y haz clic en el enlace para cambiar tu contraseña.'
      );
    } catch (err: any) {
      console.error('Error al enviar recuperación:', err);
      setErrorMsg(err.message || 'Error al solicitar el enlace de recuperación.');
    } finally {
      setIsSendingRecovery(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-7 bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner mb-4">
            {isForgotView ? <KeyRound className="w-7 h-7 text-amber-400" /> : <Truck className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            TRANSPORTE <span className="text-amber-500">EDAN</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {isForgotView
              ? 'Recuperación de Acceso y Restablecimiento de Contraseña'
              : 'Plataforma Cloud de Gestión de Flota y Control de Rentabilidad'}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Acceso Seguro para Empresas de Transporte
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VIEW 1: RECOVERY FORM */}
        {isForgotView ? (
          <form onSubmit={handleSendRecovery} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico de tu Cuenta
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@transporte.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Ingresa el correo con el que tienes registrada tu empresa y te enviaremos un enlace seguro para que elijas una nueva contraseña.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSendingRecovery}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
            >
              {isSendingRecovery ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando Enlace...
                </>
              ) : (
                'Enviar Enlace de Recuperación'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotView(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al inicio de sesión
            </button>
          </form>
        ) : (
          /* VIEW 2: NORMAL LOGIN FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@transporte.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotView(true);
                    setRecoveryEmail(email);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando Sesión...
                </>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
          ¿Necesitas una licencia para tu empresa de transporte?{' '}
          <span className="text-amber-400 font-semibold block sm:inline">
            Contacta a Edan World Group
          </span>
        </div>

      </div>
    </div>
  );
};
