/**
 * Utilidades para formatear y generar enlaces de WhatsApp con mensajes pre-redactados
 */

export function cleanColombianPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('57')) return digits;
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
    prize = 'Primer Premio: Carro 0 Km o $70,000,000 COP',
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

🏆 *Gran Premio:* ${prize}
📅 *Sorteo Final:* 20 de Diciembre de 2026
🎲 *Lotería:* Lotería de Medellín (Últimas 3 cifras)

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

Queremos recordarte cordialmente que tienes pendiente tu cuota mensual de la boleta *#${numero}* (Mes ${mesActual} - ${nombreMesActual}) por valor de *$100.000 COP*.

Llevas *${cuotasPagadas}/12* cuotas canceladas. Te invitamos a ponerte al día para conservar tu número activo y participar por el *Carro 0 Km o $70,000,000 COP*. 🏆

¿Deseas realizar tu abono hoy? Quedamos atentos para registrar tu comprobante. ¡Feliz día!`;
}

