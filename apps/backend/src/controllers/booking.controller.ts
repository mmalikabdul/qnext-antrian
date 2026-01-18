import { Elysia, t } from "elysia";
import { BookingService } from "../services/booking.service";

export const BookingController = new Elysia({ prefix: "/bookings" })
  .decorate("bookingService", new BookingService())
  
  // Cek Ketersediaan
  .get("/check", async ({ query, bookingService, set }) => {
    try {
        const { serviceId, date } = query;
        if (!serviceId || !date) throw new Error("Service ID and Date required");
        return await bookingService.checkAvailability(Number(serviceId), date);
    } catch (e: any) {
        set.status = 400;
        return { success: false, message: e.message };
    }
  })

  // Buat Booking
  .post("/", async ({ body, bookingService, set }) => {
    try {
        const { serviceId, date } = body;
        return await bookingService.createBooking(Number(serviceId), date);
    } catch (e: any) {
        set.status = 400;
        return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
        serviceId: t.Number(),
        date: t.String() // Format YYYY-MM-DD
    })
  })

  // Redeem Booking (Tukar Kode jadi Tiket)
  .post("/redeem", async ({ body, bookingService, set }) => {
    try {
        const { code, serviceId } = body;
        const ticket = await bookingService.redeemBooking(code, Number(serviceId));
        return { success: true, ticket };
    } catch (e: any) {
        set.status = 400;
        return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
        code: t.String(),
        serviceId: t.Number()
    })
  });
