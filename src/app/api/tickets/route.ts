import { NextResponse } from 'next/server';
import { getTickets, isGoogleSheetsConfigured } from '@/lib/googleSheets';
import { RaffleConfig } from '@/types/ticket';
import { MES_ACTUAL_RIFA } from '@/lib/mockTickets';

export async function GET() {
  try {
    const { tickets, isDemo, stats } = await getTickets();

    const rawMonthly = process.env.NEXT_PUBLIC_MONTHLY_PRICE || '';
    const monthlyPrice = (!rawMonthly || rawMonthly.startsWith(',')) ? '$100,000 COP / mes' : rawMonthly;

    const rawPrize = process.env.NEXT_PUBLIC_RAFFLE_PRIZE || '';
    const prize = (!rawPrize || rawPrize.includes(' o ,')) ? 'Primer Premio: Carro 0 Km o $70,000,000 COP' : rawPrize;

    const rawSub = process.env.NEXT_PUBLIC_RAFFLE_SUBTITLE || '';
    const subtitle = (!rawSub || rawSub.includes('de .000') || rawSub.includes('de  000'))
      ? '¡Elige tu número de la suerte del 000 al 999 y paga tu cuota mensual de $100.000 COP!'
      : rawSub;

    const config: RaffleConfig = {
      title: process.env.NEXT_PUBLIC_RAFFLE_TITLE || 'Rifas e Inversiones La Calidosa',
      subtitle,
      prize,
      monthlyPrice,
      totalPrice: '$1,200,000 COP (12 cuotas)',
      mesActual: MES_ACTUAL_RIFA,
      drawDate: process.env.NEXT_PUBLIC_DRAW_DATE || '20 de Diciembre de 2026',
      lotteryName: process.env.NEXT_PUBLIC_LOTTERY_NAME || 'Lotería de Medellín (Últimas 3 cifras)',
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573001234567',
      isDemo: !isGoogleSheetsConfigured(),
    };

    return NextResponse.json(
      {
        success: true,
        tickets,
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
