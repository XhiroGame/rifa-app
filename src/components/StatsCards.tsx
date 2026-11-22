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
        <div className="rounded-2xl bg-gradient-to-br from-[#0d1f17]/95 to-[#121610]/95 border border-emerald-500/40 p-4 shadow-lg shadow-emerald-950/30 hover:border-emerald-400/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Boletas Disponibles
            </span>
            <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{stats.disponibles}</span>
            <span className="text-xs text-emerald-400 font-mono">libres para apartar</span>
          </div>
        </div>

        {/* Ocupadas / Apartadas */}
        <div className="rounded-2xl bg-gradient-to-br from-[#19140c]/95 to-[#120f0a]/95 border border-amber-500/25 p-4 shadow-lg hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200/80">
              Boletas Ocupadas
            </span>
            <div className="rounded-lg bg-amber-500/15 p-2 text-amber-300 border border-amber-500/25">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-100">{ocupadas}</span>
            <span className="text-xs text-amber-300/60 font-mono">con titular asignado</span>
          </div>
        </div>

        {/* Total Boletas */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1f1709]/95 to-[#141008]/95 border border-amber-400/35 p-4 shadow-lg shadow-amber-950/20 hover:border-amber-400/55 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Total de Números
            </span>
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-300 border border-amber-400/30">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-200">{stats.total}</span>
            <span className="text-xs text-amber-300/80 font-mono">del 000 al 999</span>
          </div>
        </div>
      </div>
    </div>
  );
};
