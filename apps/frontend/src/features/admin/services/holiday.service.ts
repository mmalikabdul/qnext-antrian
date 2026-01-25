import { apiClient } from "@/lib/api-client";

export interface Holiday {
  id: number;
  date: string;
  description: string;
  isActive: boolean;
}

export const holidayService = {
  getAll: async (): Promise<Holiday[]> => {
    return await apiClient.get("/holidays");
  },

  create: async (data: { date: string; description: string; isActive?: boolean }) => {
    return await apiClient.post("/holidays", data);
  },

  update: async (id: number, data: { date?: string; description?: string; isActive?: boolean }) => {
    return await apiClient.put(`/holidays/${id}`, data);
  },

  delete: async (id: number) => {
    return await apiClient.delete(`/holidays/${id}`);
  },

  getActiveHolidays: async (): Promise<Date[]> => {
    const holidays = await apiClient.get("/holidays");
    return holidays
        .filter((h: any) => h.isActive)
        .map((h: any) => new Date(h.date));
  }
};
