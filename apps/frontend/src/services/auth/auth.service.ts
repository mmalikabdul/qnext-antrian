import { apiClient } from "@/lib/api-client";
import { AuthResponse, User } from "@/types/auth";

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return await apiClient.post("/auth/login", { email, password });
  },

  logout: async (): Promise<void> => {
    return await apiClient.post("/auth/logout", {});
  },

  getMe: async (): Promise<{ user: User }> => {
    return await apiClient.get("/auth/me");
  }
};
