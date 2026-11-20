import { NextResponse } from 'next/server';

const BLOB_BASE_URL = 'https://b353ainvf4oyaxa4.public.blob.vercel-storage.com';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await context.params;
    const filePath = (slug || []).join('/');
    if (!filePath) {
      return new NextResponse('Archivo no especificado', { status: 400 });
    }

    const cleanPath = filePath.startsWith('comprobantes/')
      ? filePath
      : `comprobantes/${filePath}`;

    const targetUrl = `${BLOB_BASE_URL}/${cleanPath}`;
    const blobRes = await fetch(targetUrl, { cache: 'no-store' });

    if (!blobRes.ok) {
      // Si es un comprobante antiguo de prueba local, devolver un SVG informativo en lugar de colgarse o dar 404
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#0f172a"/>
        <rect x="40" y="40" width="520" height="320" rx="20" fill="#1e293b" stroke="#334155" stroke-width="2"/>
        <text x="300" y="175" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="bold">Comprobante de prueba anterior</text>
        <text x="300" y="210" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">${filePath}</text>
        <text x="300" y="245" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="13">Sube un nuevo comprobante desde la web para verlo aquí</text>
      </svg>`;
      return new NextResponse(fallbackSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    const contentType = blobRes.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await blobRes.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error sirviendo comprobante:', error);
    return new NextResponse('Error al cargar el comprobante', { status: 500 });
  }
}
