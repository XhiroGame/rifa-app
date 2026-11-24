'use client';

import React from 'react';
import { PublicStatusFilter, RaffleStats } from '@/types/ticket';
import { Search, RefreshCw, Shuffle, X } from 'lucide-react';

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
  { id: 'all', label: 'Todos' },
  { id: '000-099', label: '000–099' },
  { id: '100-199', label: '100–199' },
  { id: '200-299', label: '200–299' },
  { id: '300-399', label: '300–399' },
  { id: '400-499', label: '400–499' },
  { id: '500-599', label: '500–599' },
  { id: '600-699', label: '600–699' },
  { id: '700-799', label: '700–799' },
  { id: '800-899', label: '800–899' },
  { id: '900-999', label: '900–999' },
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
    <div className="space-y-3.5 rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-2xs mb-6">
      {/* Fila 1: Buscador, Número al azar y Sincronizar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar número (ej. 023) o tu nombre..."
            className="w-full rounded-xl bg-slate-50 pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder-slate-400 border border-slate-200 focus:bg-white focus:border-[#124ec7] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPickRandom}
            disabled={stats.disponibles === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors shadow-2xs cursor-pointer disabled:cursor-not-allowed"
          >
            <Shuffle className="h-4 w-4" />
            <span>Elegir número libre al azar</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Actualizar tablero"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 disabled:opacity-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">
              {isRefreshing ? 'Actualizando...' : `Hace ${secondsSinceLastUpdate}s`}
            </span>
          </button>
        </div>
      </div>

      {/* Fila 2: Filtros de estado y auto-recarga */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onStatusFilterChange('Todas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'Todas'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Todos ({stats.total})
          </button>

          <button
            onClick={() => onStatusFilterChange('Disponible')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'Disponible'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${statusFilter === 'Disponible' ? 'bg-white' : 'bg-emerald-500'}`} />
            Disponibles ({stats.disponibles})
          </button>

          <button
            onClick={() => onStatusFilterChange('Ocupadas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'Ocupadas'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Ocupados ({ocupadas})
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none self-end sm:self-auto">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => onToggleAutoRefresh(e.target.checked)}
            className="rounded border-slate-300 text-[#124ec7] h-4 w-4"
          />
          <span>Actualizar cada 15s</span>
        </label>
      </div>

      {/* Fila 3: Selector por centenas */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none text-xs">
        <span className="text-slate-400 font-medium mr-1 shrink-0">Centena:</span>
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => onRangeFilterChange(r.id)}
            className={`px-2.5 py-1 rounded-md font-mono text-xs whitespace-nowrap transition-colors cursor-pointer ${
              rangeFilter === r.id
                ? 'bg-[#124ec7]/10 text-[#124ec7] border border-[#124ec7]/30 font-bold'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
};
