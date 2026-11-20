'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  ExternalLink,
  Move,
  User,
  Phone,
  FileText,
  CreditCard,
  Maximize2,
} from 'lucide-react';

export interface ReceiptDetails {
  numero?: string;
  mes?: number;
  nombreMes?: string;
  nombre?: string;
  telefono?: string;
  referencia?: string;
  monto?: number | string;
  banco?: string;
  fecha?: string;
}

interface ReceiptZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  details?: ReceiptDetails;
  actions?: React.ReactNode;
}

export const ReceiptZoomModal: React.FC<ReceiptZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  details,
  actions,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isImgLoading, setIsImgLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset state when opening a new receipt
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setIsDragging(false);
      setImgError(false);
      // Si la imagen ya está en caché del navegador o es un blob local, no bloquear con spinner
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        setIsImgLoading(false);
      } else {
        setIsImgLoading(true);
      }
    }
  }, [isOpen, imageUrl]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(5, Number((prev + 0.35).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(1, Number((prev - 0.35).toFixed(2)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRotate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleReset, handleRotate]);

  // Mouse wheel listener with { passive: false } to prevent default scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!isOpen || !container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setScale((prev) => {
        const next = Math.min(5, Math.max(1, Number((prev + delta).toFixed(2))));
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  // Mouse dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // solo click izquierdo
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double click toggles zoom between 1x and 2.5x
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  // Touch support (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      touchStartPosRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDistanceRef.current;
      setScale((prev) => {
        const next = Math.min(5, Math.max(1, Number((prev * factor).toFixed(2))));
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
      touchDistanceRef.current = dist;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - touchStartPosRef.current.x,
        y: e.touches[0].clientY - touchStartPosRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
    setIsDragging(false);
  };

  if (!isOpen) return null;

  const percentage = Math.round(scale * 100);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header con información de la boleta y botón de cierre */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {details?.numero && (
                <span className="font-mono text-xl sm:text-2xl font-black text-white">
                  Boleta #{details.numero}
                </span>
              )}
              {details?.mes && (
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  Cuota {details.mes} {details.nombreMes ? `(${details.nombreMes})` : ''}
                </span>
              )}
              {title && !details?.numero && (
                <h3 className="text-lg font-bold text-white truncate">{title}</h3>
              )}
            </div>

            {/* Subtítulo con datos del titular */}
            {(details?.nombre || details?.telefono) && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                {details.nombre && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-500" />
                    <strong className="text-slate-200">{details.nombre}</strong>
                  </span>
                )}
                {details.telefono && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <strong className="text-slate-200">{details.telefono}</strong>
                  </span>
                )}
                {details.referencia && (
                  <span className="inline-flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-300 border border-slate-700">
                    Ref: {details.referencia}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir imagen original en pestaña nueva"
                className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Original</span>
              </a>
            )}
            <button
              onClick={onClose}
              title="Cerrar (Esc)"
              className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Visor interactivo de Imagen con Zoom y Pan */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative flex-1 min-h-[380px] sm:min-h-[480px] max-h-[60vh] bg-slate-950 flex items-center justify-center overflow-hidden select-none ${
            scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Fondo cuadriculado para contraste */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, #475569 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {imageUrl && !imgError ? (
            <>
              {isImgLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/60 gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                  <span className="text-xs text-slate-300">Cargando comprobante...</span>
                </div>
              )}
              <div
                className="transition-transform duration-75 ease-out will-change-transform flex items-center justify-center"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Comprobante de pago"
                  draggable={false}
                  onLoad={() => setIsImgLoading(false)}
                  onError={() => {
                    setIsImgLoading(false);
                    setImgError(true);
                  }}
                  className="max-h-[55vh] max-w-full w-auto object-contain rounded-lg shadow-2xl pointer-events-none"
                />
              </div>
            </>
          ) : (
            <div className="text-center p-8 text-slate-400 text-sm space-y-2">
              <p className="font-semibold text-white">
                {imgError ? 'No se pudo cargar la imagen del comprobante' : 'Sin imagen de comprobante disponible'}
              </p>
              {imageUrl && (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Abrir enlace directo en nueva pestaña</span>
                </a>
              )}
            </div>
          )}

          {/* Barra de Controles de Zoom Flotante */}
          {imageUrl && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl">
              {/* Botón Zoom In */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 5}
                title="Acercar (+)"
                className="p-1.5 sm:p-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              {/* Indicador de Porcentaje / Reset */}
              <button
                type="button"
                onClick={handleReset}
                title="Restablecer zoom a 100% (Tecla 0)"
                className="px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-w-[50px] text-center"
              >
                {percentage}%
              </button>

              {/* Botón Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 1}
                title="Alejar (-)"
                className="p-1.5 sm:p-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

              {/* Botón Rotar */}
              <button
                type="button"
                onClick={handleRotate}
                title="Rotar 90° (Tecla R)"
                className="p-1.5 sm:p-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              {/* Botón Reset completo */}
              {(scale > 1 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={handleReset}
                  title="Restablecer vista original"
                  className="p-1.5 sm:p-2 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Tips sutiles flotantes */}
          {scale === 1 && imageUrl && (
            <div className="absolute top-3 left-3 z-10 hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 pointer-events-none">
              <Move className="h-3 w-3 text-slate-500" />
              <span>Doble clic o rueda del mouse para hacer zoom</span>
            </div>
          )}

          {scale > 1 && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-[11px] text-indigo-300 bg-indigo-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-indigo-500/30 pointer-events-none">
              <Move className="h-3 w-3 text-indigo-400 animate-pulse" />
              <span>Arrastra para mover la imagen</span>
            </div>
          )}
        </div>

        {/* Footer con Acciones (ej: Aprobar / Rechazar) */}
        {actions && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

