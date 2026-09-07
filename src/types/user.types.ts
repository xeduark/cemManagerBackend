export interface UserData {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface UserFormDTO {
  full_name: string;
  email: string;
  password?: string; // Opcional al editar
  role: string;
  is_active: boolean;
}