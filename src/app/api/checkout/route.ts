import { POST as processReceiptPost } from '../process-receipt/route';

// Mantiene compatibilidad con el endpoint de checkout existente delegando al procesador completo
export async function POST(request: Request) {
  return processReceiptPost(request);
}
