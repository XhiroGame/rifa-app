import { NextResponse } from 'next/server';
import { validateTicketPin } from '@/lib/googleSheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { numero, pin } = body;

    if (!numero || !pin) {
      return NextResponse.json(
        { success: false, valid: false, message: 'Número de boleta y clave única son requeridos.' },
        { status: 400 }
      );
    }

    const cleanNum = parseInt(numero.toString(), 10).toString().padStart(3, '0');
    const cleanPin = pin.toString().trim().toUpperCase();

    if (!/^[0-9A-F]{4}$/.test(cleanPin)) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'La clave única debe ser un código hexadecimal de 4 cifras (0-9, A-F, ej: 7A3F).',
        numero: cleanNum,
      });
    }

    const result = await validateTicketPin(cleanNum, cleanPin);

    return NextResponse.json({
      success: true,
      valid: result.valid,
      message: result.message,
      numero: cleanNum,
    });
  } catch (error) {
    console.error('Error en /api/validate-pin:', error);
    return NextResponse.json(
      { success: false, valid: false, message: 'Error interno al validar la clave única.' },
      { status: 500 }
    );
  }
}

