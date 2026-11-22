'use client';

import React from 'react';
import { PublicStatusFilter, RaffleStats } from '@/types/ticket';
import { Search, RefreshCw, Dice5, X, CheckCircle2, Lock } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: PublicStatusFilter;
  onStatusFilterChange: (status: PublicStatusFilter) => void;
  rangeFilter: string;
  onRangeFilterChange: (range: string) => void;
  onPickRandom: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  secondsSinceLastUpdate: number;
  stats: RaffleStats;
  autoRefresh: boolean;
  onToggleAutoRefresh: (val: boolean) => void;
}

const RANGES = [
  { id: 'all', label: 'Todas (000-999)' },
  { id: '000-099', label: '000-099' },
  { id: '100-199', label: '100-199' },
  { id: '200-299', label: '200-299' },
  { id: '300-399', label: '300-399' },
  { id: '400-499', label: '400-499' },
  { id: '500-599', label: '500-599' },
  { id: '600-699', label: '600-699' },
  { id: '700-799', label: '700-799' },
  { id: '800-899', label: '800-899' },
  { id: '900-999', label: '900-999' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  rangeFilter,
  onRangeFilterChange,
  onPickRandom,
  onRefresh,
  isRefreshing,
  secondsSinceLastUpdate,
  stats,
  autoRefresh,
  onToggleAutoRefresh,
}) => {
  const ocupadas = Math.max(0, stats.total - stats.disponibles);

  return (
    <div className="space-y-4 rounded-3xl bg-gradient-to-b from-[#18130a]/95 to-[#120e08]/95 border border-amber-500/30 p-4 sm:p-5 shadow-xl mb-6">
      {/* Row 1: Search, Lucky Pick & Refresh Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/80" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar tu número de la suerte (ej: 023)..."
            className="w-full rounded-2xl bg-[#0e0b06] pl-10 pr-9 py-2.5 text-sm text-white placeholder-amber-200/40 border border-amber-500/25 focus:border-amber-400 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPickRandom}
            disabled={stats.disponibles === 0}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:cursor-not-allowed"
          >
            <Dice5 className="h-4 w-4" />
            <span className="hidden sm:inline">Número al Azar</span>
            <span className="sm:hidden">Azar</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#1f190e] hover:bg-[#2a2213] disabled:opacity-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-amber-100 border border-amber-500/30 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">
              {isRefreshing ? 'Sincronizando...' : `Hace ${secondsSinceLastUpdate}s`}
            </span>
          </button>
        </div>
      </div>

      {/* Row 2: Filtros Públicos (Solo Todas, Disponibles y Ocupadas) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-500/20">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onStatusFilterChange('Todas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Todas'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-[#1f190e] text-amber-200/80 hover:bg-[#2a2213] border border-amber-500/20'
            }`}
          >
            Todas ({stats.total})
          </button>

          <button
            onClick={() => onStatusFilterChange('Disponible')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Disponible'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-[#0e1e16] text-emerald-400 hover:bg-[#13291e] border border-emerald-500/30'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Disponibles ({stats.disponibles})
          </button>

          <button
            onClick={() => onStatusFilterChange('Ocupadas')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Ocupadas'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-[#1a150c] text-amber-200/70 hover:bg-[#251e12] border border-amber-500/20'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            Ocupadas ({ocupadas})
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-amber-200/70 cursor-pointer select-none self-end sm:self-auto">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => onToggleAutoRefresh(e.target.checked)}
            className="rounded border-amber-500/40 bg-[#0e0b06] text-amber-500 h-4 w-4"
          />
          <span>Auto-recargar cada 15s</span>
        </label>
      </div>

      {/* Row 3: Range Selector Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
        <span className="text-amber-400/80 font-bold uppercase tracking-wider text-[11px] mr-1 shrink-0">
          Rango:
        </span>
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => onRangeFilterChange(r.id)}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs whitespace-nowrap transition-all cursor-pointer ${
              rangeFilter === r.id
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50 font-bold shadow-sm'
                : 'bg-[#1a150c]/80 text-amber-200/60 hover:text-amber-100 hover:bg-[#251e12] border border-amber-500/15'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
};
