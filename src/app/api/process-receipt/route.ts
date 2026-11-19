import { NextResponse } from 'next/server';
import { extractReceiptDataWithGemini } from '@/lib/geminiReceipt';
import { uploadReceiptToGoogleDrive } from '@/lib/googleDrive';
import { checkDuplicateReference, payCuotaInGoogleSheets } from '@/lib/googleSheets';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const numeroRaw = (formData.get('numero') || formData.get('boletas')) as string | null;
    const mesRaw = formData.get('mes') as string | null;
    const nombre = (formData.get('nombre') as string | null)?.trim();
    const whatsapp = (formData.get('whatsapp') as string | null)?.trim();
    const pin = (formData.get('pin') as string | null)?.trim().toUpperCase();
    const file = formData.get('comprobante') as File | null;

    if (!numeroRaw) {
      return NextResponse.json(
        { success: false, message: 'Debes indicar el número de boleta a pagar o apartar.' },
        { status: 400 }
      );
    }

    if (!nombre) {
      return NextResponse.json(
        { success: false, message: 'El nombre del participante es obligatorio.' },
        { status: 400 }
      );
    }

    const cleanWhatsapp = (whatsapp || '').replace(/\D/g, '').trim();
    if (cleanWhatsapp.length !== 10 || !cleanWhatsapp.startsWith('3')) {
      return NextResponse.json(
        {
          success: false,
          message: 'El número de WhatsApp debe ser un número real de celular de 10 dígitos (ej: 3001234567).',
        },
        { status: 400 }
      );
    }

    if (!file || typeof file !== 'object' || file.size === 0) {
      return NextResponse.json(
        { success: false, message: 'Debes adjuntar la imagen del comprobante de pago (JPG o PNG).' },
        { status: 400 }
      );
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Formato de imagen inválido. Solo se admiten archivos JPG o PNG.' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'La imagen excede el tamaño máximo permitido de 10MB.' },
        { status: 400 }
      );
    }

    // Normalizar número de boleta (ej: "023")
    let numero = numeroRaw.trim();
    if (numero.startsWith('[') && numero.endsWith(']')) {
      try {
        const parsed = JSON.parse(numero);
        numero = parsed[0] || '000';
      } catch {}
    }
    const cleanNum = parseInt(numero, 10).toString().padStart(3, '0');
    const mes = mesRaw ? Math.min(12, Math.max(1, parseInt(mesRaw, 10) || 1)) : 1;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Extracción de datos con Gemini AI
    let extractedData;
    try {
      extractedData = await extractReceiptDataWithGemini(buffer, file.type);
    } catch (aiErr: any) {
      console.error('Error al invocar Gemini API:', aiErr);
      return NextResponse.json(
        {
          success: false,
          message: aiErr.message || 'Error al procesar la imagen del comprobante con Gemini.',
        },
        { status: 500 }
      );
    }

    // 2. Validación de referencia duplicada en Google Sheets
    if (extractedData.referencia) {
      const duplicateCheck = await checkDuplicateReference(extractedData.referencia);
      if (duplicateCheck.isDuplicate) {
        return NextResponse.json(
          {
            success: false,
            error: 'DUPLICATE_REFERENCE',
            message: `⚠️ Comprobante duplicado: El número de referencia "${extractedData.referencia}" ya fue registrado previamente en la boleta #${duplicateCheck.ticketNumero || ''}.`,
            extractedData,
          },
          { status: 409 }
        );
      }
    }

    // 3. Subida del comprobante a Google Drive
    const driveResult = await uploadReceiptToGoogleDrive(buffer, file.name, file.type, [cleanNum]);

    // 4. Registro de la cuota en Google Sheets
    const saveResult = await payCuotaInGoogleSheets(
      cleanNum,
      nombre,
      cleanWhatsapp,
      mes,
      extractedData,
      driveResult.webViewLink,
      pin || undefined
    );

    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, message: saveResult.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: saveResult.message,
      numero: cleanNum,
      mes,
      claveAsignada: saveResult.claveAsignada,
      extractedData: {
        montoTotal: extractedData.montoTotal,
        fecha: extractedData.fecha,
        hora: extractedData.hora,
        referencia: extractedData.referencia,
        banco: extractedData.banco,
        esComprobanteValido: extractedData.esComprobanteValido,
        confianza: extractedData.confianza,
        detallesAdicionales: extractedData.detallesAdicionales,
        isMock: extractedData.isMock,
      },
      drive: {
        fileId: driveResult.fileId,
        webViewLink: driveResult.webViewLink,
        isDrive: driveResult.isDrive,
        fileName: driveResult.fileName,
      },
    });
  } catch (error) {
    console.error('Error general en /api/process-receipt:', error);
    return NextResponse.json(
      { success: false, message: 'Ocurrió un error inesperado al procesar el pago de la cuota.' },
      { status: 500 }
    );
  }
}
