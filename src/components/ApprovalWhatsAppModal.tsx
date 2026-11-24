'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Key,
  Calendar,
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
  const rawContact = ticket.telefono || '';
  const whatsappNumber = /\d{10}/.test(rawContact.replace(/\D/g, '')) ? rawContact.replace(/\D/g, '') : '';
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl text-slate-900 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center space-y-2 mb-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Notificación y Clave PIN</h2>
          <p className="text-xs text-slate-600">
            Envía al titular de la boleta <strong className="text-slate-900">#{ticket.numero}</strong> su constancia y su código PIN.
          </p>
        </div>

        <div className="space-y-3 mb-5">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-500">
                <User className="h-3.5 w-3.5" />
                <span>Titular</span>
              </span>
              <strong className="text-slate-900">{ticket.nombre || 'Sin nombre'}</strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Phone className="h-3.5 w-3.5" />
                <span>Ubicación / celular</span>
              </span>
              <span className="font-mono text-slate-800 font-semibold">{rawContact || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>Cuota</span>
              </span>
              <span className="font-semibold text-slate-900">
                Mes {mes} ({nombreMes}) · $100.000 COP
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-600" />
                <span>Código PIN del cliente</span>
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Requerido para sus próximas cuotas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-extrabold text-slate-900 tracking-widest bg-white px-3 py-1 rounded-xl border border-amber-300 uppercase">
                {pin}
              </span>
              <button
                type="button"
                onClick={handleCopyPin}
                title="Copiar PIN"
                className="p-2 rounded-xl bg-white hover:bg-amber-100/60 text-amber-800 border border-amber-300 transition-colors cursor-pointer"
              >
                {copiedPin ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-1.5 px-1">
            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Mensaje listo para enviar</span>
            </span>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] font-semibold text-[#124ec7] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedMessage ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-700">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copiar texto</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-700 font-mono whitespace-pre-line max-h-32 overflow-y-auto leading-relaxed">
            {messageText}
          </div>
        </div>

        <div className="space-y-2">
          {whatsappNumber ? (
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-4 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Enviar por WhatsApp</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="text-center p-2.5 rounded-xl bg-slate-100 text-xs text-slate-600">
              Esta boleta aún no tiene número celular registrado; puedes copiar el texto arriba.
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
