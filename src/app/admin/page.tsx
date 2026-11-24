'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Ticket, TicketStatus, RaffleStats, TicketsApiResponse } from '@/types/ticket';
import { MESES_NOMBRES, MES_ACTUAL_RIFA } from '@/lib/mockTickets';
import {
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
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
  AlertTriangle,
  Trophy,
  MessageCircle,
  Key,
  MapPin,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { ReceiptZoomModal } from '@/components/ReceiptZoomModal';
import { ApprovalWhatsAppModal } from '@/components/ApprovalWhatsAppModal';
import { getWhatsAppUrl, buildOverdueWhatsAppMessage } from '@/lib/whatsappMessages';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  const [previewTicket, setPreviewTicket] = useState<{ ticket: Ticket; mes: number } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [approvalSuccessData, setApprovalSuccessData] = useState<{
    ticket: Ticket;
    mes: number;
    nombreMes: string;
  } | null>(null);

  useEffect(() => {
    const authStored = localStorage.getItem('rifa_admin_session_v2');
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
      const res = await fetch('/api/tickets?admin=1', {
        cache: 'no-store',
        headers: { 'x-admin-auth': 'authenticated_v2' },
      });
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
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('rifa_admin_session_v2', 'true');
        fetchAdminTickets();
      } else {
        setLoginError(data.message || 'Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      setLoginError('Error de conexión al iniciar sesión.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    localStorage.removeItem('rifa_admin_session_v2');
    localStorage.removeItem('rifa_admin_logged');
  };

  const handleCuotaAction = async (numero: string, mes: number, action: 'approve' | 'reject') => {
    setActionLoading(`${numero}-${mes}`);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-auth': 'authenticated_v2' },
        body: JSON.stringify({ numero, mes, action }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(
          action === 'approve'
            ? `Cuota ${mes} (${MESES_NOMBRES[mes - 1]}) de #${numero} aprobada`
            : `Cuota ${mes} de #${numero} rechazada`,
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

  const handleBatchApproveGroup = async (groupTickets: Ticket[]) => {
    if (groupTickets.length === 0) return;
    const primary = groupTickets[0];
    const primaryMes = primary.cuotaEnRevision || primary.cuotasPagadas + 1;
    setActionLoading(`batch-${primary.numero}`);
    try {
      for (const gt of groupTickets) {
        const gtMes = gt.cuotaEnRevision || gt.cuotasPagadas + 1;
        await fetch('/api/admin/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-auth': 'authenticated_v2' },
          body: JSON.stringify({ numero: gt.numero, mes: gtMes, action: 'approve' }),
        });
      }
      showToast(
        `Aprobadas las ${groupTickets.length} boletas (${groupTickets.map((t) => `#${t.numero}`).join(', ')})`,
        'success'
      );
      if (previewTicket) setPreviewTicket(null);
      fetchAdminTickets(true);
      setApprovalSuccessData({
        ticket: { ...primary, estado: 'Al día', cuotasPagadas: primaryMes },
        mes: primaryMes,
        nombreMes: MESES_NOMBRES[primaryMes - 1],
      });
    } catch (err) {
      showToast('Error al aprobar el grupo de boletas.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (activeTab !== 'Todas' && t.estado !== activeTab) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const query = searchQuery.trim().toLowerCase().replace(/^#/, '');
        const matchNum = t.numero.includes(query);
        const matchName = t.nombre?.toLowerCase().includes(query);
        const matchTel = t.telefono?.toLowerCase().includes(query);
        const matchRef = t.referencia?.toLowerCase().includes(query);
        const matchNotas = t.notas?.toLowerCase().includes(query);
        if (!matchNum && !matchName && !matchTel && !matchRef && !matchNotas) return false;
      }

      return true;
    });
  }, [tickets, activeTab, searchQuery]);

  // Pantalla de Login
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f5f6f8] text-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 shadow-lg">
          <div className="text-center mb-6">
            <img
              src="/logo-calidosa.png"
              alt="Rifa e Inversiones La Calidosa"
              className="h-20 w-auto object-contain mx-auto mb-3"
            />
            <h1 className="text-xl font-extrabold text-slate-900">Panel Administrativo</h1>
            <p className="text-xs text-slate-500 mt-1">
              Control de recaudos, cuotas mensuales y aprobación de comprobantes
            </p>
          </div>

          {loginError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Usuario administrador
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="w-full rounded-xl bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#124ec7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full rounded-xl bg-slate-50 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#124ec7]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#124ec7] hover:bg-[#0f41a8] disabled:opacity-50 py-3 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              {isLoggingIn ? <span>Verificando...</span> : <span>Ingresar al panel</span>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#124ec7] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver al tablero público</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Dashboard Administrativo
  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-900 antialiased pb-20">
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-in slide-in-from-top-4 duration-150 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Barra Superior */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo-calidosa.png"
              alt="La Calidosa"
              className="h-11 w-auto object-contain shrink-0"
            />
            <div className="h-7 w-[1px] bg-slate-200 hidden sm:block" />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900">
                Panel Administrativo · La Calidosa
              </h1>
              <p className="text-[11px] text-slate-500">
                Plan de Premios 2027 · $100.000 COP / mes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAdminTickets(false)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
            >
              <span>Tablero público</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            onClick={() => setActiveTab('En revisión')}
            className={`rounded-2xl p-4 border bg-white transition-all cursor-pointer ${
              activeTab === 'En revisión'
                ? 'border-2 border-[#124ec7] shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-semibold text-slate-500 block">Por revisar</span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#124ec7]">{stats.enRevision}</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('En mora')}
            className={`rounded-2xl p-4 border bg-white transition-all cursor-pointer ${
              activeTab === 'En mora'
                ? 'border-2 border-amber-500 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-semibold text-slate-500 block">En mora</span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.enMora}</span>
              <span className="text-xs text-slate-500">pendientes</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('Al día')}
            className={`rounded-2xl p-4 border bg-white transition-all cursor-pointer ${
              activeTab === 'Al día'
                ? 'border-2 border-emerald-600 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-semibold text-slate-500 block">Al día</span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-700">{stats.alDia}</span>
              <span className="text-xs text-slate-500">al corriente</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('Completada')}
            className={`rounded-2xl p-4 border bg-white transition-all cursor-pointer ${
              activeTab === 'Completada'
                ? 'border-2 border-amber-600 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-semibold text-slate-500 block">12/12 Saldadas</span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.completadas}</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('Todas')}
            className="rounded-2xl bg-white border border-slate-200 p-4 hover:border-slate-300 transition-colors cursor-pointer col-span-2 sm:col-span-1"
          >
            <span className="text-xs font-semibold text-slate-500 block">Total recaudado</span>
            <div className="mt-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-emerald-700 font-mono">
                ${stats.totalRecaudado.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas y Buscador */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('En revisión')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'En revisión'
                  ? 'bg-[#124ec7] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Por revisar ({stats.enRevision})</span>
            </button>

            <button
              onClick={() => setActiveTab('En mora')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'En mora'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>En mora ({stats.enMora})</span>
            </button>

            <button
              onClick={() => setActiveTab('Al día')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'Al día'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Al día ({stats.alDia})</span>
            </button>

            <button
              onClick={() => setActiveTab('Completada')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'Completada'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Completadas ({stats.completadas})</span>
            </button>

            <button
              onClick={() => setActiveTab('Todas')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'Todas'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
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
              placeholder="Buscar #, nombre, lugar, referido..."
              className="w-full rounded-xl bg-slate-50 pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#124ec7]"
            />
          </div>
        </div>

        {/* Listado de Tarjetas */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white border border-slate-200">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#124ec7] border-t-transparent" />
            <p className="mt-3 text-xs text-slate-500">Cargando mensualidades...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-white border border-slate-200 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-2" />
            <h3 className="text-base font-bold text-slate-900">No hay boletas en esta categoría</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => {
              const mesRevision = ticket.cuotaEnRevision || ticket.cuotasPagadas + 1;
              const isProcessing = actionLoading === `${ticket.numero}-${mesRevision}`;

              return (
                <div
                  key={ticket.numero}
                  className={`rounded-2xl border bg-white p-5 flex flex-col justify-between shadow-2xs ${
                    ticket.estado === 'En revisión'
                      ? 'border-2 border-[#124ec7]'
                      : ticket.estado === 'En mora'
                      ? 'border-amber-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xl font-extrabold text-slate-900">
                          #{ticket.numero}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {ticket.cuotasPagadas}/12 (${(ticket.totalAbonado ?? ticket.cuotasPagadas * 100000).toLocaleString('es-CO')})
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          ticket.estado === 'En revisión'
                            ? 'bg-blue-50 text-[#124ec7] border-blue-200'
                            : ticket.estado === 'En mora'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : ticket.estado === 'Completada'
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : ticket.estado === 'Disponible'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {ticket.estado}
                      </span>
                    </div>

                    {(ticket.nombre || ticket.telefono || ticket.notas) && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1.5 text-xs">
                        {ticket.nombre && (
                          <div className="flex items-center gap-2 text-slate-900 font-bold">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{ticket.nombre}</span>
                          </div>
                        )}
                        {ticket.telefono && (
                          <div className="flex items-center justify-between text-slate-600 gap-2">
                            <span className="flex items-center gap-1.5 font-mono truncate">
                              {/\d{7,}/.test(ticket.telefono) ? (
                                <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5 text-[#124ec7] shrink-0" />
                              )}
                              <span className="truncate">{ticket.telefono}</span>
                            </span>
                            {/\d{10}/.test(ticket.telefono.replace(/\D/g, '')) && (
                              <a
                                href={getWhatsAppUrl(
                                  ticket.telefono,
                                  ticket.estado === 'En mora'
                                    ? `Hola ${ticket.nombre || ''}, te escribo de Rifas e Inversiones La Calidosa. Queremos recordarte que tienes pendiente tu cuota mensual de la boleta #${ticket.numero} ($100.000 COP). ¿Deseas hacer el abono hoy?`
                                    : `Hola ${ticket.nombre || ''}, te contacto sobre tu boleta #${ticket.numero} de Rifas e Inversiones La Calidosa.`
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-semibold text-emerald-700 hover:underline shrink-0"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        )}
                        {ticket.notas && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-600 pt-1 border-t border-slate-200/70">
                            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="break-words">{ticket.notas}</span>
                          </div>
                        )}
                        {ticket.claveSeguridad && (
                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/70">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Key className="h-3 w-3 text-amber-600" />
                              <span>PIN Hex:</span>
                            </span>
                            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 tracking-widest uppercase">
                              {ticket.claveSeguridad}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {ticket.estado === 'En mora' && (
                      <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-2.5 space-y-1 text-xs">
                        <div className="flex justify-between items-center text-amber-900 font-semibold">
                          <span>Mes actual:</span>
                          <span className="text-[11px] font-mono">Pendiente</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Tiene {ticket.cuotasPagadas} cuota(s) pagada(s).
                        </p>
                      </div>
                    )}

                    {ticket.estado === 'En revisión' && (
                      <div className="rounded-xl bg-blue-50/60 border border-blue-200 p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-[#124ec7] font-bold">
                          <span>Por aprobar:</span>
                          <span>
                            Cuota {mesRevision} ({MESES_NOMBRES[mesRevision - 1]})
                          </span>
                        </div>

                        {ticket.referencia && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Referencia:</span>
                            <span className="font-mono font-bold text-slate-900">{ticket.referencia}</span>
                          </div>
                        )}

                        {ticket.comprobanteUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewTicket({ ticket, mes: mesRevision })}
                            className="w-full mt-1.5 flex items-center justify-between rounded-lg bg-white hover:bg-slate-50 p-2 text-xs text-slate-800 border border-blue-200 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-semibold">
                              <FileImage className="h-4 w-4 text-[#124ec7]" />
                              <span>Ver comprobante</span>
                            </span>
                            <span className="text-[11px] text-[#124ec7] font-semibold underline">
                              Ampliar
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="pt-4 border-t border-slate-100 mt-3 space-y-2">
                    {ticket.estado === 'En revisión' ? (
                      (() => {
                        const groupSiblings =
                          ticket.referencia || ticket.comprobanteUrl
                            ? tickets.filter(
                                (other) =>
                                  other.estado === 'En revisión' &&
                                  ((ticket.referencia && other.referencia === ticket.referencia) ||
                                    (ticket.comprobanteUrl && other.comprobanteUrl === ticket.comprobanteUrl))
                              )
                            : [ticket];
                        const isBatchLoading = actionLoading === `batch-${groupSiblings[0]?.numero}`;

                        return (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={isProcessing || isBatchLoading}
                                onClick={() => handleCuotaAction(ticket.numero, mesRevision, 'approve')}
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 py-2.5 px-3 text-xs font-semibold text-white transition-colors cursor-pointer"
                              >
                                {isProcessing ? <span>Aprobando...</span> : <span>Aprobar cuota</span>}
                              </button>

                              <button
                                type="button"
                                disabled={isProcessing || isBatchLoading}
                                onClick={() => handleCuotaAction(ticket.numero, mesRevision, 'reject')}
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 py-2.5 px-3 text-xs font-semibold text-white transition-colors cursor-pointer"
                              >
                                <span>Rechazar</span>
                              </button>
                            </div>
                            {groupSiblings.length > 1 && (
                              <button
                                type="button"
                                disabled={isProcessing || isBatchLoading}
                                onClick={() => handleBatchApproveGroup(groupSiblings)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#124ec7] hover:bg-[#0f41a8] disabled:opacity-50 py-2 px-3 text-xs font-semibold text-white transition-colors cursor-pointer"
                              >
                                {isBatchLoading ? (
                                  <span>Aprobando las {groupSiblings.length} boletas...</span>
                                ) : (
                                  <span>
                                    Aprobar las {groupSiblings.length} boletas ($
                                    {(groupSiblings.length * 100000).toLocaleString('es-CO')})
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })()
                    ) : ticket.estado === 'En mora' ? (
                      /\d{10}/.test((ticket.telefono || '').replace(/\D/g, '')) ? (
                        <a
                          href={getWhatsAppUrl(
                            ticket.telefono || '',
                            buildOverdueWhatsAppMessage({
                              nombre: ticket.nombre,
                              numero: ticket.numero,
                              cuotasPagadas: ticket.cuotasPagadas || 0,
                              mesActual: MES_ACTUAL_RIFA,
                              nombreMesActual: MESES_NOMBRES[MES_ACTUAL_RIFA - 1],
                            })
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 px-3 text-xs font-semibold text-slate-950 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Recordar cuota por WhatsApp</span>
                        </a>
                      ) : (
                        <div className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 px-3 text-[11px] text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          <span>{ticket.telefono ? `Lugar: ${ticket.telefono}` : 'Sin teléfono registrado'}</span>
                        </div>
                      )
                    ) : ticket.estado === 'Completada' ? (
                      <div className="space-y-1.5">
                        <div className="text-center text-xs text-amber-800 font-bold py-0.5">
                          🏆 Boleta 100% saldada ($1.200.000 COP)
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setApprovalSuccessData({
                              ticket,
                              mes: 12,
                              nombreMes: MESES_NOMBRES[11],
                            });
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2 px-3 text-xs font-semibold text-emerald-800 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Ver / Copiar PIN y comprobante final</span>
                        </button>
                      </div>
                    ) : ticket.estado === 'Disponible' ? (
                      <div className="text-center text-xs text-slate-500 py-1">
                        Boleta libre para apartar
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="text-center text-xs text-emerald-700 font-semibold py-0.5">
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
                            className="w-full flex items-center justify-between rounded-xl bg-slate-50 hover:bg-slate-100 p-2 text-xs text-slate-700 border border-slate-200 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <FileImage className="h-3.5 w-3.5 text-[#124ec7]" />
                              <span>Ver último comprobante</span>
                            </span>
                            <span className="text-[11px] text-[#124ec7] font-semibold underline">
                              Abrir
                            </span>
                          </button>
                        )}
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
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2 px-3 text-xs font-semibold text-emerald-800 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Ver / Enviar PIN y notificación</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Rechazar cuota
                </button>

                <button
                  type="button"
                  disabled={actionLoading === `${previewTicket.ticket.numero}-${previewTicket.mes}`}
                  onClick={() =>
                    handleCuotaAction(previewTicket.ticket.numero, previewTicket.mes, 'approve')
                  }
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-5 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  {actionLoading === `${previewTicket.ticket.numero}-${previewTicket.mes}`
                    ? 'Procesando...'
                    : 'Aprobar cuota'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setPreviewTicket(null)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Cerrar visor
              </button>
            )
          }
        />
      )}

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
