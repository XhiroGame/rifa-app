'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Key,
  Calendar,
  Sparkles,
  User,
  Phone,
} from 'lucide-react';
import { Ticket } from '@/types/ticket';
import {
  buildApprovalWhatsAppMessage,
  getWhatsAppUrl,
} from '@/lib/whatsappMessages';

interface ApprovalWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  mes: number;
  nombreMes: string;
}

export const ApprovalWhatsAppModal: React.FC<ApprovalWhatsAppModalProps> = ({
  isOpen,
  onClose,
  ticket,
  mes,
  nombreMes,
}) => {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  if (!isOpen || !ticket) return null;

  const pin = ticket.claveSeguridad || 'N/A';
  const whatsappNumber = ticket.telefono || '';
  const messageText = buildApprovalWhatsAppMessage({
    nombre: ticket.nombre,
    numero: ticket.numero,
    mes,
    nombreMes,
    cuotasPagadas: ticket.cuotasPagadas || mes,
    claveSeguridad: pin,
  });

  const waUrl = getWhatsAppUrl(whatsappNumber, messageText);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Encabezado de éxito */}
        <div className="text-center space-y-2 mb-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Pago Verificado y Aprobado</span>
          </div>

          <h2 className="text-2xl font-black text-white">¡Cuota Aprobada!</h2>
          <p className="text-xs text-slate-300">
            La boleta <strong className="text-emerald-400">#{ticket.numero}</strong> pasó a estado oficial de pago. Notifica al cliente para que tenga su código de seguridad guardado.
          </p>
        </div>

        {/* Resumen del Cliente y Código PIN */}
        <div className="space-y-3 mb-5">
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <User className="h-3.5 w-3.5" />
                <span>Titular:</span>
              </span>
              <strong className="text-white">{ticket.nombre || 'Sin nombre'}</strong>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Phone className="h-3.5 w-3.5" />
                <span>Celular WhatsApp:</span>
              </span>
              <span className="font-mono text-emerald-300 font-semibold">{ticket.telefono || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>Cuota aprobada:</span>
              </span>
              <span className="font-semibold text-white">
                Mes {mes} ({nombreMes}) • $100.000 COP
              </span>
            </div>
          </div>

          {/* Caja dorada destacada para el PIN */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-950/20 to-amber-500/15 border-2 border-amber-500/40 p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                <span>Código PIN del Cliente:</span>
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Clave única requerida para sus próximas cuotas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-black text-amber-300 tracking-widest bg-slate-950/80 px-3 py-1 rounded-xl border border-amber-500/30 uppercase">
                {pin}
              </span>
              <button
                type="button"
                onClick={handleCopyPin}
                title="Copiar PIN"
                className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
              >
                {copiedPin ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Vista previa del mensaje */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-1.5 px-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>Mensaje listo para enviar:</span>
            </span>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedMessage ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copiar texto</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-[11px] text-slate-300 font-mono whitespace-pre-line max-h-32 overflow-y-auto leading-relaxed border-l-4 border-l-emerald-500">
            {messageText}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-2">
          {whatsappNumber ? (
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 py-3.5 px-4 text-sm font-bold text-slate-950 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Enviar Notificación y PIN por WhatsApp</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          ) : (
            <div className="text-center p-2.5 rounded-xl bg-slate-800 text-xs text-amber-300">
              * La boleta no tiene registrado número de WhatsApp para envío automático.
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

