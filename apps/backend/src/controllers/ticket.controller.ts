import { Elysia, t } from "elysia";
import { TicketService } from "../services/ticket.service";
import { authMiddleware } from "../middlewares/auth.middleware";

export const TicketController = new Elysia({ prefix: "/tickets" })
  .decorate("ticketService", new TicketService())

  // --- PUBLIC ROUTES (Kiosk, Display) ---

  // Get Serving Tickets (Untuk Display Layar Utama)
  .get("/serving", ({ ticketService }) => ticketService.getServingTickets())

  // Get Today Tickets (Untuk Monitoring List)
  .get("/today", ({ ticketService }) => ticketService.getTodayTickets())

  // Create Ticket / Ambil Antrian (Kiosk)
  .post("/", async ({ body, ticketService, error }) => {
    try {
      return await ticketService.createTicket(body.serviceId);
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  }, {
    body: t.Object({
      serviceId: t.Number()
    })
  })

  // --- PROTECTED ROUTES (Staff Operasional) ---
  .use(authMiddleware)
  .onBeforeHandle(({ user, error }) => {
    if (!user) return error(401, { message: "Unauthorized" });
  })

  // Get Report Data (Admin Only)
  .get("/report", async ({ query, ticketService, user, error }) => {
    // Opsional: Cek Role Admin jika perlu
    if (user.role !== 'ADMIN') return error(403, { message: "Forbidden" });
    
    if (!query.startDate || !query.endDate) {
      return error(400, { message: "Start Date and End Date required" });
    }
    return await ticketService.getReportData(query.startDate, query.endDate);
  }, {
    query: t.Object({
      startDate: t.String(),
      endDate: t.String()
    })
  })

  // Call Next Ticket
  .post("/call", async ({ body, user, ticketService, error }) => {
    try {
      // Pastikan user punya counterId yang valid (bisa dikirim dari FE atau ambil dari relasi user->counter di DB nanti)
      // Untuk MVP migrasi ini, counterId dikirim dari Client (sesuai context FE sebelumnya)
      return await ticketService.callNextTicket(body.serviceId, body.counterId, user.id);
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  }, {
    body: t.Object({
      serviceId: t.Number(),
      counterId: t.Number()
    })
  })

  // Recall Ticket
  .post("/:id/recall", async ({ params: { id }, ticketService, error }) => {
    try {
      return await ticketService.recallTicket(Number(id));
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  })

  // Complete Ticket
  .post("/:id/complete", async ({ params: { id }, ticketService, error }) => {
    try {
      return await ticketService.completeTicket(Number(id));
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  })

  // Skip Ticket
  .post("/:id/skip", async ({ params: { id }, ticketService, error }) => {
    try {
      return await ticketService.skipTicket(Number(id));
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  });
