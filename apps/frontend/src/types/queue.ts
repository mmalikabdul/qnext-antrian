export interface Counter {
  id: number;
  name: string;
  label?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BREAK';
}

export interface Service {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  quota: number;
  usedQuota?: number;
  startTime?: string;
  endTime?: string;
  isOpen?: boolean;
  statusMessage?: string;
}

export interface Ticket {
  id: number;
  sequence: number;
  number: string;
  status: 'WAITING' | 'SERVING' | 'DONE' | 'SKIPPED';
  serviceId: number;
  counterId?: number;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
  service?: Service;
  counter?: Counter;
  booking?: {
    code: string;
    jenisBooking?: string;
  };
}

export interface AppSetting {
  videoUrl: string;
  footerText: string;
  colorScheme: string;
  soundUrl: string;
}
