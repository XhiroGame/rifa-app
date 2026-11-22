import { NextResponse } from 'next/server';

const rawUser = (process.env.ADMIN_USERNAME || '').trim();
const ADMIN_USERNAME = !rawUser || rawUser === 'admin' ? 'calidosa_admin' : rawUser;

const rawPass = (process.env.ADMIN_PASSWORD || '').trim();
const ADMIN_PASSWORD = !rawPass || rawPass === 'admin123' ? 'Calidosa$2027#Rifa!' : rawPass;

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Debes ingresar usuario y contraseña.' },
        { status: 400 }
      );
    }

    if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: 'Credenciales incorrectas. Verifica tu usuario y contraseña.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
    });

    // Establecer cookie de sesión para el panel de administración
    response.cookies.set({
      name: 'rifa_admin_auth',
      value: 'authenticated_v2',
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

