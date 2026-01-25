import { Elysia, t } from "elysia";
import { CounterService } from "../services/counter.service";
import { jwt } from "@elysiajs/jwt";

export const CounterController = new Elysia({ prefix: "/counters" })
  .decorate("counterService", new CounterService())

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

  // Public Access (Untuk Display/Panggilan)
  .get("/", ({ counterService }) => counterService.getAll())

  // --- PROTECTED ROUTES (Admin Only) ---
  .post("/", async ({ body, counterService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    try {
      return await counterService.create(body);
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      name: t.String(),
      label: t.Optional(t.String())
    })
  })

  .put("/:id", async ({ params: { id }, body, counterService, set }) => {
    try {
      return await counterService.update(Number(id), body);
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      label: t.Optional(t.String()),
      status: t.Optional(t.Union([t.Literal('ACTIVE'), t.Literal('INACTIVE'), t.Literal('BREAK')]))
    })
  })

  .delete("/:id", async ({ params: { id }, counterService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    try {
      await counterService.delete(Number(id));
      return { success: true, message: "Counter deleted successfully" };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
