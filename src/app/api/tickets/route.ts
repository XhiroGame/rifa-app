import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTickets, isGoogleSheetsConfigured } from '@/lib/googleSheets';
import { RaffleConfig } from '@/types/ticket';
import { MES_ACTUAL_RIFA } from '@/lib/mockTickets';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('rifa_admin_auth')?.value;
  const adminHeader = request.headers.get('x-admin-auth');
  const isAdminAuthenticated =
    adminCookie === 'authenticated_v2' || adminHeader === 'authenticated_v2';

  try {
    const { tickets, isDemo, stats } = await getTickets();

    // Si es la vista pública general, ocultar claveSeguridad (PIN), comprobanteUrl y referencia por privacidad y seguridad
    const safeTickets = isAdminAuthenticated
      ? tickets
      : tickets.map((t) => ({
          ...t,
          claveSeguridad: undefined,
          comprobanteUrl: undefined,
          referencia: undefined,
        }));

    const rawMonthly = process.env.NEXT_PUBLIC_MONTHLY_PRICE || '';
    const monthlyPrice = (!rawMonthly || rawMonthly.startsWith(',')) ? '$100,000 COP / mes' : rawMonthly;

    const rawPrize = process.env.NEXT_PUBLIC_RAFFLE_PRIZE || '';
    const prize =
      !rawPrize || rawPrize.includes(' o ,') || rawPrize.includes('Carro 0 Km')
        ? 'Premio Mayor: $200.000.000 COP ($800M en Premios)'
        : rawPrize;

    const rawSub = process.env.NEXT_PUBLIC_RAFFLE_SUBTITLE || '';
    const subtitle =
      !rawSub || rawSub.includes('de .000') || rawSub.includes('de  000') || rawSub.includes('?')
        ? '¡Plan de Premios 2027 por $800.000.000 COP! Elige tu número del 000 al 999 y abona tu cuota mensual de $100.000 COP.'
        : rawSub;

    const rawLottery = process.env.NEXT_PUBLIC_LOTTERY_NAME || '';
    const lotteryName =
      !rawLottery || rawLottery.includes('?') || rawLottery.includes('Medell')
        ? 'Bogotá, Boyacá y Loterías Nacionales (3 últimas cifras)'
        : rawLottery;

    const rawDraw = process.env.NEXT_PUBLIC_DRAW_DATE || '';
    const drawDate =
      !rawDraw || rawDraw.includes('2026') || rawDraw.includes('?') || rawDraw === 'Noviembre de 2027'
        ? '28 de Octubre de 2027 (Sorteos Diarios y Mensuales)'
        : rawDraw;

    const rawWa = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').trim();
    const whatsappNumber = !rawWa || rawWa === '573001234567' ? '573135982641' : rawWa;

    const config: RaffleConfig = {
      title: process.env.NEXT_PUBLIC_RAFFLE_TITLE || 'Rifas e Inversiones La Calidosa',
      subtitle,
      prize,
      monthlyPrice,
      totalPrice: '$1,200,000 COP (12 cuotas)',
      mesActual: MES_ACTUAL_RIFA,
      drawDate,
      lotteryName,
      whatsappNumber,
      isDemo: !isGoogleSheetsConfigured(),
    };

    return NextResponse.json(
      {
        success: true,
        tickets: safeTickets,
        stats,
        config,
        isDemo,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in /api/tickets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'No se pudieron cargar los datos de las boletas.',
      },
      { status: 500 }
    );
  }
}
