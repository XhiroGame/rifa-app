'use client';

import React from 'react';
import { Ticket, RaffleConfig } from '@/types/ticket';
import { ShoppingBag, X, ArrowRight, Sparkles } from 'lucide-react';

interface SelectionBarProps {
  selectedNumbers: string[];
  config: RaffleConfig;
  onClear: () => void;
  onOpenCheckout: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedNumbers,
  config,
  onClear,
  onOpenCheckout,
}) => {
  if (selectedNumbers.length === 0) return null;

  // Intentar parsear el precio para calcular el total
  const priceStr = config.monthlyPrice || config.ticketPrice || '$100.000';
  const numericPrice = parseInt(priceStr.replace(/\D/g, ''), 10) || 100000;
  const totalPrice = numericPrice * selectedNumbers.length;
  const formattedTotal =
    numericPrice > 0
      ? `$${totalPrice.toLocaleString('es-CO')} COP`
      : `${selectedNumbers.length} boleta(s)`;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto animate-in slide-in-from-bottom-6 duration-200">
      <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 p-4 shadow-2xl shadow-emerald-950/40 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Info & Badges */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShoppingBag className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {selectedNumbers.length} {selectedNumbers.length === 1 ? 'boleta elegida' : 'boletas elegidas'}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {formattedTotal}
              </span>
            </div>

            {/* Badges of selected tickets */}
            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto no-scrollbar py-0.5">
              {selectedNumbers.slice(0, 6).map((num) => (
                <span
                  key={num}
                  className="font-mono text-xs font-bold bg-slate-800 text-emerald-300 px-2 py-0.5 rounded-md border border-slate-700 shrink-0"
                >
                  #{num}
                </span>
              ))}
              {selectedNumbers.length > 6 && (
                <span className="text-xs text-slate-400 font-medium shrink-0">
                  +{selectedNumbers.length - 6} más
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-colors cursor-pointer border border-slate-700"
            title="Deseleccionar todas"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>

          <button
            onClick={onOpenCheckout}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <span>Subir Comprobante</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

