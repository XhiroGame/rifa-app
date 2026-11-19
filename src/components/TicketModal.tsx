'use client';

import React, { useState, useEffect } from 'react';
import { Ticket, RaffleConfig } from '@/types/ticket';
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trophy,
  Phone,
  User,
  MessageCircle,
  Calendar,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Key,
  RefreshCw,
} from 'lucide-react';

interface TicketModalProps {
  ticket: Ticket | null;
  config: RaffleConfig;
  onClose: () => void;
  onPayNextCuota: (ticket: Ticket, mes: number, pin?: string) => void;
  onReserveNew: (ticket: Ticket) => void;
}

function maskName(name?: string): string {
  if (!name) return 'Participante Asignado';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length > 1 ? `${p[0]}${'*'.repeat(Math.min(p.length - 1, 4))}` : p))
    .join(' ');
}

function maskPhone(phone?: string): string {
  if (!phone) return '***-***-****';
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    return `${clean.slice(0, 3)} *** **${clean.slice(-2)}`;
  }
  return '***-***-****';
}

export const TicketModal: React.FC<TicketModalProps> = ({
  ticket,
  config,
  onClose,
  onPayNextCuota,
  onReserveNew,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Resetear estados al cambiar de boleta
  useEffect(() => {
    setPinInput('');
    setIsUnlocked(false);
    setPinError(null);
    setIsValidating(false);
  }, [ticket?.numero]);

  if (!ticket) return null;

  const { numero, estado, nombre, telefono, cuotasPagadas = 0, cuotas = [], cuotaEnRevision } = ticket;

  // Calcular la siguiente cuota a pagar (1 a 12)
  const siguienteMes = cuotasPagadas < 12 ? cuotasPagadas + 1 : 12;
  const cuotaPendiente = cuotas.find((c) => c.mes === siguienteMes);

  // Validación de la clave única contra el backend
  const handleValidatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim().toUpperCase();
    if (!cleanPin || cleanPin.length !== 4) {
      setPinError('Por favor ingresa tu PIN hexadecimal de 4 cifras (0-9, A-F).');
      return;
    }

    setIsValidating(true);
    setPinError(null);

    try {
      const res = await fetch('/api/validate-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: ticket.numero, pin: cleanPin }),
      });

      const data = await res.json();

      if (data.valid) {
        setIsUnlocked(true);
        setPinError(null);
      } else {
        setPinError(data.message || 'Clave única incorrecta.');
      }
    } catch (err) {
      console.error(err);
      setPinError('Error de conexión al validar la clave.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header con Número */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center rounded-2xl bg-slate-800/90 px-6 py-2.5 border border-slate-700 shadow-inner mb-2.5">
            <span className="text-xs uppercase font-bold tracking-widest text-slate-400 mr-2">Boleta</span>
            <span className="font-mono text-3xl sm:text-4xl font-black text-white tracking-widest">
              #{numero}
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            {estado === 'Disponible' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Número Libre • Apartar con Cuota 1 ($100.000)
              </span>
            )}
            {estado === 'Al día' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3.5 py-1 text-xs font-bold text-teal-300 border border-teal-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Al Día ({cuotasPagadas} de 12 cuotas pagadas)
              </span>
            )}
            {estado === 'En mora' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                <AlertTriangle className="h-3.5 w-3.5" />
                En Mora ({cuotasPagadas} de 12 cuotas pagadas)
              </span>
            )}
            {estado === 'En revisión' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3.5 py-1 text-xs font-bold text-violet-300 border border-violet-500/30">
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                Cuota {cuotaEnRevision || ''} en revisión
              </span>
            )}
            {estado === 'Completada' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-amber-300 border border-indigo-500/40">
                <Trophy className="h-3.5 w-3.5" />
                Totalmente Pagada (12/12 Meses - $1.200.000 COP)
              </span>
            )}
          </div>
        </div>

        {/* Caso 1: Boleta Disponible (Libre) */}
        {estado === 'Disponible' ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-white text-sm">¿Cómo funciona la rifa anual?</p>
              <p>
                Al apartar este número, te comprometes a pagar una mensualidad de{' '}
                <strong className="text-emerald-400">$100.000 COP</strong> durante 12 meses (Total:{' '}
                <strong className="text-white">$1.200.000 COP</strong>).
              </p>
              <p>
                Para reservar el número debes cancelar la <strong>Cuota 1</strong> y adjuntar el comprobante.
                Se te asignará una <strong className="text-amber-400">Clave Única Hexadecimal (PIN de 4 cifras)</strong> para proteger tu número en cada pago mensual.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onReserveNew(ticket)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 py-3.5 px-4 text-sm font-bold text-slate-950 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
            >
              <span>Apartar Boleta con Cuota 1 ($100.000 COP)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Caso 2: Boleta Asignada a un Participante */
          <div className="space-y-4">
            {/* Tarjeta del Participante con Privacidad Protegida */}
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-slate-800 p-2 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Titular de la boleta:</p>
                  <p className="font-bold text-white text-sm">
                    {isUnlocked ? nombre || 'Participante Asignado' : maskName(nombre)}
                  </p>
                </div>
              </div>

              {isUnlocked && telefono && (
                <a
                  href={`https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hola ${nombre || ''}, te contacto respecto a tu boleta #${numero} de Rifas e Inversiones La Calidosa.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 font-bold transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>

            {/* SECCIÓN DE SEGURIDAD: Validación de Clave Única Hexadecimal */}
            {!isUnlocked ? (
              <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 p-5 space-y-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Número Protegido</span>
                      <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase">
                        PIN Hexadecimal
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Para ver tu historial o pagar tu cuota mensual, ingresa tu clave única hexadecimal de 4 cifras (ej: 7B2F).
                    </p>
                  </div>
                </div>

                <form onSubmit={handleValidatePin} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={4}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 4));
                          setPinError(null);
                        }}
                        placeholder="PIN (ej: 7A3F)"
                        className="w-full text-center tracking-widest font-mono text-lg font-bold uppercase rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                        title={showPin ? 'Ocultar PIN' : 'Ver PIN'}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isValidating || pinInput.length < 4}
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold px-4 text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isValidating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      <span>Validar</span>
                    </button>
                  </div>

                  {pinError && (
                    <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/25 p-2.5 rounded-xl">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{pinError}</span>
                    </div>
                  )}
                </form>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">¿Eres el titular y olvidaste tu clave?</span>
                  <a
                    href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hola, soy el titular del número #${numero} de Rifas e Inversiones La Calidosa y necesito ayuda para recuperar mi Clave Única de validación.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Recuperar por WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              /* ESTADO DESBLOQUEADO: Identidad Verificada */
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Identidad Verificada • Clave Correcta</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlocked(false);
                      setPinInput('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Cerrar Sesión
                  </button>
                </div>

                {/* Barra de Progreso de 12 Cuotas */}
                <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">
                      Progreso Anual ({cuotasPagadas} de 12 cuotas)
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${(cuotasPagadas * 100000).toLocaleString('es-CO')} / $1.200.000 COP
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${Math.round((cuotasPagadas / 12) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Cuadrícula de las 12 Mensualidades (Ene - Dic) */}
                <div>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    Historial de las 12 Mensualidades
                  </p>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {cuotas.map((cuota) => (
                      <div
                        key={cuota.mes}
                        className={`rounded-xl p-2.5 text-center border text-xs flex flex-col justify-between min-h-[58px] transition-all ${
                          cuota.estado === 'Pagado'
                            ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                            : cuota.estado === 'En revisión'
                            ? 'bg-violet-950/30 border-violet-500/50 text-violet-300 animate-pulse'
                            : cuota.mes === siguienteMes
                            ? 'bg-indigo-950/30 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/40'
                            : 'bg-slate-950/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="font-bold text-[11px] truncate">{cuota.nombreMes}</span>
                        <span className="text-[10px] uppercase font-semibold">
                          {cuota.estado === 'Pagado'
                            ? '✓ Pagado'
                            : cuota.estado === 'En revisión'
                            ? '⏳ Revisión'
                            : cuota.mes === siguienteMes
                            ? 'Siguiente'
                            : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón para Abonar la Siguiente Cuota con PIN validado */}
                {cuotasPagadas < 12 ? (
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => onPayNextCuota(ticket, siguienteMes, pinInput)}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 py-3.5 px-4 text-sm font-bold text-slate-950 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>
                        Pagar Cuota {siguienteMes} ({cuotaPendiente?.nombreMes || ''}): $100.000 COP
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <p className="text-[11px] text-center text-slate-400">
                      Sube el comprobante de transferencia y Gemini verificará la transacción automáticamente.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-indigo-950/40 border border-indigo-500/50 p-4 text-center">
                    <Trophy className="h-7 w-7 text-amber-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">¡Felicitaciones!</p>
                    <p className="text-xs text-indigo-300">
                      Esta boleta ya pagó las 12 mensualidades completas del año ($1.200.000 COP).
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
