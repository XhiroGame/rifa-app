'use client';

import React from 'react';
import Link from 'next/link';
import { RaffleConfig } from '@/types/ticket';
import { Sparkles, Calendar, Trophy, Tag, AlertCircle, CheckCircle2, Lock, Coins } from 'lucide-react';

interface HeaderProps {
  config: RaffleConfig;
  isDemo: boolean;
}

export const Header: React.FC<HeaderProps> = ({ config }) => {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1509] via-[#13100b] to-[#0a1d15] p-6 md:p-8 text-white shadow-[0_20px_60px_-15px_rgba(234,179,8,0.2)] border border-amber-500/35 mb-8">
      {/* Decorative Gala Gold & Emerald glow */}
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 left-1/3 h-64 w-96 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Main Title, Official Transparent Gold Logo & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Official Client Logo Integrated on Dark Gold Glass (no white square) */}
            <div className="shrink-0 self-start sm:self-center rounded-2xl bg-gradient-to-b from-amber-500/15 via-amber-950/30 to-black/50 p-3.5 shadow-xl shadow-amber-500/15 border border-amber-400/40 backdrop-blur-sm">
              <img
                src="/logo-calidosa.png"
                alt="Rifa e Inversiones La Calidosa"
                className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]"
              />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3.5 py-1 text-xs font-bold text-amber-300 border border-amber-400/40 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Gran Plan de Premios (12 Meses) • 1,000 Números (000 - 999)</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
                {config.title}
              </h1>
              <p className="text-amber-100/80 text-sm sm:text-base max-w-2xl">
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Ticket Price Box (Cuota Mensual + Total Anual) */}
          <div className="flex flex-col items-start md:items-end justify-center rounded-2xl bg-gradient-to-b from-[#1e180d] to-[#120f09] p-4 border border-amber-500/35 shadow-inner">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-300/90 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-amber-400" />
              Mensualidad por Boleta
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight drop-shadow-sm">
              {config.monthlyPrice}
            </span>
            <span className="text-[11px] text-amber-200/70 mt-0.5">
              Total año: <strong className="text-amber-100">{config.totalPrice}</strong>
            </span>
          </div>
        </div>

        {/* Prize & Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-amber-950/20 p-3.5 border border-amber-500/35">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400/30">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-300/80">Gran Premio Mayor</p>
              <p className="text-sm font-bold text-white truncate">{config.prize}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-[#18130b]/80 p-3.5 border border-amber-500/25">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/25">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-200/70">Fecha del Sorteo Final</p>
              <p className="text-sm font-bold text-white truncate">{config.drawDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-[#0d1c15]/80 p-3.5 border border-emerald-500/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-emerald-300/80">Lotería de Referencia</p>
              <p className="text-sm font-bold text-white truncate">{config.lotteryName}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
