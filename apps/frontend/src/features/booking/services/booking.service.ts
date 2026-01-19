import { apiClient } from "@/lib/api-client";
import { Service } from "@/types/queue";

export interface CheckAvailabilityResponse {
    available: boolean;
    remaining: number;
    quota: number;
}

export interface BookingResponse {
    id: number;
    code: string;
    bookingDate: string;
    service: Service;
}

export const bookingService = {
  checkAvailability: async (serviceId: number, date: string): Promise<CheckAvailabilityResponse> => {
    return await apiClient.get(`/bookings/check?serviceId=${serviceId}&date=${date}`);
  },

  createBooking: async (
    serviceId: number, 
    date: string, 
    issueDescription?: string, 
    fileUrl?: string,
    userDetails?: {
        email?: string;
        nib?: string;
        namaPerusahaan?: string;
        idProfileOss?: string | number;
    }
  ): Promise<BookingResponse> => {
    return await apiClient.post("/bookings", {
      serviceId,
      date,
      issueDescription,
      fileUrl,
      ...userDetails
    });
  },

  redeemBooking: async (code: string, serviceId: number) => {
    return await apiClient.post("/bookings/redeem", { code, serviceId });
  }
};
