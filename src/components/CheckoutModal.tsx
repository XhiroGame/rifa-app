'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RaffleConfig, Ticket } from '@/types/ticket';
import { MESES_NOMBRES } from '@/lib/mockTickets';
import { ReceiptZoomModal } from '@/components/ReceiptZoomModal';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Trash2,
  Clock,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Bot,
  ExternalLink,
  Coins,
  Calendar,
  Key,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

interface ExtractedData {
  montoTotal: number | null;
  fecha: string | null;
  hora: string | null;
  referencia: string;
  banco: string | null;
  esComprobanteValido: boolean;
  confianza: string;
  detallesAdicionales?: string;
  isMock?: boolean;
}

interface DriveData {
  fileId: string;
  webViewLink: string;
  isDrive: boolean;
  fileName: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  ticket: Ticket | null;
  mes: number; // 1 a 12
  initialPin?: string;
  config: RaffleConfig;
  onClose: () => void;
  onSuccess: (ticketNumero: string, mes: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  ticket,
  mes,
  initialPin,
  config,
  onClose,
  onSuccess,
}) => {
  const [nombre, setNombre] = useState(ticket?.nombre || '');
  const [whatsapp, setWhatsapp] = useState(ticket?.telefono || '');
  const [pin, setPin] = useState(initialPin || '');
  const [showPin, setShowPin] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    extractedData?: ExtractedData;
    drive?: DriveData;
    claveAsignada?: string;
  } | null>(null);

  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiar y resetear estados cada vez que se abre el modal o cambia la boleta
  useEffect(() => {
    if (isOpen && ticket) {
      // SIEMPRE resetear el estado de éxito y archivo anterior para que no se quede pegado
      setSuccessData(null);
      setFile(null);
      setPreviewUrl(null);
      setErrorMessage(null);
      setIsSubmitting(false);
      setLoadingStep('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (ticket.estado === 'Disponible') {
        // Si la boleta es nueva/disponible, limpiar nombre o precargar si ya estaba
        setNombre(ticket.nombre || '');
        setWhatsapp(ticket.telefono ? ticket.telefono.replace(/\D/g, '').slice(0, 10) : '');
        // Generar un PIN hexadecimal aleatorio de 4 cifras para apartado inicial
        const randomHexPin = Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
        setPin(randomHexPin);
      } else {
        setNombre(ticket.nombre || '');
        setWhatsapp(ticket.telefono ? ticket.telefono.replace(/\D/g, '').slice(0, 10) : '');
        setPin(initialPin ? initialPin.toUpperCase() : '');
      }
    }
  }, [ticket?.numero, mes, isOpen, initialPin]);

  if (!isOpen || !ticket) return null;

  const nombreMes = MESES_NOMBRES[mes - 1] || `Mes ${mes}`;
  const esApartadoInicial = ticket.estado === 'Disponible';

  // Manejador centralizado de cierre para limpiar todo el estado
  const handleClose = () => {
    setSuccessData(null);
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setErrorMessage(null);
    setIsSubmitting(false);
    setLoadingStep('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  // Manejo de archivo seleccionado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validMimes.includes(selected.type)) {
      setErrorMessage('Por favor sube un archivo de imagen válido (JPG o PNG).');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setErrorMessage('La imagen es demasiado pesada. El tamaño máximo permitido es 10MB.');
      return;
    }

    setErrorMessage(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setErrorMessage('Por favor completa tu nombre completo.');
      return;
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, '').trim();
    if (cleanWhatsapp.length !== 10) {
      setErrorMessage('El número de WhatsApp debe tener exactamente 10 números (ej: 3001234567).');
      return;
    }
    if (!cleanWhatsapp.startsWith('3')) {
      setErrorMessage('El número de celular debe ser un número real que comience con 3 (ej: 3001234567).');
      return;
    }

    const cleanPin = pin.trim().toUpperCase();
    if (!cleanPin || !/^[0-9A-F]{4}$/.test(cleanPin)) {
      setErrorMessage('Debes ingresar una clave única hexadecimal válida de 4 cifras (0-9, A-F, ej: 7B2A).');
      return;
    }
    if (!file) {
      setErrorMessage('Debes adjuntar la imagen del comprobante de pago (JPG o PNG).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setLoadingStep('Analizando comprobante con Gemini AI...');

    try {
      const formData = new FormData();
      formData.append('numero', ticket.numero);
      formData.append('mes', mes.toString());
      formData.append('nombre', nombre.trim());
      formData.append('whatsapp', cleanWhatsapp);
      formData.append('pin', cleanPin);
      formData.append('comprobante', file);

      setTimeout(() => {
        setLoadingStep('Validando referencia única y subiendo a Google Drive...');
      }, 1200);

      const res = await fetch('/api/process-receipt', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setSuccessData({
          message: data.message,
          extractedData: data.extractedData,
          drive: data.drive,
          claveAsignada: data.claveAsignada || cleanPin,
        });
        onSuccess(ticket.numero, mes);
      } else {
        setErrorMessage(data.message || 'Ocurrió un error al procesar el pago.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error de conexión al enviar el comprobante.');
    } finally {
      setIsSubmitting(false);
      setLoadingStep('');
    }
  };

  // Copiar PIN al portapapeles
  const handleCopyPin = (code: string) => {
    navigator.clipboard.writeText(code);
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2500);
  };

  // Enviar mensaje de confirmación por WhatsApp
  const handleNotifyWhatsApp = () => {
    const cleanWaNum = config.whatsappNumber.replace(/\D/g, '');
    const activePin = successData?.claveAsignada || pin.toUpperCase();
    const pinStr = activePin ? `\n🔑 Clave Única (PIN Hex): ${activePin}` : '';
    const refStr = successData?.extractedData?.referencia ? `\n🔖 Referencia: ${successData.extractedData.referencia}` : '';
    const msg = `¡Hola! Acabo de registrar el pago de mi cuota de Rifas e Inversiones La Calidosa.\n\n🎟️ Boleta: #${ticket.numero}\n📅 Cuota: Mes ${mes} (${nombreMes})\n💰 Valor: $100.000 COP\n👤 Nombre: ${nombre.trim()}\n📱 WhatsApp: ${whatsapp.trim()}${pinStr}${refStr}\n\nQuedo atento(a) a la aprobación oficial. ¡Muchas gracias!`;
    const url = `https://wa.me/${cleanWaNum}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* View 1: Éxito */}
        {successData ? (
          <div className="text-center py-2 space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300 border border-violet-500/30 mb-2">
                <Clock className="h-3.5 w-3.5" /> Estado: Cuota en revisión
              </span>
              <h2 className="text-2xl font-black text-white">¡Comprobante Enviado!</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-sm mx-auto">
                Tu pago para la <strong className="text-white">Cuota {mes} ({nombreMes})</strong> de la boleta{' '}
                <strong className="text-emerald-400">#{ticket.numero}</strong> ha sido registrado en Google Sheets.
              </p>
            </div>

            {/* TARJETA DE SEGURIDAD: CLAVE ÚNICA */}
            {successData.claveAsignada && (
              <div className="rounded-2xl bg-gradient-to-b from-amber-500/15 to-amber-950/20 border-2 border-amber-500/40 p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Key className="h-4 w-4" />
                  <span>Tu Clave Única Hexadecimal</span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl sm:text-4xl font-black text-amber-300 tracking-widest bg-slate-950/70 px-4 py-1.5 rounded-xl border border-amber-500/30 uppercase">
                    {successData.claveAsignada}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(successData.claveAsignada!)}
                    className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                    title="Copiar Clave"
                  >
                    {pinCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug max-w-xs mx-auto">
                  {pinCopied ? (
                    <strong className="text-emerald-400">¡Clave copiada al portapapeles!</strong>
                  ) : (
                    'Guarda bien esta clave hexadecimal de 4 cifras. La necesitarás cada mes al pagar tu mensualidad de $100.000 COP en Rifas e Inversiones La Calidosa para proteger tu número de terceros.'
                  )}
                </p>

                <div className="pt-1">
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `🎟️ *MI COMPROBANTE - RIFA 2026*\n\nHe registrado mi comprobante de pago para la Boleta #${ticket.numero} (Cuota ${mes} - ${nombreMes}) en Rifas e Inversiones La Calidosa.\n\n🔐 *MI CLAVE ÚNICA (PIN):* *${successData.claveAsignada}*\n\n⚠️ Guarda este mensaje para tener siempre tu código a mano para las próximas cuotas mensuales.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 py-2 px-3.5 rounded-xl transition-all shadow-sm"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                    <span>Guardar mi PIN en mi WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* Extracted Data Card */}
            {successData.extractedData && (
              <div className="rounded-2xl bg-slate-950/90 border border-indigo-500/30 p-4 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <Bot className="h-4 w-4 text-indigo-400" />
                    Datos detectados por Gemini AI
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Única
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Referencia:</span>
                    <span className="font-mono font-bold text-white">{successData.extractedData.referencia}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Monto:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {successData.extractedData.montoTotal
                        ? `$${successData.extractedData.montoTotal.toLocaleString('es-CO')} COP`
                        : '$100.000 COP'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Fecha y Hora:</span>
                    <span className="text-slate-200">
                      {successData.extractedData.fecha} {successData.extractedData.hora || ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Banco / App:</span>
                    <span className="text-slate-200">{successData.extractedData.banco || 'Nequi'}</span>
                  </div>
                </div>

                {successData.drive?.webViewLink && (
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Comprobante guardado:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setZoomImageUrl(successData.drive?.webViewLink || previewUrl);
                        setIsZoomOpen(true);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Ver imagen con zoom</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleNotifyWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 px-4 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Notificar Cuota por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 py-2.5 text-sm font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cerrar y volver a la rifa
              </button>
            </div>
          </div>
        ) : (
          /* View 2: Formulario de Pago y Apartado */
          <div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-2xl font-black text-white">
                  Boleta #{ticket.numero}
                </span>
                <span className="font-semibold text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                  Cuota {mes} ({nombreMes})
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                {esApartadoInicial ? 'Apartar Boleta con Cuota 1' : `Pagar Mensualidad - ${nombreMes}`}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Valor mensualidad:{' '}
                <strong className="text-emerald-400 font-mono text-sm">$100.000 COP</strong>
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-rose-500/15 p-3.5 text-xs font-medium text-rose-300 border border-rose-500/30">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Datos de Contacto */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nombre completo del participante <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Andrés Gómez"
                      className="w-full rounded-2xl bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      WhatsApp o Celular (10 números) <span className="text-rose-400">*</span>
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        whatsapp.length === 10 && whatsapp.startsWith('3')
                          ? 'text-emerald-400 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {whatsapp.length}/10 números
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      pattern="3[0-9]{9}"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Ej: 3001234567"
                      className="w-full rounded-2xl bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Solo números reales de celular (10 dígitos iniciando en 3).
                  </p>
                </div>

                {/* CAMPO DE SEGURIDAD: CLAVE ÚNICA HEXADECIMAL (PIN) */}
                {esApartadoInicial ? (
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-amber-400" />
                        <span>Crea tu Clave Única Hexadecimal (4 cifras)</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setPin(Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0'))
                        }
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-1 cursor-pointer"
                        title="Generar otro código al azar"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Generar otro</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        required
                        maxLength={4}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        value={pin}
                        onChange={(e) =>
                          setPin(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 4))
                        }
                        placeholder="Ej: 7B2A"
                        className="w-full text-center tracking-widest font-mono text-xl font-black uppercase rounded-xl bg-slate-900 border border-amber-500/40 px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      🔒 Este código hexadecimal protegerá tu boleta todo el año. Lo necesitarás cada mes para hacer tus pagos en Rifas e Inversiones La Calidosa y evitar que personas maliciosas alteren tu número.
                    </p>
                  </div>
                ) : initialPin ? (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Clave Única Hexadecimal Validada:</span>
                      <span className="font-mono bg-emerald-500/20 px-2.5 py-0.5 rounded text-white tracking-widest uppercase">
                        ••••
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      Autorizado
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Clave Única Hexadecimal (PIN de 4 cifras asignado a tu boleta) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type={showPin ? 'text' : 'password'}
                        required
                        maxLength={4}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        value={pin}
                        onChange={(e) =>
                          setPin(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 4))
                        }
                        placeholder="Ingresa tu PIN hex (ej: 7B2A)"
                        className="w-full text-center tracking-widest font-mono text-base font-bold uppercase rounded-2xl bg-slate-800 pl-10 pr-10 py-2.5 text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Subida del Comprobante */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Comprobante de Pago de $100.000 COP (JPG o PNG) <span className="text-rose-400">*</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl && file ? (
                  <div className="relative rounded-2xl bg-slate-800/80 border border-slate-700 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setZoomImageUrl(previewUrl);
                          setIsZoomOpen(true);
                        }}
                        title="Hacer clic para ampliar con zoom"
                        className="relative group h-12 w-12 rounded-xl overflow-hidden border border-slate-700 shrink-0 cursor-pointer"
                      >
                        <img
                          src={previewUrl}
                          alt="Comprobante"
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setZoomImageUrl(previewUrl);
                              setIsZoomOpen(true);
                            }}
                            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                          >
                            Ver con zoom
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="rounded-lg p-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-800/40 hover:bg-slate-800/70 p-5 text-center transition-all"
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors mb-2">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      Sube la captura de la transferencia de $100.000 COP
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Gemini validará la fecha, hora y número de referencia
                    </p>
                  </div>
                )}
              </div>

              {/* Botón de envío */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 py-3.5 px-4 text-sm font-bold text-slate-950 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      <span>{loadingStep || 'Procesando cuota...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Comprobante de Cuota ($100.000 COP)</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal visor de zoom para el comprobante */}
      <ReceiptZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        imageUrl={zoomImageUrl}
        title={ticket ? `Comprobante Boleta #${ticket.numero}` : 'Comprobante de Pago'}
        details={{
          numero: ticket?.numero,
          mes,
          nombreMes: MESES_NOMBRES[mes - 1],
          nombre: nombre,
          telefono: whatsapp,
        }}
      />
    </div>
  );
};
