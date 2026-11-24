import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setCuotaAdminAction } from '@/lib/googleSheets';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('rifa_admin_auth')?.value;
  const adminHeader = request.headers.get('x-admin-auth');

  try {
    if (adminCookie !== 'authenticated_v2' && adminHeader !== 'authenticated_v2') {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Inicia sesión como administrador.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { numero, mes, action, reason } = body;

    if (!numero) {
      return NextResponse.json(
        { success: false, message: 'El número de boleta es requerido.' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, message: 'Acción no válida. Debe ser "approve" o "reject".' },
        { status: 400 }
      );
    }

    const mesNum = parseInt(mes, 10) || 1;
    const result = await setCuotaAdminAction(numero, mesNum, action, reason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en /api/admin/action:', error);
    return NextResponse.json(
      { success: false, message: 'Ocurrió un error al procesar la acción.' },
      { status: 500 }
    );
  }
}
