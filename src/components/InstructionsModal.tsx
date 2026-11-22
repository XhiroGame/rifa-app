'use client';

import React from 'react';
import { X, CheckCircle, Copy, ExternalLink, Key, Table, Mail, ShieldAlert } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const sampleEnv = `GOOGLE_SHEET_ID="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
GOOGLE_SERVICE_ACCOUNT_EMAIL="rifa-sheets-sa@mi-proyecto-12345.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_SHEET_TAB_NAME="Boletas"

NEXT_PUBLIC_RAFFLE_TITLE="Gran Rifa Pro-Fondos 2026"
NEXT_PUBLIC_RAFFLE_SUBTITLE="¡Elige tu número de la suerte del 000 al 999!"
NEXT_PUBLIC_RAFFLE_PRIZE="Primer Premio: $5,000,000 COP o iPhone 15 Pro Max"
NEXT_PUBLIC_TICKET_PRICE="$25,000 COP"
NEXT_PUBLIC_DRAW_DATE="20 de Diciembre de 2026"
NEXT_PUBLIC_LOTTERY_NAME="Lotería de Medellín (Últimas 3 cifras)"
NEXT_PUBLIC_WHATSAPP_NUMBER="573135982641"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-6 md:p-8 shadow-2xl text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30 mb-2">
            <Table className="h-3.5 w-3.5" />
            <span>Guía Paso a Paso</span>
          </div>
          <h2 className="text-2xl font-black text-white">Conexión con Google Sheets API</h2>
          <p className="text-sm text-slate-400 mt-1">
            Sigue estos 4 pasos sencillos para conectar tu hoja de cálculo y reflejar el estado en tiempo real.
          </p>
        </div>

        <div className="space-y-6 text-sm">
          {/* Paso 1 */}
          <div className="rounded-xl bg-slate-800/70 border border-slate-700/80 p-4 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs text-indigo-300">
                1
              </span>
              <h3>Crea tu hoja de cálculo en Google Sheets</h3>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm">
              Crea una nueva hoja en Google Drive llamada por ejemplo <strong className="text-white">Rifa 2026</strong>.
              Nombra la pestaña como <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300 font-mono">Boletas</code> y configura los encabezados en la primera fila:
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950/80 p-3">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-1 font-mono text-emerald-400">A (Numero)</th>
                    <th className="pb-1 font-mono text-amber-400">B (EstadoGeneral)</th>
                    <th className="pb-1 font-mono text-indigo-400">C (Nombre)</th>
                    <th className="pb-1 font-mono text-indigo-400">D (Telefono)</th>
                    <th className="pb-1 font-mono text-indigo-400">E (CuotasPagadas)</th>
                    <th className="pb-1 font-mono text-indigo-400">F (TotalAbonado)</th>
                    <th className="pb-1 font-mono text-teal-400">G-R (Mes 1 a 12)</th>
                    <th className="pb-1 font-mono text-purple-400">S (UltimaRef)</th>
                    <th className="pb-1 font-mono text-purple-400">T (DriveUrl)</th>
                    <th className="pb-1 font-mono text-amber-400">V (ClaveSeguridad / PIN)</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 font-mono">
                  <tr>
                    <td className="pt-2">000</td>
                    <td className="pt-2 text-emerald-300">Disponible</td>
                    <td className="pt-2 text-slate-500">-</td>
                    <td className="pt-2 text-slate-500">-</td>
                    <td className="pt-2">0</td>
                    <td className="pt-2">$0</td>
                    <td className="pt-2 text-slate-500">Pendiente...</td>
                    <td className="pt-2 text-slate-500">-</td>
                    <td className="pt-2 text-slate-500">-</td>
                    <td className="pt-2 text-slate-500">-</td>
                  </tr>
                  <tr>
                    <td>023</td>
                    <td className="text-teal-300">Al día</td>
                    <td>Andrés Gómez</td>
                    <td>+573001234567</td>
                    <td>3</td>
                    <td>$300.000</td>
                    <td className="text-teal-400">Pagado, Pagado, Pagado...</td>
                    <td>NEQ-8392104</td>
                    <td>https://drive...</td>
                    <td className="text-amber-300 font-bold">4829</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400">
              * Los estados generales son: <strong className="text-emerald-300">Disponible</strong>,{' '}
              <strong className="text-teal-300">Al día</strong>,{' '}
              <strong className="text-amber-300">En mora</strong>,{' '}
              <strong className="text-violet-300">En revisión</strong> y{' '}
              <strong className="text-indigo-300">Completada (12/12)</strong>.
              <br />
              * La columna <strong className="text-amber-400">V (ClaveSeguridad)</strong> almacena el PIN único de 4 dígitos de cada cliente para validar sus mensualidades y proteger su número de personas maliciosas.
            </p>
          </div>

          {/* Paso 2 */}
          <div className="rounded-xl bg-slate-800/70 border border-slate-700/80 p-4 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs text-indigo-300">
                2
              </span>
              <h3>Crea un Service Account en Google Cloud</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-300">
              <li>
                Ingresa a{' '}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 underline inline-flex items-center gap-1"
                >
                  Google Cloud Console <ExternalLink className="h-3 w-3" />
                </a>{' '}
                y crea un nuevo proyecto.
              </li>
              <li>
                Ve a <strong className="text-white">APIs & Services &gt; Library</strong> y habilita la{' '}
                <strong className="text-white">Google Sheets API</strong>.
              </li>
              <li>
                Ve a <strong className="text-white">IAM & Admin &gt; Service Accounts</strong> y haz clic en{' '}
                <strong className="text-white">Create Service Account</strong>.
              </li>
              <li>
                En la pestaña <strong className="text-white">Keys</strong> de la cuenta de servicio creada, haz clic en{' '}
                <strong className="text-white">Add Key &gt; Create new key (JSON)</strong>. Esto descargará un archivo de credenciales.
              </li>
            </ol>
          </div>

          {/* Paso 3 */}
          <div className="rounded-xl bg-slate-800/70 border border-slate-700/80 p-4 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs text-indigo-300">
                3
              </span>
              <h3>Comparte tu Google Sheet con la Cuenta de Servicio</h3>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-amber-300 text-xs">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                <strong>¡Paso Crucial!</strong> Abre tu hoja de Google Sheets, haz clic en el botón verde{' '}
                <strong>Compartir</strong> en la esquina superior derecha, y pega el correo de la cuenta de servicio (ej:{' '}
                <code>tu-servicio@...iam.gserviceaccount.com</code>) dándole permisos de <strong>Editor</strong>.
              </p>
            </div>
          </div>

          {/* Paso 4 */}
          <div className="rounded-xl bg-slate-800/70 border border-slate-700/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs text-indigo-300">
                  4
                </span>
                <h3>Configura el archivo .env.local</h3>
              </div>
              <button
                onClick={() => copyToClipboard(sampleEnv, 'env')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
              >
                {copied === 'env' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied === 'env' ? 'Copiado' : 'Copiar plantilla'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Copia el contenido en tu archivo <code className="text-white">.env.local</code> en la raíz del proyecto:
            </p>
            <pre className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
              {sampleEnv}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

