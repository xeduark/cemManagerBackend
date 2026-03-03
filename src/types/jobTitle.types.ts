// Modelo DB completo
export interface Cargo {
  id: number;
  nombre: string;
  activo: boolean;
  area_id: number | null;
}

// Respuesta API pública
export interface CargoResponse {
  id: number;
  nombre: string;
}