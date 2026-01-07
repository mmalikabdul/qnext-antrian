export type Role = 'ADMIN' | 'STAFF';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  counters?: number[]; // ID Counters yang diassign
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}
