'use client';

import React, { useState } from 'react';
import { RaffleConfig } from '@/types/ticket';
import {
  Sparkles,
  Calendar,
  Trophy,
  Coins,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Landmark,
  Smartphone,
  ShieldCheck,
  FileText,
  UserCheck,
  Eye,
  X,
} from 'lucide-react';

interface HeaderProps {
  config: RaffleConfig;
  isDemo: boolean;
}

const CLAUSULAS_PLAN_2027 = [
  'No se recibe dinero en efectivo, solo consignaciones y transferencia en las cuentas bancarias autorizadas.',
  'Se debe estar a paz y salvo los primeros 3 días de cada mes.',
  'Si un anticipo de Un millón de pesos cae en un número que no esté al día o en un número que no se haya vendido, en forma automática se distribuirá así: $500.000 al número anterior y $500.000 al posterior siempre y cuando estén al día, y si no están al día al siguiente número en la misma línea.',
  'Antes de iniciar los sorteos del PLAN 2027, cuando jueguen los anticipos de DIEZ MILLONES y el premio mayor de DOSCIENTOS MILLONES se dará a conocer la lista de familiares de sangre y políticos con sus respectivos números para mayor transparencia y legalidad.',
  'A los ganadores de los anticipos se les hará devolución del dinero consignado a la fecha y quedará saldado el costo de la boleta, como siempre hemos hecho.',
  'Las cuotas deben pagarse de forma anticipada, boleta que no esté al día no entra a los sorteos.',
  'Si el cliente se retira no se hará devolución del dinero.',
  'No se rematarán boletas, el costo siempre será el mismo.',
  'No aplicamos el impuesto de ganancia ocasional, se entregará al CIEN POR CIENTO la premiación establecida.',
];

export const Header: React.FC<HeaderProps> = ({ config }) => {
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const handleCopyAccount = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedAccount(key);
    setTimeout(() => setCopiedAccount(null), 2200);
  };

  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-2xl border border-slate-700/60 mb-8">
      {/* Decorative gradient blur background */}
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5">
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>PLAN DE PREMIOS 2027 • $800.000.000 EN PREMIOS</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-2.5 py-1 text-[11px] font-bold text-indigo-200 border border-indigo-500/30">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Responsable: DELWIN CALIZ</span>
                </span>
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
          <div className="flex flex-col items-start md:items-end justify-center rounded-2xl bg-slate-800/90 p-4 border border-slate-700 shadow-inner shrink-0">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-emerald-400" />
              Mensualidad por Boleta
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {config.monthlyPrice}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Valor de la boleta: <strong className="text-white">$1.200.000 COP (12 cuotas)</strong>
            </span>
          </div>
        </div>

        {/* 3 Main Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3.5 border border-amber-500/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-300/90">Premio Mayor y Bolsa Total</p>
              <p className="text-sm font-bold text-white truncate">
                Mayor $200 Millones • Total $800 Millones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/60">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">Sorteos y Gran Final</p>
              <p className="text-sm font-semibold text-white truncate">
                Diarios Lun-Vie • 1er Sáb Mes • Final 28 Oct 2027
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/60">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">Loterías Oficiales (3 Cifras)</p>
              <p className="text-sm font-semibold text-white truncate">
                Bogotá, Boyacá y Loterías Nacionales
              </p>
            </div>
          </div>
        </div>

        {/* Cuentas Autorizadas + Botón para Desplegar Plan de Premios 2027 y Cláusulas */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl bg-slate-950/60 border border-slate-700/70 p-3.5">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mr-1">
              <Landmark className="h-4 w-4 text-amber-400" />
              <span>Cuentas Autorizadas:</span>
            </span>

            {/* Bancolombia */}
            <button
              type="button"
              onClick={() => handleCopyAccount('29700006972', 'bancolombia')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 transition-colors cursor-pointer"
              title="Clic para copiar número de cuenta Bancolombia"
            >
              <span className="text-slate-300 font-medium">Bancolombia Ahorros:</span>
              <span className="font-mono font-black text-amber-300 tracking-wide">297 000069 72</span>
              {copiedAccount === 'bancolombia' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>

            {/* Nequi */}
            <button
              type="button"
              onClick={() => handleCopyAccount('3135982641', 'nequi')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 transition-colors cursor-pointer"
              title="Clic para copiar número Nequi"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-300 font-medium">Nequi:</span>
              <span className="font-mono font-black text-emerald-300 tracking-wide">3135982641</span>
              {copiedAccount === 'nequi' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFlyerModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-2 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <Eye className="h-3.5 w-3.5 text-amber-400" />
              <span>Ver Volante Oficial</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFullPlan(!showFullPlan)}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-4 py-2 text-xs font-black transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Trophy className="h-4 w-4" />
              <span>{showFullPlan ? 'Ocultar Plan de Premios y Cláusulas' : 'Ver Plan de Premios 2027 y Cláusulas'}</span>
              {showFullPlan ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Panel Desplegable: Plan de Premios 2027 Completo + Cláusulas */}
        {showFullPlan && (
          <div className="rounded-2xl bg-slate-950/85 border border-amber-500/30 p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-amber-300 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <span>PLAN DE PREMIOS 2027 • TOTAL $800.000.000 COP</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Todos los sorteos juegan con las <strong>tres (3) últimas cifras</strong> de las loterías oficiales del ámbito nacional.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                <span>100% Premiación Libre de Impuesto</span>
              </span>
            </div>

            {/* 3 Bloques de Premios */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 1. Anticipos Diarios */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    1. Anticipos Diarios
                  </span>
                  <span className="font-mono text-sm font-black text-white">$250.000.000</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">250 anticipos de $1.000.000 COP</strong> todos los días de lunes a viernes hasta los días festivos con las 3 últimas cifras:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300 font-medium bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <li className="flex justify-between">
                    <span className="text-amber-300 font-bold">LUNES:</span>
                    <span>Lotería de Cundinamarca</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-amber-300 font-bold">MARTES:</span>
                    <span>Lotería de la Cruz Roja</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-amber-300 font-bold">MIÉRCOLES:</span>
                    <span>Lotería de Manizales</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-amber-300 font-bold">JUEVES:</span>
                    <span>Lotería del Quindío</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-amber-300 font-bold">VIERNES:</span>
                    <span>Lotería de Santander</span>
                  </li>
                </ul>
              </div>

              {/* 2. Anticipos Mensuales - Lotería de Boyacá */}
              <div className="rounded-2xl bg-slate-900/90 border border-indigo-500/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                    2. Primer Sábado de Cada Mes
                  </span>
                  <span className="font-mono text-sm font-black text-white">$228.000.000</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Con las 3 últimas cifras de la <strong className="text-indigo-300">Lotería de Boyacá</strong> el primer sábado de Nov y Dic 2026; Ene a Oct 2027:
                </p>
                <ul className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <li>
                    • <strong className="text-white">12 anticipos de $10.000.000 COP</strong> (Total: $120.000.000).
                  </li>
                  <li>
                    • <strong className="text-emerald-300">$1.000.000</strong> al número anterior y <strong className="text-emerald-300">$1.000.000</strong> al número posterior ese mismo sábado (Total: $24.000.000).
                  </li>
                  <li>
                    • <strong className="text-amber-300">$500.000</strong> a las 9 personas con las <strong>2 últimas cifras</strong> del ganador (Total: $54.000.000).
                  </li>
                  <li>
                    • <strong className="text-amber-300">$500.000</strong> a las 5 personas con los <strong>números combinados</strong> del ganador (Total: $30.000.000).
                  </li>
                </ul>
              </div>

              {/* 3. Gran Sorteo Final - Jueves 28 de Octubre 2027 */}
              <div className="rounded-2xl bg-gradient-to-b from-amber-500/15 to-slate-900/95 border border-amber-500/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    3. Sorteo Final • 28 Oct 2027
                  </span>
                  <span className="font-mono text-sm font-black text-amber-300">$298.000.000</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Jueves <strong>28 de Octubre de 2027</strong> con las 3 últimas cifras de la <strong className="text-amber-300">Lotería de Bogotá</strong>:
                </p>
                <ul className="space-y-2 text-xs text-slate-200 bg-slate-950/70 p-3 rounded-xl border border-amber-500/25">
                  <li>
                    🏆 <strong className="text-amber-300">PREMIO MAYOR: $200.000.000 COP</strong>
                  </li>
                  <li>
                    • <strong className="text-emerald-300">$20.000.000</strong> al número anterior y <strong className="text-emerald-300">$20.000.000</strong> al número posterior.
                  </li>
                  <li>
                    • <strong className="text-white">$2.000.000</strong> a las 9 personas con las <strong>2 últimas cifras</strong> del ganador ($18.000.000).
                  </li>
                  <li>
                    • <strong className="text-white">$2.000.000</strong> a las 5 personas con los <strong>números combinados</strong> del ganador ($10.000.000).
                  </li>
                  <li className="text-[11px] text-amber-200/80 pt-1 border-t border-slate-800">
                    + Estimado de <strong>$120.000.000</strong> en devoluciones del costo de las boletas para un <strong>GRAN TOTAL DE $800.000.000</strong>.
                  </li>
                </ul>
              </div>
            </div>

            {/* Cláusulas Oficiales */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>Cláusulas y Condiciones Oficiales del Plan de Premios 2027</span>
              </h3>
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-300">
                {CLAUSULAS_PLAN_2027.map((clausula, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-xl bg-slate-950/60 border border-slate-800/80 p-2.5 leading-relaxed"
                  >
                    <span className="font-mono font-black text-amber-400 shrink-0">{idx + 1}.)</span>
                    <span>{clausula}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Modal para ver la imagen del volante original del Plan de Premios 2027 */}
      {showFlyerModal && (
        <div
          onClick={() => setShowFlyerModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-black text-white">
                  Volante Oficial • Plan de Premios 2027
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFlyerModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src="/plan-premios-2027.jpg"
              alt="Plan de Premios 2027 - Rifa e Inversiones La Calidosa"
              className="w-full h-auto rounded-2xl border border-slate-800"
            />
          </div>
        </div>
      )}
    </header>
  );
};
