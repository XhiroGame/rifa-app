/**
 * Utilidades para formatear y generar enlaces de WhatsApp con mensajes pre-redactados
 */

export function cleanColombianPhone(phone: string): string {
  const raw = (phone || '').toString();
  // Buscar primero un número móvil colombiano de 10 dígitos (3XXXXXXXXX) o con código de país (573XXXXXXXXX)
  const mobileMatch = raw.match(/(?:57)?(3\d{9})/);
  if (mobileMatch) {
    return `57${mobileMatch[1]}`;
  }
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('57') && digits.length >= 12) return digits.slice(0, 12);
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = cleanColombianPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export interface ApprovalMessageParams {
  nombre?: string;
  numero: string;
  mes: number;
  nombreMes: string;
  cuotasPagadas: number;
  claveSeguridad?: string;
  raffleTitle?: string;
  ticketPrice?: string;
  prize?: string;
}

export function buildApprovalWhatsAppMessage(params: ApprovalMessageParams): string {
  const {
    nombre = 'Apreciado(a) Participante',
    numero,
    mes,
    nombreMes,
    cuotasPagadas,
    claveSeguridad = 'N/A',
    raffleTitle = 'Rifas e Inversiones La Calidosa',
    ticketPrice = '$100.000 COP',
    prize = 'Plan de Premios 2027 por $800.000.000 COP (Premio Mayor: $200.000.000 COP)',
  } = params;

  return `🎉 *¡PAGO APROBADO EXITOSAMENTE!* 🎉
*${raffleTitle}*

Hola *${nombre}*, te confirmamos que tu pago ha sido verificado y aprobado oficialmente en nuestro sistema.

━━━━━━━━━━━━━━━━━━━━
🎟️ *Boleta:* #${numero}
📅 *Cuota Aprobada:* Mes ${mes} (${nombreMes})
💵 *Valor Cancelado:* ${ticketPrice}
📊 *Progreso:* ${cuotasPagadas}/12 Cuotas Pagadas
━━━━━━━━━━━━━━━━━━━━

🔐 *TU CÓDIGO ÚNICO (PIN DE SEGURIDAD):*
👉 *${claveSeguridad}* 👈

⚠️ _*IMPORTANTE:* Guarda este código PIN en este chat. Lo necesitarás cada mes al pagar tu mensualidad de $100.000 COP para autorizar tu abono y proteger tu boleta de terceros._

🏆 *Premios:* ${prize}
📅 *Sorteos:* Diarios Lun-Vie ($1M), 1er Sábado de cada mes ($10M con Boyacá) y Sorteo Mayor el 28 de Octubre de 2027 (Lotería de Bogotá - 3 últimas cifras)
🏦 *Cuentas Autorizadas:* Bancolombia Ahorros 297 000069 72 | Nequi 3135982641

¡Muchas gracias por tu puntualidad y te deseamos la mejor de las suertes! 🍀`;
}

export function buildOverdueWhatsAppMessage(params: {
  nombre?: string;
  numero: string;
  cuotasPagadas: number;
  mesActual: number;
  nombreMesActual: string;
  raffleTitle?: string;
}): string {
  const {
    nombre = 'Participante',
    numero,
    cuotasPagadas,
    mesActual,
    nombreMesActual,
    raffleTitle = 'Rifas e Inversiones La Calidosa',
  } = params;

  return `Hola *${nombre}*, te escribimos de *${raffleTitle}*.

Queremos recordarte cordialmente que tienes pendiente tu cuota mensual de la boleta *#${numero}* (Cuota ${mesActual} - ${nombreMesActual}) por valor de *$100.000 COP*.

Llevas *${cuotasPagadas}/12* cuotas canceladas. Te invitamos a ponerte al día para mantener tu número activo en todos los sorteos del *Plan de Premios 2027 ($800.000.000 en premios / Mayor de $200.000.000 COP)*. 🏆

🏦 *Cuentas Autorizadas:*
• Ahorros Bancolombia: *297 000069 72*
• Nequi: *3135982641*

¿Deseas realizar tu abono hoy? Quedamos atentos para registrar tu comprobante. ¡Feliz día!`;
}

