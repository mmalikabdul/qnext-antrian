export interface Counter {
  id: number;
  name: string;
  label?: string;
  // Di backend status tidak ada di model Counter (hanya nama & label), 
  // tapi frontend sebelumnya punya status 'open'/'closed'. 
  // Kita sesuaikan dengan backend dulu (nama, label).
  // Jika butuh status open/close, itu mungkin state lokal atau perlu tambah field di DB.
  // Untuk sementara kita anggap semua counter aktif.
}

export interface Service {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  quota: number;
  usedQuota?: number;
}

export interface Ticket {
  id: number;
  sequence: number;
  number: string;
  status: 'WAITING' | 'SERVING' | 'DONE' | 'SKIPPED';
  serviceId: number;
  counterId?: number;
  createdAt: string;
  updatedAt: string;
  service?: Service;
  counter?: Counter;
}

export interface AppSetting {
  videoUrl: string;
  footerText: string;
  colorScheme: string;
  soundUrl: string;
}
