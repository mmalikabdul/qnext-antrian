import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { TicketService } from "../services/ticket.service";

export const TicketController = new Elysia({ prefix: "/tickets" })
  .decorate("ticketService", new TicketService())
  // Setup JWT Inline agar derive context berjalan stabil di semua route
  .use(
    jwt({
      name: "jwt",
      secret: (() => {
        const s = process.env.JWT_SECRET;
        if (!s) throw new Error("FATAL: JWT_SECRET is not defined in .env");
        return s;
      })(),
    })
  )
  .derive(async ({ jwt, headers }) => {
    const authHeader = headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) return { user: null };

    const payload = await jwt.verify(token);
    if (!payload) return { user: null };

    return {
      user: payload as { id: number; role: 'ADMIN' | 'STAFF' }
    };
  })

  // --- PUBLIC ROUTES (Kiosk, Display) ---

  // Get Serving Tickets (Untuk Display Layar Utama)
  .get("/serving", ({ ticketService }) => ticketService.getServingTickets())

  // Get Today Tickets (Untuk Monitoring List)
  .get("/today", ({ ticketService }) => ticketService.getTodayTickets())

  // Create Ticket / Ambil Antrian (Kiosk)
  .post("/", async ({ body, ticketService, set }) => {
    try {
      return await ticketService.createTicket(body.serviceId);
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      serviceId: t.Number()
    })
  })

  // --- PROTECTED ROUTES (Staff Operasional) ---

  // Get Report Data (Admin Only)
  .get("/report", async ({ query, ticketService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    
    if (!query.startDate || !query.endDate) {
      set.status = 400;
      return { success: false, message: "Start Date and End Date required" };
    }
    return await ticketService.getReportData(query.startDate, query.endDate);
  }, {
    query: t.Object({
      startDate: t.String(),
      endDate: t.String()
    })
  })

  // Call Next Ticket
  .post("/call", async ({ body, user, ticketService, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    try {
      return await ticketService.callNextTicket(body.serviceId, body.counterId, user.id);
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      serviceId: t.Number(),
      counterId: t.Number()
    })
  })

  // Recall Ticket
  .post("/:id/recall", async ({ params: { id }, user, ticketService, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    try {
      return await ticketService.recallTicket(Number(id));
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Complete Ticket
  .post("/:id/complete", async ({ params: { id }, user, ticketService, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    try {
      return await ticketService.completeTicket(Number(id));
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Skip Ticket
  .post("/:id/skip", async ({ params: { id }, user, ticketService, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    try {
      return await ticketService.skipTicket(Number(id));
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
