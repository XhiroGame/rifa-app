'use client';

import React from 'react';
import { RaffleStats } from '@/types/ticket';
import { CheckCircle2, Ticket as TicketIcon, Lock, Sparkles } from 'lucide-react';

interface StatsCardsProps {
  stats: RaffleStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const ocupadas = Math.max(0, stats.total - stats.disponibles);

  return (
    <div className="mb-6">
      {/* 3 Tarjetas Públicas de Disponibilidad */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Disponibles / Libres */}
        <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/30 p-4 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Boletas Disponibles
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{stats.disponibles}</span>
            <span className="text-xs text-emerald-400 font-mono">libres para apartar</span>
          </div>
        </div>

        {/* Ocupadas / Apartadas */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Boletas Ocupadas
            </span>
            <div className="rounded-lg bg-slate-800 p-2 text-slate-300">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-200">{ocupadas}</span>
            <span className="text-xs text-slate-500 font-mono">con titular asignado</span>
          </div>
        </div>

        {/* Total Boletas */}
        <div className="rounded-2xl bg-slate-900/90 border border-indigo-900/40 p-4 shadow-sm hover:border-indigo-700/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Total de Números
            </span>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-200">{stats.total}</span>
            <span className="text-xs text-indigo-400/90 font-mono">del 000 al 999</span>
          </div>
        </div>
      </div>
    </div>
  );
};
