'use client';

import React, { useState } from 'react';
import { RaffleConfig } from '@/types/ticket';
import {
  Calendar,
  Trophy,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Landmark,
  Smartphone,
  ShieldCheck,
  FileText,
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
    <header className="mb-8 space-y-4">
      {/* Barra Superior de Identidad de Marca (el logo dorado sobre blanco se integra de forma 100% natural) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-5 py-3.5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-4">
          <img
            src="/logo-calidosa.png"
            alt="Rifa e Inversiones La Calidosa"
            className="h-14 sm:h-16 w-auto object-contain"
          />
          <div className="h-10 w-[1px] bg-slate-200 hidden sm:block" />
          <div>
            <p className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
              {config.title}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Plan de Premios 2027 · Responsable: <strong className="text-slate-700">Delwin Caliz</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFlyerModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-slate-600" />
            <span>Ver volante oficial</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFullPlan(!showFullPlan)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#124ec7] hover:bg-[#0f41a8] text-white px-4 py-2 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            <span>{showFullPlan ? 'Ocultar plan y cláusulas' : 'Plan de premios y cláusulas'}</span>
            {showFullPlan ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Bono Oficial Principal (Diseño tipo Boleto Editorial en 2 Columnas con línea troquelada) */}
      <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Franja superior institucional azul y oro */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#124ec7] via-[#1d63eb] to-[#d99b1e]" />

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Columna Izquierda: Gran Bolsa de Premios y Sorteos */}
          <div className="lg:col-span-8 p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-semibold text-amber-900">
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                <span>Bolsa total por $800.000.000 COP · 100% libre de impuesto</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-slate-900 leading-[1.12]">
                Premio Mayor de $200.000.000 más sorteos diarios y mensuales
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Participa con tu número de tres cifras (<span className="font-mono font-semibold text-slate-800">000</span> al{' '}
                <span className="font-mono font-semibold text-slate-800">999</span>) desde noviembre 2026 hasta octubre 2027.
              </p>
            </div>

            {/* 3 Hitos Reales del Plan 2027 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5">
                <p className="text-xs font-medium text-slate-500">Lunes a viernes</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">$1.000.000 diarios</p>
                <p className="text-[11px] text-slate-500 mt-0.5">250 anticipos · Loterías nacionales</p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5">
                <p className="text-xs font-medium text-slate-500">1er sábado de cada mes</p>
                <p className="text-base font-extrabold text-[#124ec7] mt-0.5">$10.000.000 mensuales</p>
                <p className="text-[11px] text-slate-500 mt-0.5">12 anticipos · Lotería de Boyacá</p>
              </div>

              <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 p-3.5">
                <p className="text-xs font-medium text-amber-800 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-amber-600" />
                  <span>28 de octubre de 2027</span>
                </p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">$200.000.000 Mayor</p>
                <p className="text-[11px] text-amber-900/70 mt-0.5">3 últimas cifras · Lotería de Bogotá</p>
              </div>
            </div>

            {/* Cuentas Autorizadas Copiables en una línea limpia */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2.5 text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5 mr-1">
                <Landmark className="h-4 w-4 text-[#124ec7]" />
                <span>Cuentas autorizadas (clic para copiar):</span>
              </span>

              <button
                type="button"
                onClick={() => handleCopyAccount('29700006972', 'bancolombia')}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200/70 border border-slate-200 px-3 py-1.5 text-slate-800 transition-colors cursor-pointer"
                title="Copiar cuenta de ahorros Bancolombia"
              >
                <span className="text-slate-500 font-medium">Bancolombia Ahorros:</span>
                <span className="font-mono font-bold text-slate-900">297 000069 72</span>
                {copiedAccount === 'bancolombia' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopyAccount('3135982641', 'nequi')}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 text-emerald-950 transition-colors cursor-pointer"
                title="Copiar número Nequi"
              >
                <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-800 font-medium">Nequi:</span>
                <span className="font-mono font-bold text-emerald-950">3135982641</span>
                {copiedAccount === 'nequi' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-emerald-600/70" />
                )}
              </button>
            </div>
          </div>

          {/* Columna Derecha (Talón del Bono): Valor de la Cuota y Condición Clave */}
          <div className="lg:col-span-4 ticket-perforation bg-slate-50/80 border-t lg:border-t-0 border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between gap-5">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">
                Plan de ahorro y sorteos (12 cuotas)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-700">
                  $100.000
                </span>
                <span className="text-sm font-semibold text-slate-500">COP / mes</span>
              </div>
              <p className="text-xs text-slate-600">
                Valor total de la boleta: <strong className="text-slate-900 font-mono">$1.200.000 COP</strong>
              </p>
            </div>

            <div className="space-y-2.5 rounded-xl bg-white border border-slate-200/80 p-4 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Devolución a ganadores:</strong> Si ganas un anticipo, se te devuelve lo abonado y tu boleta queda saldada.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-[#124ec7] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Paz y salvo:</strong> Abona dentro de los primeros 3 días de cada mes para participar en todos los sorteos.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Desplegable: Desglose Completo del Plan de Premios 2027 y Cláusulas */}
        {showFullPlan && (
          <div className="border-t border-slate-200 bg-slate-50/90 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Desglose Oficial · Plan de Premios 2027 ($800.000.000 COP)
                </h2>
                <p className="text-xs text-slate-600">
                  Todos los sorteos juegan con las tres (3) últimas cifras de las loterías oficiales nacionales.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% premiación libre de impuesto</span>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 1. Anticipos Diarios */}
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Anticipos Diarios
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">$250.000.000</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">250 anticipos de $1.000.000 COP</strong> de lunes a viernes hasta días festivos:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                  <li className="flex justify-between"><strong className="text-slate-900">Lunes:</strong><span>Lotería de Cundinamarca</span></li>
                  <li className="flex justify-between"><strong className="text-slate-900">Martes:</strong><span>Lotería de la Cruz Roja</span></li>
                  <li className="flex justify-between"><strong className="text-slate-900">Miércoles:</strong><span>Lotería de Manizales</span></li>
                  <li className="flex justify-between"><strong className="text-slate-900">Jueves:</strong><span>Lotería del Quindío</span></li>
                  <li className="flex justify-between"><strong className="text-slate-900">Viernes:</strong><span>Lotería de Santander</span></li>
                </ul>
              </div>

              {/* 2. Anticipos Mensuales */}
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#124ec7] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    1er Sábado del Mes
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">$228.000.000</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Con la <strong className="text-slate-900">Lotería de Boyacá</strong> (Nov–Dic 2026 y Ene–Oct 2027):
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                  <li>• <strong className="text-slate-900">12 anticipos de $10.000.000</strong> ($120.000.000).</li>
                  <li>• <strong className="text-slate-900">$1.000.000</strong> al número anterior y posterior ($24.000.000).</li>
                  <li>• <strong className="text-slate-900">$500.000</strong> a las 9 personas con las 2 últimas cifras ($54.000.000).</li>
                  <li>• <strong className="text-slate-900">$500.000</strong> a las 5 personas con números combinados ($30.000.000).</li>
                </ul>
              </div>

              {/* 3. Gran Sorteo Final */}
              <div className="rounded-xl bg-amber-50/50 border border-amber-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                    Final · 28 Oct 2027
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">$298.000.000</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Jueves 28 de octubre de 2027 con la <strong className="text-slate-900">Lotería de Bogotá</strong>:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-lg border border-amber-200/80">
                  <li>🏆 <strong className="text-slate-900">Premio Mayor: $200.000.000 COP</strong></li>
                  <li>• <strong className="text-slate-900">$20.000.000</strong> al número anterior y posterior.</li>
                  <li>• <strong className="text-slate-900">$2.000.000</strong> a las 2 últimas cifras (9 ganadores).</li>
                  <li>• <strong className="text-slate-900">$2.000.000</strong> a números combinados (5 ganadores).</li>
                  <li className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    + $120.000.000 estimados en devoluciones de boletas.
                  </li>
                </ul>
              </div>
            </div>

            {/* Cláusulas Oficiales */}
            <div className="rounded-xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-rose-600" />
                <span>Cláusulas y condiciones oficiales del Plan de Premios 2027</span>
              </h3>
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-600">
                {CLAUSULAS_PLAN_2027.map((clausula, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200/60 p-2.5 leading-relaxed"
                  >
                    <span className="font-mono font-bold text-[#124ec7] shrink-0">{idx + 1}.</span>
                    <span>{clausula}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Modal para ver la imagen del volante original */}
      {showFlyerModal && (
        <div
          onClick={() => setShowFlyerModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Volante Oficial · Plan de Premios 2027
              </h3>
              <button
                type="button"
                onClick={() => setShowFlyerModal(false)}
                className="rounded-full p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src="/plan-premios-2027.jpg"
              alt="Plan de Premios 2027 - Rifa e Inversiones La Calidosa"
              className="w-full h-auto rounded-xl border border-slate-200"
            />
          </div>
        </div>
      )}
    </header>
  );
};
