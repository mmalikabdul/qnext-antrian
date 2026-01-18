import { Elysia, t } from "elysia";
import { ServiceService } from "../services/service.service";
import { jwt } from "@elysiajs/jwt";

export const ServiceController = new Elysia({ prefix: "/services" })
  .decorate("serviceService", new ServiceService())
  
  // Setup JWT Inline agar stabil
  .use(
    jwt({
      name: "jwt",
      secret: (() => {
        if (!process.env.JWT_SECRET) throw new Error("FATAL: JWT_SECRET is not defined in .env");
        return process.env.JWT_SECRET;
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
  
  // Public Access (Untuk Kiosk/Display)
  .get("/", ({ serviceService }) => serviceService.findAll())

  // --- PROTECTED ROUTES (Admin Only) ---
  .post("/", async ({ body, serviceService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    try {
      return await serviceService.create(body);
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      name: t.String(),
      code: t.String(),
      description: t.Optional(t.String()),
      icon: t.Optional(t.String()),
      quota: t.Optional(t.Number())
    })
  })

  .put("/:id", async ({ params: { id }, body, serviceService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    try {
      return await serviceService.update(Number(id), body);
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      code: t.Optional(t.String()),
      description: t.Optional(t.String()),
      icon: t.Optional(t.String()),
      quota: t.Optional(t.Number())
    })
  })

  .delete("/:id", async ({ params: { id }, serviceService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    try {
      await serviceService.delete(Number(id));
      return { success: true, message: "Service deleted successfully" };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
