'use client';

import React from 'react';
import Link from 'next/link';
import { RaffleConfig } from '@/types/ticket';
import { Sparkles, Calendar, Trophy, Tag, AlertCircle, CheckCircle2, Lock, Coins } from 'lucide-react';

interface HeaderProps {
  config: RaffleConfig;
  isDemo: boolean;
}

export const Header: React.FC<HeaderProps> = ({ config, isDemo }) => {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-2xl border border-slate-700/60 mb-8">
      {/* Decorative gradient blur background */}
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Main Title, Official Logo & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Official Client Logo Badge */}
            <div className="shrink-0 self-start sm:self-center rounded-2xl bg-white p-2.5 shadow-xl shadow-amber-500/15 ring-2 ring-amber-400/50">
              <img
                src="/logo-calidosa.png"
                alt="Rifa e Inversiones La Calidosa"
                className="h-20 sm:h-24 w-auto object-contain"
              />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-lg bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Rifa Anual (12 Meses) • 1,000 Números (000 - 999)</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {config.title}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Ticket Price Box (Cuota Mensual + Total Anual) */}
          <div className="flex flex-col items-start md:items-end justify-center rounded-2xl bg-slate-800/90 p-4 border border-slate-700 shadow-inner">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-emerald-400" />
              Mensualidad por Boleta
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {config.monthlyPrice}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Total año: <strong className="text-white">{config.totalPrice}</strong>
            </span>
          </div>
        </div>

        {/* Prize & Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3.5 border border-slate-700/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">Gran Premio Mayor</p>
              <p className="text-sm font-semibold text-white truncate">{config.prize}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3.5 border border-slate-700/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">Fecha del Sorteo Final</p>
              <p className="text-sm font-semibold text-white truncate">{config.drawDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3.5 border border-slate-700/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">Lotería de Referencia</p>
              <p className="text-sm font-semibold text-white truncate">{config.lotteryName}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
