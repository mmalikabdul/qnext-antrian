import { apiClient } from "@/lib/api-client";
import { Counter } from "@/types/queue";

export const counterService = {
  getAll: async (): Promise<Counter[]> => {
    return await apiClient.get("/counters");
  },

  create: async (data: { name: string; label?: string }): Promise<Counter> => {
    return await apiClient.post("/counters", data);
  },

  update: async (id: number, data: { name?: string; label?: string }): Promise<Counter> => {
    return await apiClient.put(`/counters/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    return await apiClient.delete(`/counters/${id}`);
  }
};
