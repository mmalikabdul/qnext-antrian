import { apiClient } from "@/lib/api-client";
import { Ticket } from "@/types/queue";

export interface TicketReportResponse {
  data: Ticket[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const reportService = {
  getAll: async (page: number = 1, limit: number = 10, startDate?: string, endDate?: string, serviceId?: string, counterId?: string): Promise<TicketReportResponse> => {
    let query = `/tickets?page=${page}&limit=${limit}`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;
    if (serviceId && serviceId !== 'ALL') query += `&serviceId=${serviceId}`;
    if (counterId && counterId !== 'ALL') query += `&counterId=${counterId}`;
    
    return await apiClient.get(query);
  },

  downloadExcel: async (startDate?: string, endDate?: string, serviceId?: string, counterId?: string) => {
    let query = `/tickets/export?`;
    if (startDate) query += `startDate=${startDate}&`;
    if (endDate) query += `endDate=${endDate}&`;
    if (serviceId && serviceId !== 'ALL') query += `serviceId=${serviceId}&`;
    if (counterId && counterId !== 'ALL') query += `counterId=${counterId}`;

    const response = await apiClient.get(query, {
        responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response as any]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Antrian_${new Date().toISOString().slice(0,10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }
};
