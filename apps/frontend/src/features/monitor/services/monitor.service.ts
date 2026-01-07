import { apiClient } from "@/lib/api-client";
import { Ticket, AppSetting } from "@/types/queue";

export const monitorService = {
  getServingTickets: async (): Promise<Ticket[]> => {
    return await apiClient.get("/tickets/serving");
  },

  getTodayTickets: async (): Promise<Ticket[]> => {
    return await apiClient.get("/tickets/today");
  },

  getDisplaySettings: async (): Promise<AppSetting> => {
    return await apiClient.get("/settings");
  }
};
