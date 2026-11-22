'use client';

import React from 'react';
import { Ticket } from '@/types/ticket';
import { CheckCircle2, Lock } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  isSelected?: boolean;
  onClick: (ticket: Ticket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = React.memo(
  ({ ticket, isSelected = false, onClick }) => {
    const { numero, estado } = ticket;
    const esDisponible = estado === 'Disponible';

    // 1. Boleta Disponible (Libre para apartar)
    if (esDisponible) {
      return (
        <button
          onClick={() => onClick(ticket)}
          className={`group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl transition-all duration-150 cursor-pointer select-none ${
            isSelected
              ? 'ring-2 ring-emerald-400 border border-emerald-300 bg-emerald-500/30 text-white scale-105 shadow-lg shadow-emerald-500/25'
              : 'border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-400 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/15'
          }`}
          title={`Boleta #${numero} - Disponible (Clic para apartar)`}
        >
          <span className="font-mono text-base sm:text-lg font-black tracking-wider text-emerald-300 group-hover:text-emerald-200">
            {numero}
          </span>
          <span className="text-[10px] uppercase font-bold text-emerald-400/90 tracking-tight">
            Libre
          </span>
        </button>
      );
    }

    // 2. Boleta Ocupada (Con titular asignado - Se protegen los detalles privados del cliente)
    return (
      <button
        onClick={() => onClick(ticket)}
        className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800/80 hover:scale-105 transition-all duration-150 cursor-pointer shadow-sm select-none"
        title={`Boleta #${numero} - Ocupada (Clic para ingresar con tu PIN y abonar)`}
      >
        <div className="absolute top-1 right-1">
          <Lock className="h-3 w-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
        </div>
        <span className="font-mono text-base sm:text-lg font-black tracking-wider text-slate-300 group-hover:text-white">
          {numero}
        </span>
        <span className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-400 tracking-tight">
          Ocupado
        </span>
      </button>
    );
  }
);

TicketCard.displayName = 'TicketCard';
