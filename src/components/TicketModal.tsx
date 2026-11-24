'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, RaffleConfig } from '@/types/ticket';
import { MESES_NOMBRES, normalizeOwnerName } from '@/lib/mockTickets';
import { getWhatsAppUrl } from '@/lib/whatsappMessages';
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trophy,
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
  if (!name) return 'Participante asignado';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length > 1 ? `${p[0]}${'*'.repeat(Math.min(p.length - 1, 4))}` : p))
    .join(' ');
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

  const payableOwnerTickets = useMemo(() => {
    return ownerTickets.filter((t) => (t.cuotasPagadas || 0) < 12 && t.estado !== 'En revisión');
  }, [ownerTickets]);

  useEffect(() => {
    setPinInput('');
    setIsUnlocked(false);
    setPinError(null);
    setIsValidating(false);
    if (ticket) {
      setSelectedNums([ticket.numero]);
    }
  }, [ticket?.numero]);

  useEffect(() => {
    if (isUnlocked && payableOwnerTickets.length > 0) {
      setSelectedNums(payableOwnerTickets.map((t) => t.numero));
    }
  }, [isUnlocked, payableOwnerTickets]);

  if (!ticket) return null;

  const { numero, estado, nombre, telefono, cuotasPagadas = 0, cuotas = [], cuotaEnRevision } = ticket;
  const siguienteMes = cuotasPagadas < 12 ? cuotasPagadas + 1 : 12;
  const cuotaPendiente = cuotas.find((c) => c.mes === siguienteMes);

  const toggleSelectTicket = (num: string) => {
    setSelectedNums((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const selectedTicketsList = payableOwnerTickets.filter((t) => selectedNums.includes(t.numero));
  const pendingUnselectedCount = Math.max(0, payableOwnerTickets.length - selectedTicketsList.length);

  const handleValidatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim().toUpperCase();
    if (!cleanPin || cleanPin.length !== 4) {
      setPinError('Ingresa tu PIN hexadecimal de 4 cifras (0-9, A-F).');
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
      setPinError('No pudimos validar la clave. Intenta de nuevo.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl text-slate-900">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Encabezado del Boleto */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 mb-2.5">
            <img
              src="/icon-calidosa.png"
              alt="La Calidosa"
              className="h-6 w-6 object-contain"
            />
            <span className="text-xs font-semibold text-slate-500">
              Rifa e Inversiones La Calidosa
            </span>
          </div>

          <div className="inline-flex items-baseline gap-2 rounded-xl bg-slate-100 px-6 py-2.5 border border-slate-200/80 mb-2.5">
            <span className="text-xs font-semibold text-slate-500">Boleta</span>
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              #{numero}
            </span>
          </div>

          <div className="flex justify-center">
            {estado === 'Disponible' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Número disponible · Apartar con Cuota 1 ($100.000)
              </span>
            )}
            {estado === 'Al día' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Al día ({cuotasPagadas} de 12 cuotas pagadas)
              </span>
            )}
            {estado === 'En mora' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Pendiente de cuota ({cuotasPagadas} de 12 pagadas)
              </span>
            )}
            {estado === 'En revisión' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-[#124ec7] border border-blue-200">
                <Clock className="h-3.5 w-3.5" />
                Cuota {cuotaEnRevision || ''} en revisión
              </span>
            )}
            {estado === 'Completada' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                Boleta saldada (12/12 meses · $1.200.000 COP)
              </span>
            )}
          </div>
        </div>

        {/* Caso 1: Boleta Disponible */}
        {estado === 'Disponible' ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-900 text-sm">¿Cómo funciona tu boleta anual?</p>
              <p>
                Apartas este número abonando tu mensualidad de{' '}
                <strong className="text-emerald-700">$100.000 COP</strong> durante 12 meses (valor total:{' '}
                <strong className="text-slate-900">$1.200.000 COP</strong>).
              </p>
              <p>
                Al registrar tu primer comprobante recibirás una{' '}
                <strong className="text-slate-900">clave PIN hexadecimal de 4 cifras</strong> para consultar tu historial y abonar tus próximas cuotas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onReserveNew(ticket)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3.5 px-4 text-sm font-semibold text-white transition-colors shadow-xs cursor-pointer"
            >
              <span>Apartar boleta con Cuota 1 ($100.000 COP)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Caso 2: Boleta Ocupada */
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="rounded-lg bg-white border border-slate-200 p-2 text-slate-500 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-500 text-[11px]">Titular registrado</p>
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {isUnlocked ? nombre || 'Participante asignado' : maskName(nombre)}
                    </p>
                  </div>
                </div>

                {isUnlocked && telefono && /\d{10}/.test(telefono.replace(/\D/g, '')) && (
                  <a
                    href={getWhatsAppUrl(
                      telefono,
                      `Hola ${nombre || ''}, te contacto respecto a tu boleta #${numero} de Rifas e Inversiones La Calidosa.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 font-semibold transition-colors shrink-0"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {isUnlocked && (telefono || ticket.notas) && (
                <div className="pt-2 border-t border-slate-200/70 space-y-1 text-[11px]">
                  {telefono && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-[#124ec7] shrink-0" />
                      <span>Ubicación / contacto: <strong className="text-slate-900">{telefono}</strong></span>
                    </div>
                  )}
                  {ticket.notas && (
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{ticket.notas}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isUnlocked ? (
              <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Ingresa tu clave PIN para ver y abonar
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Escribe tu código hexadecimal de 4 cifras (ej. 7B2F) para desbloquear tus boletas y registrar tu pago.
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
                        placeholder="PIN (ej. 7A3F)"
                        className="w-full text-center tracking-widest font-mono text-lg font-bold uppercase rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#124ec7]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showPin ? 'Ocultar PIN' : 'Ver PIN'}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isValidating || pinInput.length < 4}
                      className="rounded-xl bg-[#124ec7] hover:bg-[#0f41a8] disabled:opacity-50 text-white font-semibold px-4 text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isValidating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                      <span>Validar</span>
                    </button>
                  </div>

                  {pinError && (
                    <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{pinError}</span>
                    </div>
                  )}
                </form>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">¿Olvidaste tu clave PIN?</span>
                  <a
                    href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hola, soy el titular del número #${numero} de Rifas e Inversiones La Calidosa y necesito ayuda para recuperar mi Clave Única de validación.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#124ec7] hover:underline"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Solicitar por WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              /* ESTADO DESBLOQUEADO */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Identidad verificada</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlocked(false);
                      setPinInput('');
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                </div>

                {/* Progreso de 12 cuotas */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Progreso anual ({cuotasPagadas} de 12 cuotas)
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      ${(ticket.totalAbonado ?? cuotasPagadas * 100000).toLocaleString('es-CO')} / $1.200.000 COP
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${Math.round((cuotasPagadas / 12) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Cuadrícula de las 12 mensualidades */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#124ec7]" />
                    Estado de las 12 cuotas (Nov 2026 – Oct 2027)
                  </p>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {cuotas.map((cuota) => (
                      <div
                        key={cuota.mes}
                        className={`rounded-xl p-2.5 text-center border text-xs flex flex-col justify-between min-h-[56px] ${
                          cuota.estado === 'Pagado'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : cuota.estado === 'En revisión'
                            ? 'bg-blue-50 border-blue-300 text-[#124ec7]'
                            : cuota.mes === siguienteMes
                            ? 'bg-white border-2 border-[#124ec7] text-slate-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <span className="font-semibold text-[11px] truncate">{cuota.nombreMes}</span>
                        <span className="text-[10px] font-bold">
                          {cuota.estado === 'Pagado'
                            ? '✓ Pagado'
                            : cuota.estado === 'En revisión'
                            ? 'En revisión'
                            : cuota.mes === siguienteMes
                            ? 'Siguiente'
                            : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-boletas si el titular tiene más de 1 número */}
                {ownerTickets.length > 1 && (
                  <div className="rounded-xl bg-blue-50/50 border border-blue-200 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white text-[#124ec7] border border-blue-200">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            Tienes {ownerTickets.length} números asignados
                          </h4>
                          <p className="text-[11px] text-slate-600">
                            Paga todos juntos o marca solo los que abonarás hoy
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white text-[#124ec7] border border-blue-200">
                        {selectedTicketsList.length} de {payableOwnerTickets.length}
                      </span>
                    </div>

                    {payableOwnerTickets.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedNums(payableOwnerTickets.map((t) => t.numero))}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                            selectedTicketsList.length === payableOwnerTickets.length
                              ? 'bg-[#124ec7] text-white border-[#124ec7]'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          Seleccionar todas ({payableOwnerTickets.length} = ${(payableOwnerTickets.length * 100000).toLocaleString('es-CO')})
                        </button>
                        {payableOwnerTickets.some((t) => t.numero === ticket.numero) && (
                          <button
                            type="button"
                            onClick={() => setSelectedNums([ticket.numero])}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                              selectedTicketsList.length === 1 && selectedTicketsList[0]?.numero === ticket.numero
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            Solo #{ticket.numero} ($100.000)
                          </button>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
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
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors ${
                              !isPayable
                                ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                                : isChecked
                                ? 'bg-white border-2 border-emerald-600 text-slate-900 shadow-2xs cursor-pointer'
                                : 'bg-white/70 border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isPayable ? (
                                isChecked ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-slate-400 shrink-0" />
                                )
                              ) : (
                                <Clock className="h-4 w-4 text-[#124ec7] shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-sm font-bold text-slate-900">
                                    #{ot.numero}
                                  </span>
                                  {ot.numero === ticket.numero && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                      Actual
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {ot.estado === 'En revisión'
                                    ? 'En revisión'
                                    : (ot.cuotasPagadas || 0) >= 12
                                    ? '12/12 Completada'
                                    : `Cuota ${nextMesNum} (${nextMesName})`}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-2">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 block">
                                {ot.cuotasPagadas || 0}/12
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {isPayable ? (isChecked ? '$100.000' : 'Pendiente') : ot.estado}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-xl bg-white border border-blue-200/80 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">
                          {selectedTicketsList.length === payableOwnerTickets.length
                            ? `Pagando tus ${selectedTicketsList.length} boletas:`
                            : `${selectedTicketsList.length} seleccionada(s) · ${pendingUnselectedCount} quedará(n) pendiente(s):`}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedTicketsList.length > 0
                            ? selectedTicketsList.map((t) => `#${t.numero}`).join(', ')
                            : 'Ninguna seleccionada'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Total sugerido</span>
                        <span className="font-mono text-base font-extrabold text-emerald-700">
                          ${(selectedTicketsList.length * 100000).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {payableOwnerTickets.length > 0 ? (
                  <div className="pt-1 space-y-2">
                    <button
                      type="button"
                      disabled={selectedTicketsList.length === 0}
                      onClick={() => {
                        const primary = selectedTicketsList[0] || ticket;
                        const primaryMes = (primary.cuotasPagadas || 0) < 12 ? (primary.cuotasPagadas || 0) + 1 : 12;
                        onPayNextCuota(primary, primaryMes, pinInput, selectedTicketsList);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed py-3.5 px-4 text-sm font-semibold text-white transition-colors shadow-xs cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4 shrink-0" />
                      <span>
                        {ownerTickets.length > 1
                          ? selectedTicketsList.length === payableOwnerTickets.length
                            ? `Pagar las ${selectedTicketsList.length} boletas ($${(
                                selectedTicketsList.length * 100000
                              ).toLocaleString('es-CO')} COP)`
                            : `Pagar ${selectedTicketsList.length} boleta(s) seleccionada(s) ($${(
                                selectedTicketsList.length * 100000
                              ).toLocaleString('es-CO')} COP)`
                          : `Pagar Cuota ${siguienteMes} (${cuotaPendiente?.nombreMes || ''}) · $100.000 COP`}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </button>
                  </div>
                ) : cuotasPagadas < 12 ? (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
                    <Clock className="h-6 w-6 text-[#124ec7] mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-900">Comprobante en revisión</p>
                    <p className="text-xs text-slate-600">
                      El administrador está verificando tu pago.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                    <Trophy className="h-7 w-7 text-amber-600 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-900">¡Boleta 100% saldada!</p>
                    <p className="text-xs text-slate-600">
                      Ya completaste las 12 cuotas anuales ($1.200.000 COP).
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
