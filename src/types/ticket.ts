export type CuotaStatus = 'Pagado' | 'En revisión' | 'Pendiente';

export interface Cuota {
  mes: number; // 1 a 12
  nombreMes: string; // "Enero", "Febrero", etc.
  estado: CuotaStatus;
  monto: number; // 100000
  fechaPago?: string;
  referencia?: string;
  comprobanteUrl?: string;
  banco?: string;
}

export type TicketStatus =
  | 'Disponible'    // Nadie la ha apartado
  | 'Al día'        // Apartada y con las cuotas al día
  | 'En mora'       // Apartada pero debe cuotas atrasadas
  | 'En revisión'   // Tiene un pago de cuota pendiente de verificar por el admin
  | 'Completada';   // Pagó las 12 cuotas ($1.200.000)

export type PublicStatusFilter = 'Todas' | 'Disponible' | 'Ocupadas';

export interface Ticket {
  numero: string; // "000" a "999"
  estado: TicketStatus;
  nombre?: string;
  telefono?: string;
  claveSeguridad?: string; // Clave única / PIN de 4 dígitos para autorizar pagos mensuales
  fechaInicio?: string;
  cuotasPagadas: number; // Cuántas cuotas de 12 ha pagado (0 a 12)
  totalAbonado: number; // cuotasPagadas * 100000
  cuotas: Cuota[]; // Las 12 mensualidades
  cuotaEnRevision?: number; // Número de mes que está actualmente en revisión (1 a 12)
  comprobanteUrl?: string;
  referencia?: string;
  notas?: string;
}

export interface RaffleStats {
  total: number;
  disponibles: number;
  alDia: number;
  enMora: number;
  enRevision: number;
  completadas: number;
  totalRecaudado: number; // Suma en COP de todas las cuotas pagadas
  porcentajeRecaudado: number;
}

export interface RaffleConfig {
  title: string;
  subtitle: string;
  prize: string;
  monthlyPrice: string; // "$100,000 COP"
  totalPrice: string; // "$1,200,000 COP (12 cuotas)"
  ticketPrice?: string;
  mesActual: number; // Mes actual de la rifa (ej: 11 de 12)
  drawDate: string;
  lotteryName: string;
  whatsappNumber: string;
  isDemo: boolean;
}

export interface TicketsApiResponse {
  success: boolean;
  tickets: Ticket[];
  stats: RaffleStats;
  config: RaffleConfig;
  isDemo: boolean;
  lastUpdated: string;
  error?: string;
}
