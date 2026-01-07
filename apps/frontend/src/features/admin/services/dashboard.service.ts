import { apiClient } from "@/lib/api-client";
import { Ticket } from "@/types/queue";

export const dashboardService = {
  getTodayTickets: async (): Promise<Ticket[]> => {
    return await apiClient.get("/tickets/today");
  },
  
  getServingTickets: async (): Promise<Ticket[]> => {
      return await apiClient.get("/tickets/serving");
  }
};
