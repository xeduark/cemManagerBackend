import { CelularPayload } from './operador.types.js';

export interface ActaPayload {
  id: number;
  acta_number: string; // ACT-0001, ACT-0002, etc.
  fecha: string;

  cargoId: number;
  cargoEspecificacion?: string;
  sedeId: number;

  equipo: string;
  laptop_marca_id?: number;
  laptopSerial: string;

  accesorios: string;
  estado: string;
  observaciones: string;

  recibidoPorNombre: string;
  recibidoPorCC: string;

  entregadoPorNombre: string;
  entregadoPorCC: string;

  vistoBueno: string;

  diadema_serial?: string;
  diadema_marca_id?: number;

  created_at: string;
  updated_at: string;
  closed_at: string | null;

  celular?: CelularPayload | null;
}

