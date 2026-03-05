export interface Sede {
  id: number;
  nombre: string;
  direccion?: string;
  ciudad?: string;
}

export interface SedeResponse {
  id: number;
  nombre: string;
}