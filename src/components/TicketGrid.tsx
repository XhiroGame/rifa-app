'use client';

import React from 'react';
import { Ticket } from '@/types/ticket';
import { TicketCard } from './TicketCard';
import { SearchX } from 'lucide-react';

interface TicketGridProps {
  tickets: Ticket[];
  totalTicketsCount: number;
  selectedNumbers: Set<string>;
  onTicketClick: (ticket: Ticket) => void;
  onResetFilters: () => void;
  isLoading: boolean;
}

export const TicketGrid: React.FC<TicketGridProps> = ({
  tickets,
  totalTicketsCount,
  selectedNumbers,
  onTicketClick,
  onResetFilters,
  isLoading,
}) => {
  if (isLoading && tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white border border-slate-200">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#124ec7] border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-slate-600">Cargando tablero oficial de 1.000 números...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-white border border-slate-200 text-center">
        <div className="rounded-full bg-slate-100 p-4 text-slate-500 mb-3">
          <SearchX className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No encontramos ese número</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Prueba con otro criterio o vuelve a mostrar las 1.000 boletas del tablero.
        </p>
        <button
          onClick={onResetFilters}
          className="mt-4 rounded-xl bg-[#124ec7] hover:bg-[#0f41a8] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          Ver todos los números
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Encabezado y leyenda del tablero */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
        <span>
          Mostrando <strong className="font-semibold text-slate-900">{tickets.length}</strong> de{' '}
          <strong className="font-semibold text-slate-900">{totalTicketsCount}</strong> números
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-medium">Libre para apartar</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="text-slate-500">Ocupado (clic para abonar con PIN)</span>
          </span>
        </div>
      </div>

      {/* Tablero de 1,000 números */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.numero}
            ticket={ticket}
            isSelected={selectedNumbers.has(ticket.numero)}
            onClick={onTicketClick}
          />
        ))}
      </div>
    </section>
  );
};
