'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Ticket, TicketStatus, PublicStatusFilter, RaffleStats, RaffleConfig, TicketsApiResponse } from '@/types/ticket';
import { Header } from '@/components/Header';
import { StatsCards } from '@/components/StatsCards';
import { FilterBar } from '@/components/FilterBar';
import { TicketGrid } from '@/components/TicketGrid';
import { TicketModal } from '@/components/TicketModal';
import { CheckoutModal } from '@/components/CheckoutModal';

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<RaffleStats>({
    total: 1000,
    disponibles: 1000,
    alDia: 0,
    enMora: 0,
    enRevision: 0,
    completadas: 0,
    totalRecaudado: 0,
    porcentajeRecaudado: 0,
  });
  const [config, setConfig] = useState<RaffleConfig>({
    title: 'Rifas e Inversiones La Calidosa',
    subtitle: 'Elige tu número de la suerte del 000 al 999 y abona tu cuota mensual de $100.000 COP',
    prize: 'Primer Premio: Carro 0 Km o $70,000,000 COP',
    monthlyPrice: '$100,000 COP / mes',
    totalPrice: '$1,200,000 COP (12 cuotas)',
    mesActual: 1,
    drawDate: 'Noviembre de 2027',
    lotteryName: 'Lotería de Medellín (Últimas 3 cifras)',
    whatsappNumber: '573135982641',
    isDemo: true,
  });

  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PublicStatusFilter>('Todas');
  const [rangeFilter, setRangeFilter] = useState('all');

  // Modals state
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [checkoutData, setCheckoutData] = useState<{ ticket: Ticket; mes: number; pin?: string } | null>(null);

  // Fetch tickets from API
  const fetchTicketsData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/tickets', { cache: 'no-store' });
      const data: TicketsApiResponse = await res.json();

      if (data.success && data.tickets) {
        setTickets(data.tickets);
        setStats(data.stats);
        if (data.config) setConfig(data.config);
        setIsDemo(data.isDemo);
        setLastUpdated(new Date());
        setSecondsElapsed(0);
      }
    } catch (err) {
      console.error('Error al sincronizar boletas:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTicketsData();
  }, [fetchTicketsData]);

  // Elapsed seconds timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Auto-refresh interval (every 15 seconds if enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTicketsData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTicketsData]);

  // Filtered tickets memoized
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (searchQuery.trim() !== '') {
        const query = searchQuery.trim().toLowerCase();
        const matchesNum = ticket.numero.includes(query);
        const matchesName = ticket.nombre?.toLowerCase().includes(query);
        const matchesTel = ticket.telefono?.includes(query);
        if (!matchesNum && !matchesName && !matchesTel) return false;
      }

      if (statusFilter === 'Disponible') {
        if (ticket.estado !== 'Disponible') return false;
      } else if (statusFilter === 'Ocupadas') {
        if (ticket.estado === 'Disponible') return false;
      }

      if (rangeFilter !== 'all') {
        const [startStr, endStr] = rangeFilter.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        const num = parseInt(ticket.numero, 10);
        if (num < start || num > end) return false;
      }

      return true;
    });
  }, [tickets, searchQuery, statusFilter, rangeFilter]);

  // Random number picker (among available ones)
  const handlePickRandom = () => {
    const available = tickets.filter((t) => t.estado === 'Disponible');
    if (available.length === 0) return;
    const randomIndex = Math.floor(Math.random() * available.length);
    const chosen = available[randomIndex];
    setDetailTicket(chosen);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('Todas');
    setRangeFilter('all');
  };

  // Abrir pago de cuota con clave única opcional
  const handlePayNextCuota = (ticket: Ticket, mes: number, pin?: string) => {
    setDetailTicket(null);
    setCheckoutData({ ticket, mes, pin });
  };

  // Apartar boleta libre
  const handleReserveNew = (ticket: Ticket) => {
    setDetailTicket(null);
    setCheckoutData({ ticket, mes: 1 });
  };

  // Éxito al subir comprobante de cuota
  const handleCheckoutSuccess = (ticketNumero: string, mes: number) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.numero === ticketNumero
          ? {
              ...t,
              estado: 'En revisión',
              cuotaEnRevision: mes,
            }
          : t
      )
    );
    fetchTicketsData(true);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        {/* Header Hero */}
        <Header
          config={config}
          isDemo={isDemo}
        />

        {/* Real-time Stats Cards */}
        <StatsCards stats={stats} />

        {/* Filter & Controls Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          rangeFilter={rangeFilter}
          onRangeFilterChange={setRangeFilter}
          onPickRandom={handlePickRandom}
          onRefresh={() => fetchTicketsData(false)}
          isRefreshing={isRefreshing}
          secondsSinceLastUpdate={secondsElapsed}
          stats={stats}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={setAutoRefresh}
        />

        {/* Ticket Grid (000 to 999) */}
        <TicketGrid
          tickets={filteredTickets}
          totalTicketsCount={tickets.length}
          selectedNumbers={new Set()}
          onTicketClick={(ticket) => setDetailTicket(ticket)}
          onResetFilters={handleResetFilters}
          isLoading={isLoading}
        />

        {/* Modal de Detalle de Boleta y Plan de 12 Cuotas */}
        <TicketModal
          ticket={detailTicket}
          config={config}
          onClose={() => setDetailTicket(null)}
          onPayNextCuota={handlePayNextCuota}
          onReserveNew={handleReserveNew}
        />

        {/* Modal de Pago de Cuota y Comprobante */}
        <CheckoutModal
          isOpen={Boolean(checkoutData)}
          ticket={checkoutData?.ticket || null}
          mes={checkoutData?.mes || 1}
          initialPin={checkoutData?.pin}
          config={config}
          onClose={() => setCheckoutData(null)}
          onSuccess={handleCheckoutSuccess}
        />
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-400">Rifas e Inversiones La Calidosa</p>
        <p className="mt-1 text-slate-600">
          Plan 12 Meses (000 al 999) • Cuotas de $100.000 COP • Sincronización en tiempo real vía Google Sheets API v4
        </p>
        <div className="mt-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-400 transition-colors"
          >
            <span>Acceso Administrador (Revisar y Aprobar Cuotas Mensuales)</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}
