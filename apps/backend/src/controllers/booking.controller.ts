import { Elysia, t } from "elysia";
import { BookingService } from "../services/booking.service";

export const BookingController = new Elysia({ prefix: "/bookings" })
  .decorate("bookingService", new BookingService())
  
  // Get All Bookings (Admin)
  .get("/", async ({ query, bookingService, set }) => {
    try {
        const { page, limit, search, status, date } = query;
        return await bookingService.getAll(
            Number(page) || 1,
            Number(limit) || 10,
            search,
            status,
            date
        );
    } catch (e: any) {
        set.status = 500;
        return { success: false, message: e.message };
    }
  }, {
    query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        search: t.Optional(t.String()),
        status: t.Optional(t.String()),
        date: t.Optional(t.String())
    })
  })

  // Export Excel
  .get("/export", async ({ query, bookingService, set }) => {
    try {
        const { search, status, date } = query;
        const buffer = await bookingService.exportToExcel(search, status, date);
        
        set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        set.headers['Content-Disposition'] = `attachment; filename="Daftar_Tamu_${Date.now()}.xlsx"`;
        
        return new Response(buffer as BlobPart);
    } catch (e: any) {
        set.status = 500;
        return { success: false, message: e.message };
    }
  }, {
    query: t.Object({
        search: t.Optional(t.String()),
        status: t.Optional(t.String()),
        date: t.Optional(t.String())
    })
  })

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
        const { serviceId, date, issueDescription, fileUrl, email, nama, nib, namaPerusahaan, idProfileOss, jenisBooking } = body;
        
        // Convert idProfileOss to string if it's a number
        const idProfileStr = idProfileOss ? String(idProfileOss) : undefined;

        return await bookingService.createBooking(
            Number(serviceId), 
            date, 
            issueDescription, 
            fileUrl,
            email,
            nama,
            nib,
            namaPerusahaan,
            idProfileStr,
            jenisBooking as any
        );
    } catch (e: any) {
        set.status = 400;
        return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
        serviceId: t.Number(),
        date: t.String(), // Format YYYY-MM-DD
        issueDescription: t.Optional(t.String()),
        fileUrl: t.Optional(t.String()),
        email: t.Optional(t.String()),
        nama: t.Optional(t.String()),
        nib: t.Optional(t.String()),
        namaPerusahaan: t.Optional(t.String()),
        idProfileOss: t.Optional(t.Union([t.String(), t.Number()])), // Accept string or number
        jenisBooking: t.Optional(t.Union([t.Literal('ONLINE'), t.Literal('OFFLINE')]))
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
