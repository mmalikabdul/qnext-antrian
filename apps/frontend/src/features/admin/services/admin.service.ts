import { apiClient } from "@/lib/api-client";
import { AppSetting, Ticket } from "@/types/queue";

export const adminService = {
  getSettings: async (): Promise<AppSetting> => {
    return await apiClient.get("/settings");
  },

  updateSettings: async (settings: Partial<AppSetting>): Promise<AppSetting> => {
    return await apiClient.post("/settings", settings);
  },

  getReport: async (startDate: string, endDate: string): Promise<Ticket[]> => {
    return await apiClient.get(`/tickets/report?startDate=${startDate}&endDate=${endDate}`);
  }
};
