import { Ticket, TicketStatus, RaffleStats, Cuota, CuotaStatus } from '@/types/ticket';
import { ExtractedReceiptData } from './geminiReceipt';

export const MESES_NOMBRES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const CUOTA_PRECIO = 100000; // $100,000 COP por mes
export const MES_ACTUAL_RIFA = 11; // Noviembre (Mes 11 de 12)

export function create12Cuotas(cuotasPagadas: number, cuotaEnRevision?: number): Cuota[] {
  return MESES_NOMBRES.map((nombreMes, index) => {
    const mesNum = index + 1;
    let estado: CuotaStatus = 'Pendiente';
    let fechaPago: string | undefined = undefined;
    let referencia: string | undefined = undefined;

    if (mesNum <= cuotasPagadas) {
      estado = 'Pagado';
      fechaPago = `2026-${mesNum.toString().padStart(2, '0')}-05`;
      referencia = `NEQ-${mesNum}0029384`;
    } else if (cuotaEnRevision && mesNum === cuotaEnRevision) {
      estado = 'En revisión';
      fechaPago = '2026-11-15';
      referencia = 'NEQ-PENDIENTE-VERIF';
    }

    return {
      mes: mesNum,
      nombreMes,
      estado,
      monto: CUOTA_PRECIO,
      fechaPago,
      referencia,
    };
  });
}

// Generador de clave única hexadecimal de 4 cifras (0-9, A-F)
export function generateHexPin(): string {
  return Math.floor(Math.random() * 0x10000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
}

// Generador de boletas en memoria para modo demo
export function generateMockTickets(): Ticket[] {
  const tickets: Ticket[] = [];

  for (let i = 0; i < 1000; i++) {
    const numero = i.toString().padStart(3, '0');
    let estado: TicketStatus = 'Disponible';
    let nombre: string | undefined = undefined;
    let telefono: string | undefined = undefined;
    let claveSeguridad: string | undefined = undefined;
    let cuotasPagadas = 0;
    let cuotaEnRevision: number | undefined = undefined;
    let comprobanteUrl: string | undefined = undefined;
    let referencia: string | undefined = undefined;
    let notas: string | undefined = undefined;

    // PIN hexadecimal determinista para cada boleta demo ocupada
    const demoHexPin = (((i * 1337 + 0xa4f2) & 0xffff) >>> 0).toString(16).toUpperCase().padStart(4, '0');

    // Distribuir boletas con diferentes historiales de cuotas
    if (i % 7 === 0 && i % 3 === 0) {
      estado = 'Completada';
      nombre = `Carlos Restrepo ${i}`;
      telefono = '+57 300 123 4567';
      claveSeguridad = demoHexPin;
      cuotasPagadas = 12;
      notas = 'Pago total completado ($1.200.000 COP)';
    } else if (i % 17 === 0) {
      estado = 'En revisión';
      nombre = `Laura Valencia ${i}`;
      telefono = '+57 320 555 8899';
      claveSeguridad = demoHexPin;
      cuotasPagadas = 10;
      cuotaEnRevision = 11;
      comprobanteUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
      referencia = `NEQ-REV-${200000 + i}`;
      notas = 'Comprobante de cuota Mes 11 recibido - En revisión';
    } else if (i % 5 === 0) {
      estado = 'Al día';
      nombre = `Andrés Morales ${i}`;
      telefono = '+57 310 987 6543';
      claveSeguridad = demoHexPin;
      cuotasPagadas = 11;
      notas = 'Al día con las mensualidades';
    } else if (i % 11 === 0) {
      estado = 'En mora';
      nombre = `Diana Ospina ${i}`;
      telefono = '+57 315 444 7788';
      claveSeguridad = demoHexPin;
      cuotasPagadas = 8;
      notas = 'Debe 3 cuotas (Sep, Oct, Nov)';
    }

    const cuotas = create12Cuotas(cuotasPagadas, cuotaEnRevision);

    tickets.push({
      numero,
      estado,
      nombre,
      telefono,
      claveSeguridad,
      cuotasPagadas,
      totalAbonado: cuotasPagadas * CUOTA_PRECIO,
      cuotas,
      cuotaEnRevision,
      comprobanteUrl,
      referencia,
      notas,
    });
  }

  return tickets;
}

let inMemoryDemoTickets: Ticket[] | null = null;

export function getDemoTickets(): Ticket[] {
  if (!inMemoryDemoTickets) {
    inMemoryDemoTickets = generateMockTickets();
  }
  return inMemoryDemoTickets;
}

export function checkDemoDuplicateReference(referencia: string): {
  isDuplicate: boolean;
  ticketNumero?: string;
  existingName?: string;
} {
  const tickets = getDemoTickets();
  const cleanSearch = referencia.trim().toLowerCase();

  for (const t of tickets) {
    if (t.estado === 'Disponible') continue;
    if (t.referencia && t.referencia.trim().toLowerCase() === cleanSearch) {
      return { isDuplicate: true, ticketNumero: t.numero, existingName: t.nombre };
    }
    for (const c of t.cuotas) {
      if (c.referencia && c.referencia.toLowerCase() === cleanSearch) {
        return { isDuplicate: true, ticketNumero: t.numero, existingName: t.nombre };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Valida la clave única de seguridad (PIN hexadecimal de 4 cifras) de una boleta
 */
export function validateDemoTicketPin(numero: string, pin: string): { valid: boolean; message: string } {
  const tickets = getDemoTickets();
  const t = tickets.find((tk) => tk.numero === numero);

  if (!t) return { valid: false, message: 'Boleta no encontrada.' };
  if (t.estado === 'Disponible') return { valid: true, message: 'Boleta disponible.' };

  const storedPin = (t.claveSeguridad || 'A1B2').trim().toUpperCase();
  const cleanPin = pin.trim().toUpperCase();

  if (storedPin === cleanPin) {
    return { valid: true, message: 'Clave validada con éxito.' };
  }

  return { valid: false, message: 'Clave única incorrecta. Verifica tu PIN hexadecimal de 4 cifras (ej: 7A3F).' };
}

/**
 * Registra un pago de cuota mensual o apartado inicial en modo demo
 */
export function payCuotaDemo(
  numero: string,
  nombre: string,
  telefono: string,
  mesACobrar: number,
  receiptData: ExtractedReceiptData,
  driveUrl: string,
  pinIngresado?: string
): { success: boolean; message: string; ticket?: Ticket; claveAsignada?: string } {
  const tickets = getDemoTickets();
  const t = tickets.find((tk) => tk.numero === numero);

  if (!t) {
    return { success: false, message: `La boleta #${numero} no existe.` };
  }

  const cleanPin = pinIngresado ? pinIngresado.trim().toUpperCase() : '';

  // Si la boleta ya estaba apartada y se paga una cuota posterior, validar clave única hexadecimal
  if (t.estado !== 'Disponible' && mesACobrar > 1) {
    const storedPin = (t.claveSeguridad || 'A1B2').trim().toUpperCase();
    if (!cleanPin || cleanPin !== storedPin) {
      return {
        success: false,
        message: 'Clave única incorrecta. Debes ingresar el PIN hexadecimal asignado al titular de esta boleta para abonar.',
      };
    }
  }

  let claveAsignada = t.claveSeguridad;

  // Si la boleta estaba libre, asignarla al comprador y generar clave hexadecimal única
  if (t.estado === 'Disponible') {
    t.nombre = nombre;
    t.telefono = telefono;
    t.fechaInicio = new Date().toISOString().split('T')[0];
    // Asignar el PIN hexadecimal proporcionado por el usuario o generar uno de 4 cifras
    claveAsignada = /^[0-9A-F]{4}$/i.test(cleanPin) ? cleanPin : generateHexPin();
    t.claveSeguridad = claveAsignada;
  }

  t.estado = 'En revisión';
  t.cuotaEnRevision = mesACobrar;
  t.comprobanteUrl = driveUrl;
  t.referencia = receiptData.referencia;

  const cuota = t.cuotas.find((c) => c.mes === mesACobrar);
  if (cuota) {
    cuota.estado = 'En revisión';
    cuota.referencia = receiptData.referencia;
    cuota.comprobanteUrl = driveUrl;
    cuota.fechaPago = receiptData.fecha || new Date().toISOString().split('T')[0];
    cuota.banco = receiptData.banco || undefined;
  }

  t.notas = `Cuota ${mesACobrar} (${MESES_NOMBRES[mesACobrar - 1]}): Ref ${receiptData.referencia} | En revisión`;

  return {
    success: true,
    message: `¡Comprobante de la cuota ${mesACobrar} (${MESES_NOMBRES[mesACobrar - 1]}) de la boleta #${numero} registrado en revisión!`,
    ticket: t,
    claveAsignada,
  };
}

/**
 * Acción de administración sobre una cuota: Aprobar o Rechazar
 */
export function setDemoCuotaAction(
  numero: string,
  mes: number,
  action: 'approve' | 'reject',
  reason?: string
): { success: boolean; message: string; ticket?: Ticket } {
  const tickets = getDemoTickets();
  const t = tickets.find((tk) => tk.numero === numero);

  if (!t) return { success: false, message: 'Boleta no encontrada.' };

  const cuota = t.cuotas.find((c) => c.mes === mes);
  if (!cuota) return { success: false, message: `La cuota del mes ${mes} no existe.` };

  if (action === 'approve') {
    cuota.estado = 'Pagado';
    t.cuotasPagadas = Math.max(t.cuotasPagadas, mes);
    t.totalAbonado = t.cuotasPagadas * CUOTA_PRECIO;
    t.cuotaEnRevision = undefined;

    if (t.cuotasPagadas >= 12) {
      t.estado = 'Completada';
    } else if (t.cuotasPagadas >= MES_ACTUAL_RIFA) {
      t.estado = 'Al día';
    } else {
      t.estado = 'En mora';
    }

    t.notas = `Cuota ${mes} (${MESES_NOMBRES[mes - 1]}) aprobada oficialmente`;

    return {
      success: true,
      message: `¡Cuota ${mes} (${MESES_NOMBRES[mes - 1]}) de la boleta #${numero} aprobada con éxito!`,
      ticket: t,
    };
  } else {
    cuota.estado = 'Pendiente';
    cuota.comprobanteUrl = undefined;
    cuota.referencia = undefined;
    t.cuotaEnRevision = undefined;

    if (t.cuotasPagadas === 0) {
      t.estado = 'Disponible';
      t.nombre = undefined;
      t.telefono = undefined;
      t.claveSeguridad = undefined;
      t.notas = `Cuota inicial rechazada: ${reason || 'Comprobante no válido'}. Boleta liberada.`;
    } else {
      t.estado = t.cuotasPagadas >= MES_ACTUAL_RIFA ? 'Al día' : 'En mora';
      t.notas = `Cuota ${mes} rechazada: ${reason || 'Comprobante no válido'}`;
    }

    return {
      success: true,
      message: `¡Cuota ${mes} de la boleta #${numero} rechazada y devuelta a Pendiente!`,
      ticket: t,
    };
  }
}

export function calculateStats(tickets: Ticket[]): RaffleStats {
  const total = tickets.length;
  let disponibles = 0;
  let alDia = 0;
  let enMora = 0;
  let enRevision = 0;
  let completadas = 0;
  let totalRecaudado = 0;

  for (const t of tickets) {
    if (t.estado === 'Disponible') disponibles++;
    else if (t.estado === 'Al día') alDia++;
    else if (t.estado === 'En mora') enMora++;
    else if (t.estado === 'En revisión') enRevision++;
    else if (t.estado === 'Completada') completadas++;

    totalRecaudado += t.totalAbonado || 0;
  }

  const metaAnual = total * CUOTA_PRECIO * 12;
  const porcentajeRecaudado = metaAnual > 0 ? Math.round((totalRecaudado / metaAnual) * 100) : 0;

  return {
    total,
    disponibles,
    alDia,
    enMora,
    enRevision,
    completadas,
    totalRecaudado,
    porcentajeRecaudado,
  };
}
