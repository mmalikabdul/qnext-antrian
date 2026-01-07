import { apiClient } from "@/lib/api-client";
import { Ticket, Service } from "@/types/queue";

export const kioskService = {
  createTicket: async (serviceId: number): Promise<Ticket> => {
    return await apiClient.post("/tickets", { serviceId });
  },

  getServices: async (): Promise<Service[]> => {
    return await apiClient.get("/services");
  }
};
