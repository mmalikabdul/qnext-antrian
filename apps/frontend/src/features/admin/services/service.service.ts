import { apiClient } from "@/lib/api-client";
import { Service } from "@/types/queue";

export const serviceService = {
  getAll: async (): Promise<Service[]> => {
    return await apiClient.get("/services");
  },

  create: async (data: { name: string; code: string; description?: string }): Promise<Service> => {
    return await apiClient.post("/services", data);
  },

  update: async (id: number, data: { name?: string; code?: string; description?: string }): Promise<Service> => {
    return await apiClient.put(`/services/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    return await apiClient.delete(`/services/${id}`);
  }
};
