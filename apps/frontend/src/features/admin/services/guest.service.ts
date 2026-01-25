import { apiClient } from "@/lib/api-client";

export interface Booking {
  id: number;
  code: string;
  serviceId: number;
  bookingDate: string;
  email?: string;
  nama?: string;
  nib?: string;
  namaPerusahaan?: string;
  idProfileOss?: string;
  issueDescription?: string;
  fileUrl?: string;
  status: 'PENDING' | 'USED' | 'EXPIRED' | 'CANCELLED';
  jenisBooking?: 'ONLINE' | 'OFFLINE';
  createdAt: string;
  updatedAt: string;
  service?: {
    name: string;
  };
  ticket?: {
    number: string;
    status: string;
  };
}

export interface BookingResponse {
  data: Booking[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const guestService = {
  getAll: async (page: number = 1, limit: number = 10, search: string = "", status: string = "", date: string = ""): Promise<BookingResponse> => {
    let query = `/bookings?page=${page}&limit=${limit}`;
    if(search) query += `&search=${search}`;
    if(status && status !== 'ALL') query += `&status=${status}`;
    if(date) query += `&date=${date}`;
    
    return await apiClient.get(query);
  },

  downloadExcel: async (search: string = "", status: string = "", date: string = "") => {
    let query = `/bookings/export?search=${search}`;
    if(status && status !== 'ALL') query += `&status=${status}`;
    if(date) query += `&date=${date}`;

    const response = await apiClient.get(query, {
        responseType: 'blob' 
    });
    
    // Create a link to download the blob
    const url = window.URL.createObjectURL(new Blob([response as any]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daftar_Tamu_${new Date().toISOString().slice(0,10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },

  create: async (data: {
    namaPerusahaan: string;
    nama: string;
    nib: string;
    email: string;
    issueDescription: string;
    serviceId: number;
    date: string; // YYYY-MM-DD
    jenisBooking?: 'ONLINE' | 'OFFLINE';
  }) => {
    return await apiClient.post("/bookings", {
        ...data,
        jenisBooking: data.jenisBooking || 'OFFLINE'
    });
  }
};
