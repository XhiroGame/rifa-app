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

export function normalizeGeneralStatus(raw: string | undefined, cuotasPagadas: number): TicketStatus {
  if (!raw) return 'Disponible';
  const clean = raw.trim().toLowerCase();
  if (clean === 'completada' || clean === 'completado' || cuotasPagadas >= 12) return 'Completada';
  if (clean === 'en revisión' || clean === 'en revision' || clean === 'revision') return 'En revisión';
  if (clean === 'en mora' || clean === 'mora' || clean === 'debe') return 'En mora';
  if (clean === 'al día' || clean === 'al dia') return 'Al día';
  if (clean === 'disponible' || clean === 'libre') return 'Disponible';

  if (cuotasPagadas > 0) {
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
      const cuotasPagadas = isNaN(cuotasPagadasParsed) ? 0 : cuotasPagadasParsed;
      const totalAbonado = cuotasPagadas * CUOTA_PRECIO;
      const estado = normalizeGeneralStatus(row[1]?.toString(), cuotasPagadas);

      // Cuotas individuales (Columnas G a R: índice 6 a 17)
      const cuotas: Cuota[] = MESES_NOMBRES.map((nombreMes, idx) => {
        const colVal = (row[6 + idx]?.toString() || '').trim().toLowerCase();
        let cEstado: CuotaStatus = 'Pendiente';
        if (colVal.includes('pagad') || idx + 1 <= cuotasPagadas) cEstado = 'Pagado';
        else if (colVal.includes('revis') || colVal.includes('comprob')) cEstado = 'En revisión';

        return {
          mes: idx + 1,
          nombreMes,
          estado: cEstado,
          monto: CUOTA_PRECIO,
        };
      });

      const cuotaEnRevIdx = cuotas.findIndex((c) => c.estado === 'En revisión');
      const cuotaEnRevision = cuotaEnRevIdx >= 0 ? cuotaEnRevIdx + 1 : undefined;

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
  if (isNaN(numInt)) return { valid: false, message: 'Número inválido.' };
  const paddedNum = numInt.toString().padStart(3, '0');

  if (!isGoogleSheetsConfigured()) {
    return validateDemoTicketPin(paddedNum, pin);
  }

  try {
    const sheets = getGoogleSheetsClient();
    const rowIndex = numInt + 2;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB_NAME}'!B${rowIndex}:V${rowIndex}`,
    });

    const row = res.data.values?.[0] || [];
    const estado = row[0]?.toString().trim() || '';
    if (estado.toLowerCase() === 'disponible') {
      return { valid: true, message: 'Boleta disponible.' };
    }

    // Columna V es índice 20 relativo a B
    const storedPin = (row[20] || 'A1B2').toString().trim().toUpperCase();
    const cleanPin = pin.trim().toUpperCase();

    if (storedPin === cleanPin) {
      return { valid: true, message: 'Clave validada con éxito.' };
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

    // Si la boleta estaba libre, generar o asignar clave única hexadecimal
    if (estadoActual === 'disponible') {
      claveAsignada = /^[0-9A-F]{4}$/i.test(cleanPin)
        ? cleanPin
        : Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
    }

    const colLetter = String.fromCharCode(71 + (mesACobrar - 1));
    const notas = `Cuota ${mesACobrar} (${MESES_NOMBRES[mesACobrar - 1]}): Ref ${receiptData.referencia} | En revisión`;

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
            telefono || row[3] || '',
            cuotasPagadas,
            cuotasPagadas * CUOTA_PRECIO,
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

    // 3. Guardar referencia, drive link, notas y clave única (Columnas S, T, U, V)
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
      cuotasPagadas = Math.max(cuotasPagadas, mes);
      const totalAbonado = cuotasPagadas * CUOTA_PRECIO;
      const nuevoEstado = cuotasPagadas >= 12 ? 'Completada' : cuotasPagadas >= MES_ACTUAL_RIFA ? 'Al día' : 'En mora';

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'${SHEET_TAB_NAME}'!${colLetter}${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['Pagado']] },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'${SHEET_TAB_NAME}'!B${rowIndex}:F${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[nuevoEstado, row[2] || '', row[3] || '', cuotasPagadas, totalAbonado]],
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

      if (cuotasPagadas === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `'${SHEET_TAB_NAME}'!B${rowIndex}:D${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['Disponible', '', '']] },
        });
        // Limpiar clave
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `'${SHEET_TAB_NAME}'!V${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['']] },
        });
      } else {
        const nuevoEstado = cuotasPagadas >= MES_ACTUAL_RIFA ? 'Al día' : 'En mora';
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `'${SHEET_TAB_NAME}'!B${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[nuevoEstado]] },
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
