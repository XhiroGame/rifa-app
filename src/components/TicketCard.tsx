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

    // 1. Boleta Disponible (Libre para apartar - Estilo Boleto Esmeralda & Oro)
    if (esDisponible) {
      return (
        <button
          onClick={() => onClick(ticket)}
          className={`group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl transition-all duration-150 cursor-pointer select-none ${
            isSelected
              ? 'ring-2 ring-amber-400 border border-emerald-300 bg-emerald-500/35 text-white scale-105 shadow-lg shadow-emerald-500/30'
              : 'border border-emerald-500/45 bg-gradient-to-b from-emerald-950/50 to-[#091912]/90 text-emerald-300 hover:from-emerald-900/60 hover:to-emerald-950/80 hover:border-amber-400/70 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20'
          }`}
          title={`Boleta #${numero} - Disponible (Clic para apartar)`}
        >
          <span className="font-mono text-base sm:text-lg font-black tracking-wider text-emerald-200 group-hover:text-white">
            {numero}
          </span>
          <span className="text-[10px] uppercase font-bold text-emerald-400 group-hover:text-amber-300 tracking-tight">
            Libre
          </span>
        </button>
      );
    }

    // 2. Boleta Ocupada (Con titular asignado - Estilo Boleto Dorado/Bronce Oscuro)
    return (
      <button
        onClick={() => onClick(ticket)}
        className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-[#1a150c]/90 to-[#110e08]/95 text-amber-100/75 hover:border-amber-400/55 hover:from-[#241d10] hover:to-[#18130a] hover:scale-105 transition-all duration-150 cursor-pointer shadow-sm select-none"
        title={`Boleta #${numero} - Ocupada (Clic para ingresar con tu PIN y abonar)`}
      >
        <div className="absolute top-1 right-1">
          <Lock className="h-3 w-3 text-amber-500/50 group-hover:text-amber-400 transition-colors" />
        </div>
        <span className="font-mono text-base sm:text-lg font-black tracking-wider text-amber-100/85 group-hover:text-amber-200">
          {numero}
        </span>
        <span className="text-[10px] uppercase font-bold text-amber-400/50 group-hover:text-amber-300/80 tracking-tight">
          Ocupado
        </span>
      </button>
    );
  }
);

TicketCard.displayName = 'TicketCard';
