'use client';

import React from 'react';
import { Ticket } from '@/types/ticket';
import { Lock } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  isSelected?: boolean;
  onClick: (ticket: Ticket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = React.memo(
  ({ ticket, isSelected = false, onClick }) => {
    const { numero, estado } = ticket;
    const esDisponible = estado === 'Disponible';

    // 1. Boleta Disponible: Blanca y nítida con indicador esmeralda para destacar de inmediato en el tablero
    if (esDisponible) {
      return (
        <button
          onClick={() => onClick(ticket)}
          className={`group relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all duration-150 cursor-pointer select-none ${
            isSelected
              ? 'ring-2 ring-emerald-600 border border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
              : 'bg-white border-2 border-emerald-500/70 text-slate-900 hover:bg-emerald-50/80 hover:border-emerald-600 hover:-translate-y-0.5 shadow-2xs'
          }`}
          title={`Boleta #${numero} disponible — Clic para apartar`}
        >
          <span className="font-mono text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-900">
            {numero}
          </span>
          <span className="text-[11px] font-semibold text-emerald-700">
            Libre
          </span>
        </button>
      );
    }

    // 2. Boleta Ocupada: Tono neutro suave para ceder protagonismo a los números libres, pero clicable para abonar
    return (
      <button
        onClick={() => onClick(ticket)}
        className="group relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-slate-200/90 bg-slate-100/85 text-slate-500 hover:border-[#124ec7]/40 hover:bg-white hover:text-slate-900 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer select-none"
        title={`Boleta #${numero} asignada — Clic para ingresar con tu PIN y abonar`}
      >
        <div className="absolute top-1.5 right-1.5">
          <Lock className="h-2.5 w-2.5 text-slate-400 group-hover:text-[#124ec7] transition-colors" />
        </div>
        <span className="font-mono text-base sm:text-lg font-semibold tracking-tight text-slate-600 group-hover:text-slate-900">
          {numero}
        </span>
        <span className="text-[11px] font-medium text-slate-400 group-hover:text-[#124ec7]">
          Ocupado
        </span>
      </button>
    );
  }
);

TicketCard.displayName = 'TicketCard';
