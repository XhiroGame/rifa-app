'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, RaffleConfig } from '@/types/ticket';
import { MESES_NOMBRES, normalizeOwnerName } from '@/lib/mockTickets';
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
  MapPin,
  FileText,
  Layers,
  CheckSquare,
  Square,
} from 'lucide-react';

interface TicketModalProps {
  ticket: Ticket | null;
  allTickets?: Ticket[];
  config: RaffleConfig;
  onClose: () => void;
  onPayNextCuota: (ticket: Ticket, mes: number, pin?: string, selectedTickets?: Ticket[]) => void;
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
  allTickets = [],
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
  const [selectedNums, setSelectedNums] = useState<string[]>([]);

  // Todas las boletas que pertenecen a este mismo titular
  const ownerTickets = useMemo(() => {
    if (!ticket || ticket.estado === 'Disponible' || !ticket.nombre) {
      return ticket ? [ticket] : [];
    }
    const targetNorm = normalizeOwnerName(ticket.nombre);
    if (!targetNorm || allTickets.length === 0) return [ticket];
    const matches = allTickets.filter(
      (t) => t.estado !== 'Disponible' && normalizeOwnerName(t.nombre) === targetNorm
    );
    return matches.length > 0 ? matches : [ticket];
  }, [ticket, allTickets]);

  // Boletas del titular que pueden recibir pago de cuota ahora mismo
  const payableOwnerTickets = useMemo(() => {
    return ownerTickets.filter((t) => (t.cuotasPagadas || 0) < 12 && t.estado !== 'En revisión');
  }, [ownerTickets]);

  // Resetear estados al cambiar de boleta
  useEffect(() => {
    setPinInput('');
    setIsUnlocked(false);
    setPinError(null);
    setIsValidating(false);
    if (ticket) {
      setSelectedNums([ticket.numero]);
    }
  }, [ticket?.numero]);

  // Al desbloquear, sugerir por defecto pagar el total de las boletas pendientes del titular
  useEffect(() => {
    if (isUnlocked && payableOwnerTickets.length > 0) {
      setSelectedNums(payableOwnerTickets.map((t) => t.numero));
    }
  }, [isUnlocked, payableOwnerTickets]);

  if (!ticket) return null;

  const { numero, estado, nombre, telefono, cuotasPagadas = 0, cuotas = [], cuotaEnRevision } = ticket;

  // Calcular la siguiente cuota a pagar (1 a 12)
  const siguienteMes = cuotasPagadas < 12 ? cuotasPagadas + 1 : 12;
  const cuotaPendiente = cuotas.find((c) => c.mes === siguienteMes);

  const toggleSelectTicket = (num: string) => {
    setSelectedNums((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const selectedTicketsList = payableOwnerTickets.filter((t) => selectedNums.includes(t.numero));
  const pendingUnselectedCount = Math.max(0, payableOwnerTickets.length - selectedTicketsList.length);

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
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="rounded-xl bg-slate-800 p-2 text-slate-400 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-400 text-[11px]">Titular de la boleta:</p>
                    <p className="font-bold text-white text-sm truncate">
                      {isUnlocked ? nombre || 'Participante Asignado' : maskName(nombre)}
                    </p>
                  </div>
                </div>

                {isUnlocked && telefono && /\d{10}/.test(telefono.replace(/\D/g, '')) && (
                  <a
                    href={`https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hola ${nombre || ''}, te contacto respecto a tu boleta #${numero} de Rifas e Inversiones La Calidosa.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 font-bold transition-colors shrink-0"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {isUnlocked && (telefono || ticket.notas) && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                  {telefono && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>Ubicación / Contacto: <strong className="text-white">{telefono}</strong></span>
                    </div>
                  )}
                  {ticket.notas && (
                    <div className="flex items-start gap-1.5 text-indigo-200/90">
                      <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{ticket.notas}</span>
                    </div>
                  )}
                </div>
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
                      ${(ticket.totalAbonado ?? cuotasPagadas * 100000).toLocaleString('es-CO')} / $1.200.000 COP
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

                {/* SECCIÓN MULTI-BOLETAS: Si el titular cuenta con más de 1 número asignado */}
                {ownerTickets.length > 1 && (
                  <div className="rounded-2xl bg-indigo-950/35 border-2 border-indigo-500/40 p-4 space-y-3 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-white">
                            Tienes {ownerTickets.length} Números Asignados
                          </h4>
                          <p className="text-[11px] text-indigo-200/80">
                            Puedes pagar el total de tus números o seleccionar solo los que vas a abonar hoy
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {selectedTicketsList.length} de {payableOwnerTickets.length} seleccionadas
                      </span>
                    </div>

                    {/* Botones rápidos de selección */}
                    {payableOwnerTickets.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedNums(payableOwnerTickets.map((t) => t.numero))}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                            selectedTicketsList.length === payableOwnerTickets.length
                              ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border-slate-700'
                          }`}
                        >
                          Pagar Todas ({payableOwnerTickets.length} = ${(payableOwnerTickets.length * 100000).toLocaleString('es-CO')})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedNums([ticket.numero])}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                            selectedTicketsList.length === 1 && selectedTicketsList[0]?.numero === ticket.numero
                              ? 'bg-indigo-500/25 text-indigo-200 border-indigo-500/50'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border-slate-700'
                          }`}
                        >
                          Solo #{ticket.numero} ($100.000)
                        </button>
                      </div>
                    )}

                    {/* Lista interactiva de todas las boletas del titular */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {ownerTickets.map((ot) => {
                        const isPayable = (ot.cuotasPagadas || 0) < 12 && ot.estado !== 'En revisión';
                        const isChecked = selectedNums.includes(ot.numero) && isPayable;
                        const nextMesNum = (ot.cuotasPagadas || 0) < 12 ? (ot.cuotasPagadas || 0) + 1 : 12;
                        const nextMesName = MESES_NOMBRES[nextMesNum - 1] || `Mes ${nextMesNum}`;

                        return (
                          <button
                            key={ot.numero}
                            type="button"
                            disabled={!isPayable}
                            onClick={() => toggleSelectTicket(ot.numero)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                              !isPayable
                                ? 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'
                                : isChecked
                                ? 'bg-emerald-950/35 border-emerald-500/60 text-white shadow-sm cursor-pointer'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isPayable ? (
                                isChecked ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-slate-500 shrink-0" />
                                )
                              ) : (
                                <Clock className="h-4 w-4 text-violet-400 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-sm font-black text-white">
                                    #{ot.numero}
                                  </span>
                                  {ot.numero === ticket.numero && (
                                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200">
                                      Actual
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {ot.estado === 'En revisión'
                                    ? 'Comprobante en revisión'
                                    : (ot.cuotasPagadas || 0) >= 12
                                    ? '12/12 Completada'
                                    : `Cuota ${nextMesNum} (${nextMesName})`}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-2">
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded block ${
                                  isChecked
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {ot.cuotasPagadas || 0}/12
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {isPayable ? (isChecked ? '$100.000' : 'Pendiente') : ot.estado}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Resumen de selección */}
                    <div className="rounded-xl bg-slate-950/80 border border-slate-800/90 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">
                          {selectedTicketsList.length === payableOwnerTickets.length
                            ? `Pagando el total de tus ${selectedTicketsList.length} boletas:`
                            : `Seleccionaste ${selectedTicketsList.length} boleta(s) (${pendingUnselectedCount} quedará(n) pendiente(s)):`}
                        </span>
                        <span className="font-mono font-bold text-white text-xs">
                          {selectedTicketsList.length > 0
                            ? selectedTicketsList.map((t) => `#${t.numero}`).join(', ')
                            : 'Ninguna boleta seleccionada'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-400 block">Total a Pagar</span>
                        <span className="font-mono text-base font-black text-emerald-400">
                          ${(selectedTicketsList.length * 100000).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón para Abonar la(s) Boleta(s) Seleccionada(s) con PIN validado */}
                {payableOwnerTickets.length > 0 ? (
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      disabled={selectedTicketsList.length === 0}
                      onClick={() => {
                        const primary = selectedTicketsList[0] || ticket;
                        const primaryMes = (primary.cuotasPagadas || 0) < 12 ? (primary.cuotasPagadas || 0) + 1 : 12;
                        onPayNextCuota(primary, primaryMes, pinInput, selectedTicketsList);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed py-3.5 px-4 text-sm font-bold text-slate-950 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4 shrink-0" />
                      <span>
                        {ownerTickets.length > 1
                          ? selectedTicketsList.length === payableOwnerTickets.length
                            ? `Pagar Total de ${selectedTicketsList.length} Boletas: $${(
                                selectedTicketsList.length * 100000
                              ).toLocaleString('es-CO')} COP`
                            : `Pagar ${selectedTicketsList.length} Boleta(s) Seleccionada(s): $${(
                                selectedTicketsList.length * 100000
                              ).toLocaleString('es-CO')} COP`
                          : `Pagar Cuota ${siguienteMes} (${cuotaPendiente?.nombreMes || ''}): $100.000 COP`}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </button>
                    <p className="text-[11px] text-center text-slate-400">
                      {ownerTickets.length > 1 && pendingUnselectedCount > 0
                        ? `Se registrará el pago de ${selectedTicketsList.length} boleta(s) y las otras ${pendingUnselectedCount} quedarán pendientes.`
                        : 'Sube el comprobante de transferencia y Gemini verificará la transacción automáticamente.'}
                    </p>
                  </div>
                ) : cuotasPagadas < 12 ? (
                  <div className="rounded-2xl bg-violet-950/30 border border-violet-500/40 p-4 text-center">
                    <Clock className="h-6 w-6 text-violet-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">Comprobante en Revisión</p>
                    <p className="text-xs text-violet-300">
                      Tus boletas tienen un comprobante pendiente de aprobación por el administrador.
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
