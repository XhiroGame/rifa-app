'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RaffleConfig, Ticket } from '@/types/ticket';
import { MESES_NOMBRES, generateHexPin } from '@/lib/mockTickets';
import { getWhatsAppUrl } from '@/lib/whatsappMessages';
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
  Coins,
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
  selectedTickets?: Ticket[];
  mes: number;
  initialPin?: string;
  config: RaffleConfig;
  onClose: () => void;
  onSuccess: (ticketNumero: string, mes: number, paidNumeros?: string[]) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  ticket,
  selectedTickets,
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
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'full' | 'custom'>('full');
  const [customAmountStr, setCustomAmountStr] = useState('');

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

  useEffect(() => {
    if (isOpen && ticket) {
      setSuccessData(null);
      setFile(null);
      setPreviewUrl(null);
      setIsZoomOpen(false);
      setZoomImageUrl(null);
      setErrorMessage(null);
      setIsSubmitting(false);
      setLoadingStep('');
      setPaymentMode('full');
      setCustomAmountStr('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (ticket.estado === 'Disponible') {
        setNombre(ticket.nombre || '');
        setWhatsapp(ticket.telefono ? ticket.telefono.replace(/\D/g, '').slice(0, 10) : '');
        setPin(generateHexPin());
      } else {
        setNombre(ticket.nombre || '');
        setWhatsapp(ticket.telefono ? ticket.telefono.replace(/\D/g, '').slice(0, 10) : '');
        setPin(initialPin ? initialPin.toUpperCase() : '');
      }
    }
  }, [ticket?.numero, mes, isOpen, initialPin]);

  if (!isOpen || !ticket) return null;

  const activeTickets = selectedTickets && selectedTickets.length > 0 ? selectedTickets : [ticket];
  const isMultiPay = activeTickets.length > 1;
  const standardTotalAmount = activeTickets.length * 100000;
  const standardTotalFormatted = `$${standardTotalAmount.toLocaleString('es-CO')} COP`;
  const parsedCustomAmount = parseInt(customAmountStr.replace(/\D/g, ''), 10) || 0;
  const totalAmount = paymentMode === 'full' ? standardTotalAmount : parsedCustomAmount;
  const totalAmountFormatted = `$${(totalAmount || 0).toLocaleString('es-CO')} COP`;
  const activeNumsLabel = activeTickets.map((t) => `#${t.numero}`).join(', ');

  const nombreMes = MESES_NOMBRES[mes - 1] || `Mes ${mes}`;
  const esApartadoInicial = ticket.estado === 'Disponible' && !isMultiPay;

  const handleClose = () => {
    setIsZoomOpen(false);
    setZoomImageUrl(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validMimes.includes(selected.type)) {
      setErrorMessage('Sube un archivo de imagen JPG, PNG o WebP.');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setErrorMessage('La imagen supera el límite de 10 MB.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setErrorMessage('Completa tu nombre completo.');
      return;
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, '').trim();
    if (cleanWhatsapp.length !== 10 || !cleanWhatsapp.startsWith('3')) {
      setErrorMessage('Ingresa un número de celular válido de 10 dígitos que empiece por 3.');
      return;
    }

    const cleanPin = pin.trim().toUpperCase();
    if (!cleanPin || !/^[0-9A-F]{4}$/.test(cleanPin)) {
      setErrorMessage('Ingresa una clave hexadecimal válida de 4 cifras (0-9, A-F).');
      return;
    }
    if (paymentMode === 'custom' && parsedCustomAmount < 10000) {
      setErrorMessage('Ingresa un valor válido a abonar (mínimo $10.000 COP).');
      return;
    }
    if (!file) {
      setErrorMessage('Adjunta la imagen del comprobante de transferencia.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setLoadingStep('Verificando comprobante...');

    let stepTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      const formData = new FormData();
      formData.append('numero', ticket.numero);
      formData.append(
        'boletas',
        JSON.stringify(
          activeTickets.map((t) => ({
            numero: t.numero,
            mes: (t.cuotasPagadas || 0) < 12 ? (t.cuotasPagadas || 0) + 1 : 12,
          }))
        )
      );
      formData.append('mes', mes.toString());
      formData.append('monto', totalAmount.toString());
      formData.append('nombre', nombre.trim());
      formData.append('whatsapp', cleanWhatsapp);
      formData.append('pin', cleanPin);
      formData.append('comprobante', file);

      stepTimer = setTimeout(() => {
        setLoadingStep('Guardando comprobante y registrando cuota...');
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
        onSuccess(ticket.numero, mes, data.numeros || activeTickets.map((t) => t.numero));
      } else {
        setErrorMessage(data.message || 'No se pudo procesar el pago.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error de conexión al enviar el comprobante.');
    } finally {
      if (stepTimer) clearTimeout(stepTimer);
      setIsSubmitting(false);
      setLoadingStep('');
    }
  };

  const handleCopyPin = (code: string) => {
    navigator.clipboard.writeText(code);
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2500);
  };

  const handleCopyBank = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedBank(key);
    setTimeout(() => setCopiedBank(null), 2200);
  };

  const handleNotifyWhatsApp = () => {
    const cleanWaNum = config.whatsappNumber.replace(/\D/g, '');
    const activePin = successData?.claveAsignada || pin.toUpperCase();
    const pinStr = activePin ? `\n🔑 Clave Única (PIN Hex): ${activePin}` : '';
    const refStr = successData?.extractedData?.referencia ? `\n🔖 Referencia: ${successData.extractedData.referencia}` : '';
    const boletaStr = isMultiPay
      ? `🎟️ Boletas (${activeTickets.length}): ${activeNumsLabel}`
      : `🎟️ Boleta: #${ticket.numero}\n📅 Cuota: Mes ${mes} (${nombreMes})`;
    const msg = `¡Hola! Acabo de registrar el pago de ${isMultiPay ? `mis ${activeTickets.length} boletas seleccionadas` : 'mi cuota'} de Rifas e Inversiones La Calidosa.\n\n${boletaStr}\n💰 Valor Total: ${totalAmountFormatted}\n👤 Nombre: ${nombre.trim()}\n📱 WhatsApp: ${whatsapp.trim()}${pinStr}${refStr}\n\nQuedo atento(a) a la aprobación oficial. ¡Muchas gracias!`;
    const url = `https://wa.me/${cleanWaNum}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl text-slate-900">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {successData ? (
          <div className="text-center py-2 space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#124ec7] border border-blue-200 mb-2">
                <Clock className="h-3.5 w-3.5" />
                {isMultiPay ? `${activeTickets.length} boletas en revisión` : 'Cuota en revisión'}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">¡Comprobante registrado!</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                {isMultiPay ? (
                  <>
                    Registramos tu pago por <strong className="text-emerald-700">{totalAmountFormatted}</strong> para{' '}
                    <strong className="text-slate-900">{activeTickets.length} boletas ({activeNumsLabel})</strong>.
                  </>
                ) : (
                  <>
                    Registramos tu pago de la <strong className="text-slate-900">Cuota {mes} ({nombreMes})</strong> para la boleta{' '}
                    <strong className="text-emerald-700">#{ticket.numero}</strong>.
                  </>
                )}
              </p>
            </div>

            {successData.claveAsignada && (
              <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 text-center space-y-2.5">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900">
                  <Key className="h-4 w-4 text-amber-600" />
                  <span>Tu clave PIN de seguridad</span>
                </div>

                <div className="flex items-center justify-center gap-2.5">
                  <span className="font-mono text-3xl font-extrabold text-slate-900 tracking-widest bg-white px-4 py-1.5 rounded-xl border border-amber-300 uppercase">
                    {successData.claveAsignada}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(successData.claveAsignada!)}
                    className="p-2.5 rounded-xl bg-white hover:bg-amber-100/60 text-amber-800 border border-amber-300 transition-colors cursor-pointer"
                    title="Copiar PIN"
                  >
                    {pinCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 leading-snug max-w-xs mx-auto">
                  {pinCopied ? (
                    <strong className="text-emerald-700">Clave copiada al portapapeles</strong>
                  ) : (
                    'Guarda esta clave de 4 cifras. La usarás cada mes para consultar y abonar tus cuotas.'
                  )}
                </p>

                <div>
                  <a
                    href={getWhatsAppUrl(
                      whatsapp,
                      `🎟️ *MI COMPROBANTE - PLAN DE PREMIOS 2027*\n\nHe registrado mi comprobante de pago para la Boleta #${ticket.numero} (Cuota ${mes} - ${nombreMes}) en Rifas e Inversiones La Calidosa.\n\n🔐 *MI CLAVE ÚNICA (PIN):* *${successData.claveAsignada}*\n\n⚠️ Guarda este mensaje para tener siempre tu código a mano para las próximas cuotas mensuales.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 py-2 px-3.5 rounded-xl transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    <span>Guardar mi PIN en mi WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {successData.extractedData && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Referencia</span>
                    <span className="font-mono font-bold text-slate-900">{successData.extractedData.referencia}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Monto registrado</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {successData.extractedData.montoTotal
                        ? `$${successData.extractedData.montoTotal.toLocaleString('es-CO')} COP`
                        : totalAmountFormatted}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Fecha</span>
                    <span className="text-slate-800 font-medium">
                      {successData.extractedData.fecha} {successData.extractedData.hora || ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Entidad</span>
                    <span className="text-slate-800 font-medium">{successData.extractedData.banco || 'Transferencia'}</span>
                  </div>
                </div>

                {successData.drive?.webViewLink && (
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Imagen adjunta</span>
                    <button
                      type="button"
                      onClick={() => {
                        setZoomImageUrl(successData.drive?.webViewLink || previewUrl);
                        setIsZoomOpen(true);
                      }}
                      className="text-[#124ec7] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Ver comprobante</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleNotifyWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-4 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Enviar confirmación por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl bg-slate-100 hover:bg-slate-200/80 py-2.5 text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Volver al tablero
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="/icon-calidosa.png"
                  alt="La Calidosa"
                  className="h-6 w-6 object-contain"
                />
                <span className="text-xs font-semibold text-slate-500">
                  Rifa e Inversiones La Calidosa
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900">
                  {isMultiPay ? `${activeTickets.length} boletas seleccionadas` : `Boleta #${ticket.numero}`}
                </span>
                <span className="font-semibold text-xs bg-blue-50 text-[#124ec7] border border-blue-200 px-2.5 py-0.5 rounded-full">
                  {isMultiPay ? `${activeTickets.length} × $100.000` : `Cuota ${mes} (${nombreMes})`}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Valor a transferir:{' '}
                <strong className="text-emerald-700 font-mono text-sm">{totalAmountFormatted}</strong>
              </p>

              {isMultiPay && (
                <div className="mt-2.5 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs">
                  <span className="text-slate-500 text-[11px] block mb-1">Números incluidos:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTickets.map((t) => {
                      const tMes = (t.cuotasPagadas || 0) < 12 ? (t.cuotasPagadas || 0) + 1 : 12;
                      return (
                        <span
                          key={t.numero}
                          className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-800 border border-slate-200"
                        >
                          #{t.numero} (C{tMes})
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs font-medium text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cuentas Autorizadas */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Cuentas autorizadas para tu transferencia:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopyBank('29700006972', 'bancolombia')}
                    className="flex items-center justify-between rounded-lg bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 text-left transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] text-slate-500 block">Ahorros Bancolombia</span>
                      <span className="font-mono font-bold text-slate-900">297 000069 72</span>
                    </div>
                    {copiedBank === 'bancolombia' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyBank('3135982641', 'nequi')}
                    className="flex items-center justify-between rounded-lg bg-white hover:bg-emerald-50/50 border border-slate-200 px-3 py-2 text-left transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] text-slate-500 block">Nequi Oficial</span>
                      <span className="font-mono font-bold text-emerald-700">3135982641</span>
                    </div>
                    {copiedBank === 'nequi' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Datos de contacto */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre completo del titular <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Andrés Gómez"
                      className="w-full rounded-xl bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#124ec7]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Celular WhatsApp (10 dígitos) <span className="text-rose-600">*</span>
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        whatsapp.length === 10 && whatsapp.startsWith('3')
                          ? 'text-emerald-700 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {whatsapp.length}/10
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      pattern="3[0-9]{9}"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Ej. 3001234567"
                      className="w-full rounded-xl bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#124ec7] font-mono"
                    />
                  </div>
                </div>

                {esApartadoInicial ? (
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-amber-600" />
                        <span>Tu clave PIN de 4 cifras</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setPin(generateHexPin())}
                        className="text-[11px] font-semibold text-amber-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Cambiar</span>
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
                        placeholder="Ej. 7B2A"
                        className="w-full text-center tracking-widest font-mono text-xl font-extrabold uppercase rounded-xl bg-white border border-amber-300 px-4 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ) : initialPin ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Clave PIN verificada</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700">Autorizado</span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clave PIN de tu boleta <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type={showPin ? 'text' : 'password'}
                        required
                        maxLength={4}
                        value={pin}
                        onChange={(e) =>
                          setPin(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 4))
                        }
                        placeholder="PIN hex (ej. 7B2A)"
                        className="w-full text-center tracking-widest font-mono text-base font-bold uppercase rounded-xl bg-slate-50 pl-10 pr-10 py-2.5 text-slate-900 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#124ec7]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selector de Valor: Primera opción $100.000 COP, Segunda opción Otro valor */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Valor de este comprobante <span className="text-rose-600">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('full');
                      setErrorMessage(null);
                    }}
                    className={`flex flex-col items-start justify-center p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      paymentMode === 'full'
                        ? 'bg-white border-2 border-emerald-600 text-slate-900 shadow-2xs'
                        : 'bg-white/70 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {isMultiPay ? `Total (${activeTickets.length} boletas)` : 'Cuota completa'}
                      </span>
                      {paymentMode === 'full' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                    </div>
                    <span className="font-mono text-base font-extrabold text-slate-900 mt-0.5">
                      {standardTotalFormatted}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('custom');
                      if (!customAmountStr) setCustomAmountStr('50000');
                      setErrorMessage(null);
                    }}
                    className={`flex flex-col items-start justify-center p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      paymentMode === 'custom'
                        ? 'bg-white border-2 border-[#124ec7] text-slate-900 shadow-2xs'
                        : 'bg-white/70 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-semibold text-[#124ec7]">
                        Otro valor / Abono
                      </span>
                      {paymentMode === 'custom' && <CheckCircle2 className="h-4 w-4 text-[#124ec7] shrink-0" />}
                    </div>
                    <span className="text-xs font-medium text-slate-600 mt-0.5">
                      Ingresar otro monto
                    </span>
                  </button>
                </div>

                {paymentMode === 'custom' && (
                  <div className="pt-1 space-y-2">
                    <div className="relative">
                      <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#124ec7]" />
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={parsedCustomAmount > 0 ? parsedCustomAmount.toLocaleString('es-CO') : ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setCustomAmountStr(digits);
                        }}
                        placeholder="Ej. 50.000"
                        className="w-full rounded-xl bg-white pl-10 pr-14 py-2.5 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 border border-[#124ec7] focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">
                        COP
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[50000, 60000, 75000, 150000, 200000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCustomAmountStr(val.toString())}
                          className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-semibold border transition-colors cursor-pointer ${
                            parsedCustomAmount === val
                              ? 'bg-[#124ec7] text-white border-[#124ec7]'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          ${val.toLocaleString('es-CO')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Imagen del comprobante */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Foto o captura del comprobante ({totalAmountFormatted}) <span className="text-rose-600">*</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl && file ? (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setZoomImageUrl(previewUrl);
                          setIsZoomOpen(true);
                        }}
                        className="relative group h-12 w-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer"
                      >
                        <img src={previewUrl} alt="Comprobante" className="h-full w-full object-cover" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{file.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setZoomImageUrl(previewUrl);
                            setIsZoomOpen(true);
                          }}
                          className="text-[11px] font-semibold text-[#124ec7] hover:underline cursor-pointer"
                        >
                          Ampliar imagen
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="rounded-lg p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group cursor-pointer rounded-xl border-2 border-dashed border-slate-300 hover:border-[#124ec7] bg-slate-50/70 hover:bg-blue-50/30 p-5 text-center transition-colors"
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 group-hover:text-[#124ec7] mb-2">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      Toca aquí para adjuntar la captura por {totalAmountFormatted}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Formatos aceptados: JPG, PNG o WebP
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 py-3.5 px-4 text-sm font-semibold text-white transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{loadingStep || 'Registrando pago...'}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isMultiPay
                          ? `Registrar pago de ${activeTickets.length} boletas (${totalAmountFormatted})`
                          : `Registrar comprobante (${totalAmountFormatted})`}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ReceiptZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        imageUrl={zoomImageUrl}
        title={ticket ? `Comprobante Boleta #${ticket.numero}` : 'Comprobante de Pago'}
        details={{
          numero: ticket?.numero,
          mes,
          nombreMes: MESES_NOMBRES[mes - 1],
          nombre,
          telefono: whatsapp,
        }}
      />
    </div>
  );
};
