import { google } from 'googleapis';
import { Ticket, TicketStatus, RaffleStats, Cuota, CuotaStatus } from '@/types/ticket';
import {
  getDemoTickets,
  checkDemoDuplicateReference,
  payCuotaDemo,
  setDemoCuotaAction,
  validateDemoTicketPin,
  calculateStats,
  MESES_NOMBRES,
  CUOTA_PRECIO,
  MES_ACTUAL_RIFA,
  create12Cuotas,
  normalizeOwnerName,
} from './mockTickets';
import { ExtractedReceiptData } from './geminiReceipt';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;
const SHEET_TAB_NAME = process.env.GOOGLE_SHEET_TAB_NAME || 'Boletas';

export function isGoogleSheetsConfigured(): boolean {
  if (process.env.LOCAL_MODE === 'true' || process.env.FORCE_LOCAL_MODE === 'true') {
    return false;
  }
  return Boolean(SHEET_ID && CLIENT_EMAIL && PRIVATE_KEY);
}

function getGoogleSheetsClient() {
  if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Las credenciales de Google Sheets no están configuradas.');
  }

  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export function normalizeGeneralStatus(
  raw: string | undefined,
  cuotasPagadas: number,
  hasNombre = false
): TicketStatus {
  if (!raw) return hasNombre ? (cuotasPagadas >= MES_ACTUAL_RIFA ? 'Al día' : 'En mora') : 'Disponible';
  const clean = raw.trim().toLowerCase();
  if (clean === 'completada' || clean === 'completado' || cuotasPagadas >= 12) return 'Completada';
  if (clean === 'en revisión' || clean === 'en revision' || clean === 'revision') return 'En revisión';
  if (clean === 'en mora' || clean === 'mora' || clean === 'debe') return 'En mora';
  if (clean === 'al día' || clean === 'al dia') return 'Al día';
  if (clean === 'disponible' || clean === 'libre') return 'Disponible';

  if (cuotasPagadas > 0 || hasNombre) {
    return cuotasPagadas >= MES_ACTUAL_RIFA ? 'Al día' : 'En mora';
  }
  return 'Disponible';
}

/**
 * Lee los datos de la hoja de cálculo de Google Sheets con el plan de 12 cuotas anuales y claves de seguridad.
 */
export async function getTickets(): Promise<{
  tickets: Ticket[];
  isDemo: boolean;
  stats: RaffleStats;
}> {
  if (!isGoogleSheetsConfigured()) {
    const demo = getDemoTickets();
    return {
      tickets: demo,
      isDemo: true,
      stats: calculateStats(demo),
    };
  }

  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!A2:V1001`,
    });

    const rows = response.data.values || [];
    const ticketsMap = new Map<string, Ticket>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawNum = row[0]?.toString().trim() ?? '';
      const numFormatted = rawNum !== '' ? rawNum.padStart(3, '0') : i.toString().padStart(3, '0');
      const nombre = row[2]?.toString().trim() || undefined;
      const telefono = row[3]?.toString().trim() || undefined;
      const cuotasPagadasParsed = parseInt(row[4]?.toString() || '0', 10);
      const cuotasPagadasCol = isNaN(cuotasPagadasParsed) ? 0 : cuotasPagadasParsed;

      // Cuotas individuales (Columnas G a R: índice 6 a 17)
      // Priorizar 'En revisión' sobre cuotasPagadas para que la 2da+ cuota en revisión nunca quede oculta
      const cuotas: Cuota[] = MESES_NOMBRES.map((nombreMes, idx) => {
        const colVal = (row[6 + idx]?.toString() || '').trim().toLowerCase();
        let cEstado: CuotaStatus = 'Pendiente';
        if (colVal.includes('revis') || colVal.includes('comprob')) cEstado = 'En revisión';
        else if (colVal.includes('pagad') || idx + 1 <= cuotasPagadasCol) cEstado = 'Pagado';

        return {
          mes: idx + 1,
          nombreMes,
          estado: cEstado,
          monto: CUOTA_PRECIO,
        };
      });

      const pagadasPorColumnas = cuotas.filter((c) => c.estado === 'Pagado').length;
      const cuotasPagadas = Math.max(cuotasPagadasCol, pagadasPorColumnas);
      const rawTotalStr = (row[5]?.toString() || '').replace(/[^\d]/g, '');
      const parsedTotalAbonado = rawTotalStr ? parseInt(rawTotalStr, 10) : 0;
      const totalAbonado = Math.max(
        isNaN(parsedTotalAbonado) ? 0 : parsedTotalAbonado,
        cuotasPagadas * CUOTA_PRECIO
      );
      const cuotaEnRevIdx = cuotas.findIndex((c) => c.estado === 'En revisión');
      const cuotaEnRevision = cuotaEnRevIdx >= 0 ? cuotaEnRevIdx + 1 : undefined;
      const estado = cuotaEnRevision
        ? 'En revisión'
        : normalizeGeneralStatus(row[1]?.toString(), cuotasPagadas, Boolean(nombre));

      const referencia = row[18]?.toString().trim() || undefined;
      const comprobanteUrl = row[19]?.toString().trim() || undefined;
      const notas = row[20]?.toString().trim() || undefined;
      const claveSeguridad = row[21]?.toString().trim() || undefined; // Columna V: Clave única

      ticketsMap.set(numFormatted, {
        numero: numFormatted,
        estado,
        nombre,
        telefono,
        claveSeguridad,
        cuotasPagadas,
        totalAbonado,
        cuotas,
        cuotaEnRevision,
        referencia,
        comprobanteUrl,
        notas,
      });
    }

    const allTickets: Ticket[] = [];
    for (let i = 0; i < 1000; i++) {
      const numStr = i.toString().padStart(3, '0');
      const existing = ticketsMap.get(numStr);
      if (existing) {
        allTickets.push(existing);
      } else {
        allTickets.push({
          numero: numStr,
          estado: 'Disponible',
          cuotasPagadas: 0,
          totalAbonado: 0,
          cuotas: create12Cuotas(0),
        });
      }
    }

    return {
      tickets: allTickets,
      isDemo: false,
      stats: calculateStats(allTickets),
    };
  } catch (error) {
    console.error('Error al consultar Google Sheets API:', error);
    const demo = getDemoTickets();
    return {
      tickets: demo,
      isDemo: true,
      stats: calculateStats(demo),
    };
  }
}

/**
 * Valida si un número de referencia ya fue registrado en Google Sheets
 */
export async function checkDuplicateReference(referencia: string): Promise<{
  isDuplicate: boolean;
  ticketNumero?: string;
  existingName?: string;
}> {
  const cleanRef = referencia.trim().toLowerCase();
  if (!cleanRef) return { isDuplicate: false };

  if (!isGoogleSheetsConfigured()) {
    return checkDemoDuplicateReference(cleanRef);
  }

  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!A2:V1001`,
    });

    const rows = response.data.values || [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const num = (row[0]?.toString().trim() || i.toString()).padStart(3, '0');
      const nombre = row[2]?.toString().trim();
      const notas = (row[20]?.toString() || '').toLowerCase();
      const refCol = (row[18]?.toString() || '').toLowerCase();

      if (refCol && refCol.includes(cleanRef)) {
        return { isDuplicate: true, ticketNumero: num, existingName: nombre };
      }
      if (notas && notas.includes(cleanRef)) {
        return { isDuplicate: true, ticketNumero: num, existingName: nombre };
      }
    }

    return { isDuplicate: false };
  } catch (err) {
    console.error('Error al verificar duplicados en Google Sheets:', err);
    return { isDuplicate: false };
  }
}

/**
 * Valida la clave única (PIN hexadecimal) de una boleta para autorizar el pago de mensualidades
 */
export async function validateTicketPin(numero: string, pin: string): Promise<{ valid: boolean; message: string }> {
  const numInt = parseInt(numero, 10);
  if (isNaN(numInt) || numInt < 0 || numInt > 999) return { valid: false, message: 'Número inválido.' };
  const paddedNum = numInt.toString().padStart(3, '0');

  if (!isGoogleSheetsConfigured()) {
    return validateDemoTicketPin(paddedNum, pin);
  }

  try {
    const sheets = getGoogleSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!A2:V1001`,
    });

    const rows = res.data.values || [];
    const targetRow = rows[numInt] || [];
    const estado = (targetRow[1] || '').toString().trim();
    const nombreTitular = (targetRow[2] || '').toString().trim();

    if (estado.toLowerCase() === 'disponible' && !nombreTitular) {
      return { valid: true, message: 'Boleta disponible.' };
    }

    const storedPin = (targetRow[21] || 'A1B2').toString().trim().toUpperCase();
    const cleanPin = pin.trim().toUpperCase();

    if (storedPin === cleanPin) {
      return { valid: true, message: 'Clave validada con éxito.' };
    }

    // Si el titular tiene más de 1 boleta, aceptar cualquiera de las claves asignadas a sus boletas
    const ownerNorm = normalizeOwnerName(nombreTitular);
    if (ownerNorm) {
      for (const r of rows) {
        if (!r || r.length === 0) continue;
        const rName = (r[2] || '').toString().trim();
        const rPin = (r[21] || '').toString().trim().toUpperCase();
        if (rName && normalizeOwnerName(rName) === ownerNorm && rPin === cleanPin) {
          return { valid: true, message: 'Clave de titular validada con éxito.' };
        }
      }
    }

    return { valid: false, message: 'Clave única incorrecta. Verifica tu PIN hexadecimal de 4 cifras (ej: 7A3F).' };
  } catch (err) {
    console.error('Error al validar PIN en Google Sheets:', err);
    return { valid: false, message: 'Error de conexión al validar la clave.' };
  }
}

/**
 * Registra el pago de una cuota mensual con validación de clave única
 */
export async function payCuotaInGoogleSheets(
  numero: string,
  nombre: string,
  telefono: string,
  mesACobrar: number,
  receiptData: ExtractedReceiptData,
  driveUrl: string,
  pinIngresado?: string
): Promise<{ success: boolean; message: string; ticket?: Ticket; claveAsignada?: string }> {
  const numInt = parseInt(numero, 10);
  if (isNaN(numInt) || numInt < 0 || numInt > 999) {
    return { success: false, message: 'Número de boleta no válido.' };
  }

  const paddedNum = numInt.toString().padStart(3, '0');

  if (!isGoogleSheetsConfigured()) {
    return payCuotaDemo(paddedNum, nombre, telefono, mesACobrar, receiptData, driveUrl, pinIngresado);
  }

  try {
    const sheets = getGoogleSheetsClient();
    const rowIndex = numInt + 2;

    const currentRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!A${rowIndex}:V${rowIndex}`,
    });

    const row = currentRes.data.values?.[0] || [];
    const estadoActual = row[1]?.toString().trim().toLowerCase() || 'disponible';
    const cuotasPagadas = parseInt(row[4]?.toString() || '0', 10) || 0;
    const storedPin = (row[21] || 'A1B2').toString().trim().toUpperCase();
    const cleanPin = pinIngresado ? pinIngresado.trim().toUpperCase() : '';

    // Si ya está apartada y se paga una cuota posterior, validar clave única hexadecimal
    if (estadoActual !== 'disponible' && mesACobrar > 1) {
      if (!cleanPin || cleanPin !== storedPin) {
        return {
          success: false,
          message: 'Clave única incorrecta. Debes ingresar el código hexadecimal de validación asignado a este número para abonar.',
        };
      }
    }

    let claveAsignada = storedPin;

    // Si la boleta estaba libre, generar o asignar clave única hexadecimal (evitando notación científica)
    if (estadoActual === 'disponible') {
      if (/^[0-9A-F]{4}$/i.test(cleanPin) && !/^\d+E\d+$/i.test(cleanPin)) {
        claveAsignada = cleanPin;
      } else {
        while (true) {
          const candidate = Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
          if (!/^\d+E\d+$/i.test(candidate)) {
            claveAsignada = candidate;
            break;
          }
        }
      }
    }

    const colLetter = String.fromCharCode(71 + (mesACobrar - 1));
    const prevNotas = (row[20] || '').toString().trim();
    const baseReferido = prevNotas
      .split('|')
      .map((s: string) => s.trim())
      .filter((s: string) => s && !/^Cuota \d+/i.test(s))
      .join(' | ');
    const cuotaNota = `Cuota ${mesACobrar} (${MESES_NOMBRES[mesACobrar - 1]}): Ref ${receiptData.referencia} | En revisión`;
    const notas = baseReferido ? `${baseReferido} | ${cuotaNota}` : cuotaNota;

    const prevColD = (row[3] || '').toString().trim();
    const prevHasPhone = /\d{7,}/.test(prevColD);
    const finalColD = telefono
      ? prevColD && !prevHasPhone
        ? `${telefono} (${prevColD})`
        : telefono
      : prevColD;

    const prevTotalAbonado = parseInt((row[5] || '').toString().replace(/[^\d]/g, ''), 10) || 0;
    const currentTotalAbonado = Math.max(prevTotalAbonado, cuotasPagadas * CUOTA_PRECIO);

    // 1. Actualizar estado general y datos de contacto
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!A${rowIndex}:F${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            paddedNum,
            'En revisión',
            nombre || row[2] || '',
            finalColD,
            cuotasPagadas,
            currentTotalAbonado,
          ],
        ],
      },
    });

    // 2. Marcar columna del mes como 'En revisión'
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!${colLetter}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['En revisión']],
      },
    });

    // 3. Limpiar hipervínculo anterior en columna T para que Google Sheets no deje pegado el link de la cuota previa
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!T${rowIndex}`,
    });

    // 4. Guardar referencia, drive link, notas y clave única (Columnas S, T, U, V)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!S${rowIndex}:V${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[receiptData.referencia, driveUrl, notas, claveAsignada]],
      },
    });

    return {
      success: true,
      message: `¡Comprobante de la cuota ${mesACobrar} (${MESES_NOMBRES[mesACobrar - 1]}) registrado y en revisión!`,
      claveAsignada,
    };
  } catch (error) {
    console.error('Error al registrar cuota en Google Sheets:', error);
    return {
      success: false,
      message: 'Error al actualizar la cuota en Google Sheets.',
    };
  }
}

/**
 * Registra el pago de una o múltiples boletas seleccionadas por un mismo titular en una sola operación batch
 */
export async function payMultipleCuotasInGoogleSheets(
  items: Array<{ numero: string; mes: number }>,
  nombre: string,
  telefono: string,
  receiptData: ExtractedReceiptData,
  driveUrl: string,
  pinIngresado?: string
): Promise<{ success: boolean; message: string; claveAsignada?: string; numeros?: string[] }> {
  if (!items || items.length === 0) {
    return { success: false, message: 'No se seleccionaron boletas para pagar.' };
  }

  // Si es solo 1 boleta, igual podemos procesarla con el flujo batch o individual
  if (!isGoogleSheetsConfigured()) {
    let lastPin: string | undefined;
    const paidNums: string[] = [];
    for (const item of items) {
      const padded = parseInt(item.numero, 10).toString().padStart(3, '0');
      const res = payCuotaDemo(padded, nombre, telefono, item.mes, receiptData, driveUrl, pinIngresado);
      if (!res.success) return res;
      lastPin = res.claveAsignada;
      paidNums.push(padded);
    }
    return {
      success: true,
      message:
        paidNums.length > 1
          ? `¡Comprobante registrado en revisión para ${paidNums.length} boletas (${paidNums.map((n) => `#${n}`).join(', ')})!`
          : `¡Comprobante de la boleta #${paidNums[0]} registrado en revisión!`,
      claveAsignada: lastPin,
      numeros: paidNums,
    };
  }

  try {
    const sheets = getGoogleSheetsClient();
    const allRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!A2:V1001`,
    });

    const rows = allRes.data.values || [];
    const cleanPin = pinIngresado ? pinIngresado.trim().toUpperCase() : '';

    // Reunir todas las claves válidas del titular (por si tiene múltiples boletas)
    const validOwnerPins = new Set<string>();
    for (const item of items) {
      const idx = parseInt(item.numero, 10);
      if (isNaN(idx) || idx < 0 || idx > 999) continue;
      const r = rows[idx] || [];
      const rName = (r[2] || '').toString().trim();
      const rPin = (r[21] || '').toString().trim().toUpperCase();
      if (rPin) validOwnerPins.add(rPin);
      if (rName) {
        const norm = normalizeOwnerName(rName);
        for (const other of rows) {
          if (!other || other.length === 0) continue;
          if (normalizeOwnerName((other[2] || '').toString()) === norm) {
            const oPin = (other[21] || '').toString().trim().toUpperCase();
            if (oPin) validOwnerPins.add(oPin);
          }
        }
      }
    }

    const normalizedItems = items.map((it) => ({
      numInt: parseInt(it.numero, 10),
      paddedNum: parseInt(it.numero, 10).toString().padStart(3, '0'),
      mes: Math.min(12, Math.max(1, it.mes || 1)),
    }));

    for (const it of normalizedItems) {
      if (isNaN(it.numInt) || it.numInt < 0 || it.numInt > 999) {
        return { success: false, message: `Número de boleta inválido: ${it.paddedNum}` };
      }
      const row = rows[it.numInt] || [];
      const estadoActual = (row[1] || 'disponible').toString().trim().toLowerCase();
      const rowName = (row[2] || '').toString().trim();
      const isOccupied = estadoActual !== 'disponible' || Boolean(rowName);

      if (isOccupied) {
        if (!cleanPin || !validOwnerPins.has(cleanPin)) {
          return {
            success: false,
            message: `Clave única incorrecta para la boleta #${it.paddedNum}. Ingresa tu código hexadecimal de 4 cifras.`,
          };
        }
      }
    }

    const groupTag =
      normalizedItems.length > 1
        ? ` [Pago grupal ${normalizedItems.length} boletas: ${normalizedItems.map((i) => `#${i.paddedNum}`).join(', ')}]`
        : '';

    const clearRanges: string[] = [];
    const valueUpdates: Array<{ range: string; values: any[][] }> = [];
    let claveAsignada = cleanPin;

    for (const it of normalizedItems) {
      const rowIndex = it.numInt + 2;
      const row = rows[it.numInt] || [];
      const estadoActual = (row[1] || 'disponible').toString().trim().toLowerCase();
      const rowName = (row[2] || '').toString().trim();
      const cuotasPagadas = parseInt((row[4] || '0').toString(), 10) || 0;
      const storedPin = (row[21] || '').toString().trim().toUpperCase();

      let pinToSave = storedPin || cleanPin;
      if (estadoActual === 'disponible' && !rowName) {
        if (/^[0-9A-F]{4}$/i.test(cleanPin) && !/^\d+E\d+$/i.test(cleanPin)) {
          pinToSave = cleanPin;
        } else {
          while (true) {
            const candidate = Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
            if (!/^\d+E\d+$/i.test(candidate)) {
              pinToSave = candidate;
              break;
            }
          }
        }
      }
      claveAsignada = pinToSave;

      const colLetter = String.fromCharCode(71 + (it.mes - 1));
      const prevNotas = (row[20] || '').toString().trim();
      const baseReferido = prevNotas
        .split('|')
        .map((s: string) => s.trim())
        .filter((s: string) => s && !/^Cuota \d+/i.test(s) && !/^En revisión$/i.test(s) && !/^Aprobada$/i.test(s))
        .join(' | ');
      const montoTotalComprobante = receiptData.montoTotal || normalizedItems.length * CUOTA_PRECIO;
      const montoPorBoleta = Math.round(montoTotalComprobante / normalizedItems.length);
      const montoTag =
        montoPorBoleta !== CUOTA_PRECIO
          ? ` [Abono $${montoPorBoleta.toLocaleString('es-CO')}]`
          : '';
      const newResTag = estadoActual === 'disponible' && !rowName ? ' [Apartado Web]' : '';
      const cuotaNota = `Cuota ${it.mes} (${MESES_NOMBRES[it.mes - 1]}): Ref ${receiptData.referencia}${montoTag}${groupTag}${newResTag} | En revisión`;
      const notas = baseReferido ? `${baseReferido} | ${cuotaNota}` : cuotaNota;

      const prevColD = (row[3] || '').toString().trim();
      const prevHasPhone = /\d{7,}/.test(prevColD);
      const finalColD = telefono
        ? prevColD && !prevHasPhone
          ? `${telefono} (${prevColD})`
          : telefono
        : prevColD;

      const prevTotalAbonado = parseInt((row[5] || '').toString().replace(/[^\d]/g, ''), 10) || 0;
      const currentTotalAbonado = Math.max(prevTotalAbonado, cuotasPagadas * CUOTA_PRECIO);

      clearRanges.push(`'${SHEET_TAB_NAME}'!T${rowIndex}`);

      valueUpdates.push({
        range: `'${SHEET_TAB_NAME}'!A${rowIndex}:F${rowIndex}`,
        values: [
          [
            it.paddedNum,
            'En revisión',
            rowName || nombre || '',
            finalColD,
            cuotasPagadas,
            currentTotalAbonado,
          ],
        ],
      });

      valueUpdates.push({
        range: `'${SHEET_TAB_NAME}'!${colLetter}${rowIndex}`,
        values: [['En revisión']],
      });

      valueUpdates.push({
        range: `'${SHEET_TAB_NAME}'!S${rowIndex}:V${rowIndex}`,
        values: [[receiptData.referencia, driveUrl, notas, pinToSave]],
      });
    }

    await sheets.spreadsheets.values.batchClear({
      spreadsheetId: SHEET_ID,
      requestBody: { ranges: clearRanges },
    });

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: valueUpdates,
      },
    });

    const paidNums = normalizedItems.map((i) => i.paddedNum);

    return {
      success: true,
      message:
        paidNums.length > 1
          ? `¡Comprobante registrado en revisión para ${paidNums.length} boletas (${paidNums.map((n) => `#${n}`).join(', ')})!`
          : `¡Comprobante de la cuota ${normalizedItems[0].mes} (${MESES_NOMBRES[normalizedItems[0].mes - 1]}) registrado y en revisión!`,
      claveAsignada,
      numeros: paidNums,
    };
  } catch (error) {
    console.error('Error al registrar múltiples cuotas en Google Sheets:', error);
    return {
      success: false,
      message: 'Error al actualizar las boletas seleccionadas en Google Sheets.',
    };
  }
}

/**
 * Acción de administrador para aprobar o rechazar una cuota mensual
 */
export async function setCuotaAdminAction(
  numero: string,
  mes: number,
  action: 'approve' | 'reject',
  reason?: string
): Promise<{
  success: boolean;
  message: string;
  ticket?: Partial<Ticket>;
}> {
  const numInt = parseInt(numero, 10);
  if (isNaN(numInt)) return { success: false, message: 'Número inválido.' };
  const paddedNum = numInt.toString().padStart(3, '0');

  if (!isGoogleSheetsConfigured()) {
    const res = setDemoCuotaAction(paddedNum, mes, action, reason);
    return { success: res.success, message: res.message, ticket: res.ticket };
  }

  try {
    const sheets = getGoogleSheetsClient();
    const rowIndex = numInt + 2;

    const currentRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!A${rowIndex}:V${rowIndex}`,
    });

    const row = currentRes.data.values?.[0] || [];
    let cuotasPagadas = parseInt(row[4]?.toString() || '0', 10) || 0;
    const colLetter = String.fromCharCode(71 + (mes - 1));

    if (action === 'approve') {
      const notaActual = (row[20] || '').toString();
      const prevTotalAbonado = parseInt((row[5] || '').toString().replace(/[^\d]/g, ''), 10) || 0;
      const abonoMatch = notaActual.match(/\[Abono \$([\d.,]+)\]/i);
      const abonoParcialMonto = abonoMatch
        ? parseInt(abonoMatch[1].replace(/\D/g, ''), 10) || CUOTA_PRECIO
        : CUOTA_PRECIO;

      let totalAbonado = prevTotalAbonado + abonoParcialMonto;
      let nuevoEstadoMes = 'Pagado';

      if (abonoMatch && totalAbonado < mes * CUOTA_PRECIO) {
        // Es un abono parcial que aún no completa los $100.000 de esta cuota
        nuevoEstadoMes = 'Pendiente';
        cuotasPagadas = Math.floor(totalAbonado / CUOTA_PRECIO);
      } else {
        cuotasPagadas = Math.max(cuotasPagadas, mes, Math.floor(totalAbonado / CUOTA_PRECIO));
        totalAbonado = Math.max(totalAbonado, cuotasPagadas * CUOTA_PRECIO);
        nuevoEstadoMes = 'Pagado';
      }

      const nuevoEstado =
        cuotasPagadas >= 12 ? 'Completada' : cuotasPagadas >= MES_ACTUAL_RIFA ? 'Al día' : 'En mora';

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'${SHEET_TAB_NAME}'!${colLetter}${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[nuevoEstadoMes]] },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'${SHEET_TAB_NAME}'!B${rowIndex}:F${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[nuevoEstado, row[2] || '', row[3] || '', cuotasPagadas, totalAbonado]],
        },
      });

      // Actualizar columna Notas (U) para reflejar que la cuota o abono parcial ya fue aprobado
      const cleanNotaActual = notaActual.replace(/\s*\[Apartado Web\]/gi, '');
      const notaAprobada = cleanNotaActual.includes('En revisión')
        ? cleanNotaActual.replace(
            /En revisión/gi,
            nuevoEstadoMes === 'Pagado'
              ? 'Aprobada'
              : `Abono aprobado (Total: $${totalAbonado.toLocaleString('es-CO')})`
          )
        : `Cuota ${mes} (${MESES_NOMBRES[mes - 1]}): Aprobada`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'${SHEET_TAB_NAME}'!U${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[notaAprobada]],
        },
      });

      const pin = (row[21] || '').toString().trim();

      return {
        success: true,
        message: `¡Cuota ${mes} (${MESES_NOMBRES[mes - 1]}) aprobada oficialmente en Google Sheets!`,
        ticket: {
          numero: paddedNum,
          nombre: row[2] || '',
          telefono: row[3] || '',
          cuotasPagadas,
          claveSeguridad: pin,
        },
      };
    } else {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'${SHEET_TAB_NAME}'!${colLetter}${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['Pendiente']] },
      });

      const notaActual = (row[20] || '').toString();
      const esApartadoWebNuevo = notaActual.includes('[Apartado Web]');
      const prevTotalAbonado = parseInt((row[5] || '').toString().replace(/[^\d]/g, ''), 10) || 0;

      if (cuotasPagadas === 0 && esApartadoWebNuevo && prevTotalAbonado === 0) {
        // Solo liberar la boleta a Disponible si era un apartado web nuevo que fue rechazado en su primera cuota
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `'${SHEET_TAB_NAME}'!B${rowIndex}:D${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['Disponible', '', '']] },
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `'${SHEET_TAB_NAME}'!S${rowIndex}:U${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['', '', '']] },
        });
      } else {
        // Si el cliente ya era titular de la boleta en la base de datos, conservar sus datos y dejar en En mora o Al día
        const nuevoEstado = cuotasPagadas >= MES_ACTUAL_RIFA ? 'Al día' : 'En mora';
        const baseReferido = notaActual
          .split('|')
          .map((s: string) => s.trim())
          .filter((s: string) => s && !/^Cuota \d+/i.test(s) && !/^En revisión$/i.test(s))
          .join(' | ');
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `'${SHEET_TAB_NAME}'!B${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[nuevoEstado]] },
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `'${SHEET_TAB_NAME}'!U${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[baseReferido]] },
        });
      }

      return {
        success: true,
        message: `¡Cuota ${mes} de la boleta #${paddedNum} rechazada en Google Sheets!`,
      };
    }
  } catch (err) {
    console.error('Error al actualizar cuota en Google Sheets:', err);
    return { success: false, message: 'Error al actualizar cuota en Google Sheets.' };
  }
}

/**
 * Apartado rápido de boleta con la cuota inicial (Mes 1)
 */
export async function reserveTicket(
  numero: string,
  nombre: string,
  telefono: string
): Promise<{ success: boolean; message: string }> {
  const dummyReceipt: ExtractedReceiptData = {
    montoTotal: CUOTA_PRECIO,
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0],
    referencia: `RES-${Date.now().toString().slice(-6)}`,
    banco: 'N/A',
    esComprobanteValido: true,
    confianza: 'media',
  };
  return payCuotaInGoogleSheets(numero, nombre, telefono, 1, dummyReceipt, '');
}
