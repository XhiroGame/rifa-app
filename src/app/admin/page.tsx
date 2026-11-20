'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Ticket, TicketStatus, RaffleStats, TicketsApiResponse } from '@/types/ticket';
import { MESES_NOMBRES } from '@/lib/mockTickets';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Check,
  Phone,
  User,
  Search,
  RefreshCw,
  ExternalLink,
  LogOut,
  AlertCircle,
  ArrowLeft,
  FileImage,
  DollarSign,
  AlertTriangle,
  Trophy,
  MessageCircle,
  Key,
  Sheet,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { ReceiptZoomModal } from '@/components/ReceiptZoomModal';
import { InstructionsModal } from '@/components/InstructionsModal';
import { ApprovalWhatsAppModal } from '@/components/ApprovalWhatsAppModal';
import { getWhatsAppUrl, buildOverdueWhatsAppMessage } from '@/lib/whatsappMessages';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Datos de boletas
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'En revisión' | 'En mora' | 'Al día' | 'Completada' | 'Todas'>('En revisión');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para ver comprobante ampliado
  const [previewTicket, setPreviewTicket] = useState<{ ticket: Ticket; mes: number } | null>(null);

  // Estados de acción de aprobación/rechazo
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [approvalSuccessData, setApprovalSuccessData] = useState<{
    ticket: Ticket;
    mes: number;
    nombreMes: string;
  } | null>(null);

  // Verificar sesión existente en localStorage
  useEffect(() => {
    const authStored = localStorage.getItem('rifa_admin_logged');
    if (authStored === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAdminTickets = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/tickets', { cache: 'no-store' });
      const data: TicketsApiResponse = await res.json();
      if (data.success && data.tickets) {
        setTickets(data.tickets);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error al cargar boletas en admin:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminTickets();
    }
  }, [isAuthenticated, fetchAdminTickets]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('rifa_admin_logged', 'true');
        fetchAdminTickets();
      } else {
        setLoginError(data.message || 'Contraseña incorrecta.');
      }
    } catch (err) {
      setLoginError('Error de conexión al iniciar sesión.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('rifa_admin_logged');
  };

  // Aprobar o rechazar cuota mensual
  const handleCuotaAction = async (numero: string, mes: number, action: 'approve' | 'reject') => {
    setActionLoading(`${numero}-${mes}`);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero,
          mes,
          action,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(
          action === 'approve'
            ? `¡Cuota ${mes} (${MESES_NOMBRES[mes - 1]}) de la boleta #${numero} aprobada!`
            : `¡Cuota ${mes} de la boleta #${numero} rechazada!`,
          'success'
        );
        if (previewTicket?.ticket.numero === numero) {
          setPreviewTicket(null);
        }
        fetchAdminTickets(true);

        if (action === 'approve') {
          const currentTicket = tickets.find((t) => t.numero === numero);
          const cuotasPagadas = data.ticket?.cuotasPagadas || Math.max(currentTicket?.cuotasPagadas || 0, mes);
          const finalTicket: Ticket = {
            numero,
            estado: (cuotasPagadas >= 12 ? 'Completada' : 'Al día') as TicketStatus,
            nombre: data.ticket?.nombre || currentTicket?.nombre || '',
            telefono: data.ticket?.telefono || currentTicket?.telefono || '',
            claveSeguridad: data.ticket?.claveSeguridad || currentTicket?.claveSeguridad || 'N/A',
            cuotasPagadas,
            totalAbonado: cuotasPagadas * 100000,
            cuotas: currentTicket?.cuotas || [],
          };

          setApprovalSuccessData({
            ticket: finalTicket,
            mes,
            nombreMes: MESES_NOMBRES[mes - 1],
          });
        }
      } else {
        showToast(data.message || 'Error al procesar la acción.', 'error');
      }
    } catch (err) {
      showToast('Error de red al actualizar la cuota.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrado de boletas
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (activeTab !== 'Todas' && t.estado !== activeTab) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const query = searchQuery.trim().toLowerCase();
        const matchNum = t.numero.includes(query);
        const matchName = t.nombre?.toLowerCase().includes(query);
        const matchTel = t.telefono?.includes(query);
        const matchRef = t.referencia?.toLowerCase().includes(query);
        if (!matchNum && !matchName && !matchTel && !matchRef) return false;
      }

      return true;
    });
  }, [tickets, activeTab, searchQuery]);

  // Pantalla de Login
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-3">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black text-white">Administración de la Rifa</h1>
            <p className="text-xs text-slate-400 mt-1">
              Control de pagos mensuales ($100.000 COP) y aprobación de comprobantes
            </p>
          </div>

          {loginError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/15 p-3 text-xs font-medium text-rose-300 border border-rose-500/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contraseña de Administrador
              </label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña..."
                className="w-full rounded-2xl bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                * Por defecto: <code className="text-slate-300">admin123</code> (configurable en ADMIN_PASSWORD)
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 text-sm font-bold text-white transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              {isLoggingIn ? <span>Validando...</span> : <span>Ingresar al Panel</span>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a la vista pública</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Dashboard de Administración
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold animate-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                Rifas e Inversiones La Calidosa • Panel Admin
                <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  $100.000 / mes
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Aprobación de cuotas mensuales y gestión de participantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInstructions(true)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700 transition-colors shadow-sm cursor-pointer"
              title="Guía de configuración de Google Sheets"
            >
              <Sheet className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden md:inline">Guía Google Sheets</span>
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => fetchAdminTickets(false)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
            >
              <span>Ver Rifa Pública</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div
            onClick={() => setActiveTab('En revisión')}
            className={`rounded-2xl p-4 border transition-all cursor-pointer ${
              activeTab === 'En revisión'
                ? 'bg-violet-950/40 border-violet-500 ring-2 ring-violet-500/30'
                : 'bg-slate-900/90 border-violet-900/40 hover:border-violet-700/60'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400 block">
              Cuotas por Revisar
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-violet-300">{stats.enRevision}</span>
              {stats.enRevision > 0 && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                  Pendientes
                </span>
              )}
            </div>
          </div>

          <div
            onClick={() => setActiveTab('En mora')}
            className={`rounded-2xl p-4 border transition-all cursor-pointer ${
              activeTab === 'En mora'
                ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-slate-900/90 border-amber-900/40 hover:border-amber-700/60'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
              En Mora (Cobrar)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">{stats.enMora}</span>
              <span className="text-xs text-amber-500/90">deben cuotas</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('Al día')}
            className={`rounded-2xl p-4 border transition-all cursor-pointer ${
              activeTab === 'Al día'
                ? 'bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/30'
                : 'bg-slate-900/90 border-teal-900/40 hover:border-teal-700/60'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 block">
              Al Día
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-teal-300">{stats.alDia}</span>
              <span className="text-xs text-teal-500/90">al corriente</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('Completada')}
            className={`rounded-2xl p-4 border transition-all cursor-pointer ${
              activeTab === 'Completada'
                ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
                : 'bg-slate-900/90 border-indigo-900/40 hover:border-indigo-700/60'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
              12/12 Pagadas Total
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-indigo-300">{stats.completadas}</span>
              <span className="text-xs text-indigo-400/90">$1.2M cada una</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('Todas')}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 hover:border-slate-700 transition-colors cursor-pointer col-span-2 sm:col-span-1"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total Recaudado
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                ${stats.totalRecaudado.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('En revisión')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'En revisión'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'bg-slate-800 text-violet-300 hover:bg-slate-700'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Cuotas por Revisar ({stats.enRevision})</span>
            </button>

            <button
              onClick={() => setActiveTab('En mora')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'En mora'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>En Mora ({stats.enMora})</span>
            </button>

            <button
              onClick={() => setActiveTab('Al día')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'Al día'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-slate-800 text-teal-300 hover:bg-slate-700'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Al Día ({stats.alDia})</span>
            </button>

            <button
              onClick={() => setActiveTab('Completada')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'Completada'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-indigo-300 hover:bg-slate-700'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Completadas ({stats.completadas})</span>
            </button>

            <button
              onClick={() => setActiveTab('Todas')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'Todas'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span>Todas ({stats.total})</span>
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar # (ej: 023), nombre, ref..."
              className="w-full rounded-xl bg-slate-800/90 pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-400 border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-slate-900/60 border border-slate-800">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="mt-3 text-xs text-slate-400">Cargando mensualidades...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
            <h3 className="text-base font-bold text-white">No hay boletas en esta categoría</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => {
              const mesRevision = ticket.cuotaEnRevision || ticket.cuotasPagadas + 1;
              const isProcessing = actionLoading === `${ticket.numero}-${mesRevision}`;

              return (
                <div
                  key={ticket.numero}
                  className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                    ticket.estado === 'En revisión'
                      ? 'bg-slate-900/95 border-violet-500/50 shadow-xl shadow-violet-950/20'
                      : ticket.estado === 'En mora'
                      ? 'bg-slate-900/90 border-amber-900/50'
                      : ticket.estado === 'Completada'
                      ? 'bg-slate-900/90 border-indigo-900/50'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Número & Cuotas Pagadas */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xl font-black text-white">
                          #{ticket.numero}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                          {ticket.cuotasPagadas}/12 Cuotas (${(ticket.cuotasPagadas * 100000).toLocaleString('es-CO')})
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                          ticket.estado === 'En revisión'
                            ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 animate-pulse'
                            : ticket.estado === 'En mora'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : ticket.estado === 'Completada'
                            ? 'bg-indigo-500/20 text-amber-300 border-indigo-500/40'
                            : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        }`}
                      >
                        {ticket.estado}
                      </span>
                    </div>

                    {/* Datos del Participante */}
                    {(ticket.nombre || ticket.telefono) && (
                      <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">{ticket.nombre}</span>
                        </div>
                        {ticket.telefono && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="font-mono">{ticket.telefono}</span>
                            <a
                              href={`https://wa.me/${ticket.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                                ticket.estado === 'En mora'
                                  ? `Hola ${ticket.nombre || ''}, te escribo de Rifas e Inversiones La Calidosa. Queremos recordarte que tienes pendiente tu cuota mensual de la boleta #${ticket.numero} ($100.000 COP). ¿Deseas hacer el abono hoy?`
                                  : `Hola ${ticket.nombre || ''}, te contacto sobre tu boleta #${ticket.numero} de Rifas e Inversiones La Calidosa.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline"
                            >
                              Contactar WhatsApp
                            </a>
                          </div>
                        )}
                        {ticket.claveSeguridad && (
                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Key className="h-3 w-3 text-amber-400" />
                              <span>Clave Única (PIN Hex):</span>
                            </span>
                            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 tracking-widest uppercase">
                              {ticket.claveSeguridad}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Si está en mora: indicador claro y acceso al último comprobante subido si existe */}
                    {ticket.estado === 'En mora' && (
                      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-2.5 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-amber-300 font-bold">
                          <span>Comprobante del mes actual:</span>
                          <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[10px] text-amber-200 font-mono">
                            Pendiente
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Tiene {ticket.cuotasPagadas} cuota(s) pagada(s) y debe ponerse al día con los meses siguientes.
                        </p>
                        {ticket.comprobanteUrl && ticket.comprobanteUrl.startsWith('http') && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewTicket({
                                ticket,
                                mes: Math.max(1, ticket.cuotasPagadas || 1),
                              })
                            }
                            className="w-full mt-1 flex items-center justify-between rounded-xl bg-slate-800/90 hover:bg-slate-700/80 p-2 text-xs text-slate-200 border border-slate-700 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <FileImage className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Ver último comprobante (Cuota {Math.max(1, ticket.cuotasPagadas || 1)})</span>
                            </span>
                            <span className="text-[11px] text-indigo-400 font-semibold underline">
                              Abrir imagen
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Si tiene cuota en revisión: detalles de comprobante */}
                    {ticket.estado === 'En revisión' && (
                      <div className="rounded-2xl bg-violet-950/20 border border-violet-500/30 p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-violet-300 font-bold">
                          <span>Pago pendiente de aprobar:</span>
                          <span className="bg-violet-500/20 px-2 py-0.5 rounded text-[11px]">
                            Cuota {mesRevision} ({MESES_NOMBRES[mesRevision - 1]})
                          </span>
                        </div>

                        {ticket.referencia && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Referencia:</span>
                            <span className="font-mono font-bold text-white">{ticket.referencia}</span>
                          </div>
                        )}

                        {ticket.comprobanteUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewTicket({ ticket, mes: mesRevision })}
                            className="w-full mt-1.5 flex items-center justify-between rounded-xl bg-slate-800 hover:bg-slate-700/80 p-2 text-xs text-slate-200 border border-slate-700 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <FileImage className="h-4 w-4 text-emerald-400" />
                              <span>Ver Comprobante</span>
                            </span>
                            <span className="text-[11px] text-indigo-400 font-semibold underline">
                              Ampliar foto
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="pt-4 border-t border-slate-800/80 mt-3 space-y-2">
                    {ticket.estado === 'En revisión' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleCuotaAction(ticket.numero, mesRevision, 'approve')}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-2.5 px-3 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          {isProcessing ? <span>Aprobando...</span> : <span>Aprobar Cuota</span>}
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleCuotaAction(ticket.numero, mesRevision, 'reject')}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 py-2.5 px-3 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-rose-600/20"
                        >
                          <span>Rechazar</span>
                        </button>
                      </div>
                    ) : ticket.estado === 'En mora' ? (
                      <a
                        href={getWhatsAppUrl(
                          ticket.telefono || '',
                          buildOverdueWhatsAppMessage({
                            nombre: ticket.nombre,
                            numero: ticket.numero,
                            cuotasPagadas: ticket.cuotasPagadas || 0,
                            mesActual: 11,
                            nombreMesActual: 'Noviembre',
                          })
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 py-2.5 px-3 text-xs font-bold text-slate-950 transition-colors shadow-md cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Cobrar Mensualidad por WhatsApp</span>
                      </a>
                    ) : ticket.estado === 'Completada' ? (
                      <div className="space-y-1.5">
                        <div className="text-center text-xs text-indigo-300 font-bold py-0.5">
                          🏆 Boleta 100% Pagada ($1.200.000 COP)
                        </div>
                        {ticket.telefono && (
                          <button
                            type="button"
                            onClick={() => {
                              setApprovalSuccessData({
                                ticket,
                                mes: 12,
                                nombreMes: 'Diciembre',
                              });
                            }}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 py-2 px-3 text-xs font-semibold text-emerald-300 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>Reenviar Comprobante Final por WhatsApp</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="text-center text-xs text-teal-400 font-medium py-0.5">
                          ✓ Al día ({ticket.cuotasPagadas}/12 mensualidades)
                        </div>
                        {ticket.comprobanteUrl && ticket.comprobanteUrl.startsWith('http') && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewTicket({
                                ticket,
                                mes: Math.max(1, ticket.cuotasPagadas || 1),
                              })
                            }
                            className="w-full flex items-center justify-between rounded-xl bg-slate-800 hover:bg-slate-700/80 p-2 text-xs text-slate-200 border border-slate-700 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <FileImage className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Ver último comprobante (Cuota {Math.max(1, ticket.cuotasPagadas || 1)})</span>
                            </span>
                            <span className="text-[11px] text-indigo-400 font-semibold underline">
                              Abrir imagen
                            </span>
                          </button>
                        )}
                        {ticket.telefono && (
                          <button
                            type="button"
                            onClick={() => {
                              const ultMes = ticket.cuotasPagadas || 1;
                              setApprovalSuccessData({
                                ticket,
                                mes: ultMes,
                                nombreMes: MESES_NOMBRES[ultMes - 1],
                              });
                            }}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 py-2 px-3 text-xs font-semibold text-emerald-300 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>Enviar PIN y Notificación por WhatsApp</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para ver comprobante ampliado con Zoom y Pan interactivo */}
      {previewTicket && (
        <ReceiptZoomModal
          isOpen={Boolean(previewTicket)}
          onClose={() => setPreviewTicket(null)}
          imageUrl={previewTicket.ticket.comprobanteUrl || null}
          details={{
            numero: previewTicket.ticket.numero,
            mes: previewTicket.mes,
            nombreMes: MESES_NOMBRES[previewTicket.mes - 1],
            nombre: previewTicket.ticket.nombre,
            telefono: previewTicket.ticket.telefono,
            referencia: previewTicket.ticket.referencia,
          }}
          actions={
            previewTicket.ticket.estado === 'En revisión' ? (
              <>
                <button
                  type="button"
                  disabled={actionLoading === `${previewTicket.ticket.numero}-${previewTicket.mes}`}
                  onClick={() =>
                    handleCuotaAction(previewTicket.ticket.numero, previewTicket.mes, 'reject')
                  }
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Rechazar Cuota
                </button>

                <button
                  type="button"
                  disabled={actionLoading === `${previewTicket.ticket.numero}-${previewTicket.mes}`}
                  onClick={() =>
                    handleCuotaAction(previewTicket.ticket.numero, previewTicket.mes, 'approve')
                  }
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {actionLoading === `${previewTicket.ticket.numero}-${previewTicket.mes}`
                    ? 'Procesando...'
                    : 'Aprobar Cuota ($100.000 COP)'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setPreviewTicket(null)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Cerrar Visor
              </button>
            )
          }
        />
      )}

      {/* Modal con la Guía técnica para conectar Google Sheets */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      {/* Modal para enviar confirmación oficial y PIN al WhatsApp del cliente */}
      <ApprovalWhatsAppModal
        isOpen={Boolean(approvalSuccessData)}
        onClose={() => setApprovalSuccessData(null)}
        ticket={approvalSuccessData?.ticket || null}
        mes={approvalSuccessData?.mes || 1}
        nombreMes={approvalSuccessData?.nombreMes || ''}
      />
    </main>
  );
}
