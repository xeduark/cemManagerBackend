export interface Acta {
  id: number;
  acta_number: string; // ACT-0001, ACT-0002, etc.
  fecha: string;

  nombre: string;
  cargo: string;
  sede: string;
  equipo: string;
  marca: string;
  accesorios: string;
  estado: string;
  observaciones: string;

  recibido_por_nombre: string;
  recibido_por_cc: string;
  entregado_por_nombre: string;
  entregado_por_cc: string;
  visto_bueno: string;

  diadema_serial?: string;
  diadema_marca_id?: number;

  created_at: string;
  updated_at: string;
}

export type ActaPayload = Omit<
  Acta,
  'id' | 'acta_number' | 'created_at' | 'updated_at'
>;
