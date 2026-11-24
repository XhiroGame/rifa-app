'use client';

import React from 'react';
import { RaffleStats } from '@/types/ticket';

interface StatsCardsProps {
  stats: RaffleStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const ocupadas = Math.max(0, stats.total - stats.disponibles);
  const porcentajeOcupacion = stats.total > 0 ? Math.round((ocupadas / stats.total) * 100) : 0;

  return (
    <div className="mb-5 rounded-2xl bg-white border border-slate-200/90 px-5 py-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6 sm:gap-8">
        <div>
          <span className="text-xs font-medium text-slate-500 block">Disponibles hoy</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-mono text-2xl font-extrabold text-emerald-700">{stats.disponibles}</span>
            <span className="text-xs font-medium text-emerald-700">números libres</span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

        <div>
          <span className="text-xs font-medium text-slate-500 block">Asignados</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-mono text-2xl font-extrabold text-slate-800">{ocupadas}</span>
            <span className="text-xs text-slate-500">con titular</span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

        <div>
          <span className="text-xs font-medium text-slate-500 block">Emisión total</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-mono text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 font-mono">(000 - 999)</span>
          </div>
        </div>
      </div>

      {/* Barra limpia de disponibilidad */}
      <div className="w-full md:w-64 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="font-medium text-slate-600">Boletas reservadas</span>
          <span className="font-mono font-bold text-slate-800">{porcentajeOcupacion}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
          <div
            className="h-full bg-[#124ec7] rounded-full transition-all duration-300"
            style={{ width: `${porcentajeOcupacion}%` }}
          />
        </div>
      </div>
    </div>
  );
};
