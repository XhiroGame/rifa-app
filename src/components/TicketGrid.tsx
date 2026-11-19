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
      <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-slate-900/60 border border-slate-800">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-slate-300">Cargando estado de las 1,000 boletas anuales...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
        <div className="rounded-full bg-slate-800 p-4 text-slate-400 mb-3">
          <SearchX className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-white">No se encontraron números</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          No hay boletas que coincidan con los criterios de búsqueda o filtros seleccionados.
        </p>
        <button
          onClick={onResetFilters}
          className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          Restablecer todos los filtros
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Legend & Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
        <span className="font-medium">
          Mostrando <span className="font-bold text-white">{tickets.length}</span> de{' '}
          <span className="font-bold text-white">{totalTicketsCount}</span> números
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">Libre (Disponible)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600"></span>
            <span className="text-slate-400">Ocupado (Reservado)</span>
          </span>
        </div>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-10 gap-2 sm:gap-2.5">
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
