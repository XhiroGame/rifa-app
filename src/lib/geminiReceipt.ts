import { GoogleGenAI } from '@google/genai';

export interface ExtractedReceiptData {
  montoTotal: number | null;
  fecha: string | null;
  hora: string | null;
  referencia: string;
  banco: string | null;
  esComprobanteValido: boolean;
  confianza: 'alta' | 'media' | 'baja';
  detallesAdicionales?: string;
  isMock?: boolean;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export function isGeminiConfigured(): boolean {
  if (process.env.LOCAL_MODE === 'true' || process.env.FORCE_LOCAL_MODE === 'true') {
    return false;
  }
  return Boolean(GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '');
}

/**
 * Usa la API de Gemini (visión multimodal) para analizar la imagen del comprobante
 * y extraer en formato JSON estricto: monto, fecha, hora y número de referencia.
 */
export async function extractReceiptDataWithGemini(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<ExtractedReceiptData> {
  // Si no hay API Key configurada, operamos en modo fallback / demo para no romper la app
  if (!isGeminiConfigured()) {
    console.warn('⚠️ GEMINI_API_KEY no configurada. Generando extracción simulada para modo de prueba.');
    const now = new Date();
    const mockRef = `DEMO-${Math.floor(10000000 + Math.random() * 90000000)}`;
    return {
      montoTotal: 50000,
      fecha: now.toISOString().split('T')[0],
      hora: now.toTimeString().split(' ')[0],
      referencia: mockRef,
      banco: 'Nequi / Daviplata (Simulado)',
      esComprobanteValido: true,
      confianza: 'media',
      detallesAdicionales: 'Extracción simulada (Configura GEMINI_API_KEY en .env.local para análisis con IA real)',
      isMock: true,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const base64Data = imageBuffer.toString('base64');

    const prompt = `
Analiza exhaustivamente esta imagen de un comprobante de pago o transferencia bancaria (ej: Nequi, Daviplata, Bancolombia, BBVA, Mercado Pago, etc.).
Debes extraer con total precisión los datos clave de la transacción en formato JSON estricto:

{
  "montoTotal": <número con el valor total pagado o transferido, sin puntos ni signos de moneda, ej: 25000 o 50000. Si no está legible, null>,
  "fecha": <fecha de la transacción en formato YYYY-MM-DD, ej: "2026-11-15". Si no está legible, null>,
  "hora": <hora de la transacción en formato HH:MM o HH:MM:SS, ej: "14:32:05". Si no está legible, null>,
  "referencia": <código o número de comprobante, aprobación, ID de transacción, autorización o referencia única. Es VITAL que sea exacto para evitar duplicados. Si hay varios, elige el código principal, ej: "M12345678" o "87291032">,
  "banco": <nombre de la entidad financiera o app, ej: "Nequi", "Bancolombia", "Daviplata", "Mercado Pago", etc.>,
  "esComprobanteValido": <true si la imagen parece ser un comprobante de pago real, false si es una foto de otra cosa o ilegible>,
  "confianza": <"alta" | "media" | "baja">,
  "detallesAdicionales": <breve resumen de la cuenta destino o titular si aparece>
}

Responde ÚNICAMENTE con el objeto JSON válido, sin bloques de markdown extra ni explicaciones.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      montoTotal: typeof parsed.montoTotal === 'number' ? parsed.montoTotal : (parsed.montoTotal ? parseFloat(parsed.montoTotal) : null),
      fecha: parsed.fecha || new Date().toISOString().split('T')[0],
      hora: parsed.hora || new Date().toTimeString().split(' ')[0],
      referencia: parsed.referencia ? String(parsed.referencia).trim() : `GEN-${Date.now().toString().slice(-8)}`,
      banco: parsed.banco || 'Desconocido',
      esComprobanteValido: Boolean(parsed.esComprobanteValido ?? true),
      confianza: parsed.confianza || 'alta',
      detallesAdicionales: parsed.detallesAdicionales || undefined,
      isMock: false,
    };
  } catch (error) {
    console.error('Error al analizar comprobante con Gemini API:', error);
    throw new Error('No se pudo procesar la imagen con Gemini API. Verifica que la imagen sea nítida y tu API Key válida.');
  }
}

