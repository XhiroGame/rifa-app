import { NextResponse } from 'next/server';
import { reserveTicket } from '@/lib/googleSheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { numero, nombre, telefono } = body;

    if (!numero || !nombre || !telefono) {
      return NextResponse.json(
        { success: false, message: 'Todos los campos son requeridos (número, nombre y teléfono).' },
        { status: 400 }
      );
    }

    const result = await reserveTicket(numero, nombre, telefono);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Error en /api/reserve:', error);
    return NextResponse.json(
      { success: false, message: 'Ocurrió un error inesperado al procesar la reserva.' },
      { status: 500 }
    );
  }
}

