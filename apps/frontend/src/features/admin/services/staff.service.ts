import { apiClient } from "@/lib/api-client";
import { User } from "@/types/auth";

export const staffService = {
  getAll: async (): Promise<User[]> => {
    return await apiClient.get("/users");
  },

  getById: async (id: number): Promise<User> => {
    return await apiClient.get(`/users/${id}`);
  },

  create: async (data: any): Promise<User> => {
    console.log('data di service', data);
    return await apiClient.post("/users", data);
  },

  update: async (id: number, data: any): Promise<User> => {
    return await apiClient.put(`/users/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    return await apiClient.delete(`/users/${id}`);
  }
};
