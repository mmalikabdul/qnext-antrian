import { apiClient } from "@/lib/api-client";
import { Ticket } from "@/types/queue";

export const ticketService = {
  // Panggil tiket berikutnya berdasarkan Service ID dan Counter ID
  callNext: async (serviceId: number, counterId: number): Promise<Ticket> => {
    return await apiClient.post("/tickets/call", { serviceId, counterId });
  },

  // Panggil ulang
  recall: async (ticketId: number): Promise<Ticket> => {
    return await apiClient.post(`/tickets/${ticketId}/recall`, {});
  },

  // Selesaikan tiket
  complete: async (ticketId: number): Promise<Ticket> => {
    return await apiClient.post(`/tickets/${ticketId}/complete`, {});
  },

  // Lewati tiket
  skip: async (ticketId: number): Promise<Ticket> => {
    return await apiClient.post(`/tickets/${ticketId}/skip`, {});
  },

  // Dapatkan status antrian hari ini (untuk melihat jumlah waiting)
  getQueueStatus: async (): Promise<Ticket[]> => {
    return await apiClient.get("/tickets/today");
  }
};
