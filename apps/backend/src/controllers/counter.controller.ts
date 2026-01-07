import { Elysia, t } from "elysia";
import { CounterService } from "../services/counter.service";
import { authMiddleware } from "../middlewares/auth.middleware";

export const CounterController = new Elysia({ prefix: "/counters" })
  .decorate("counterService", new CounterService())

  // Public Access (Untuk Display/Panggilan)
  .get("/", ({ counterService }) => counterService.findAll())

  // Protected Routes (Admin Only)
  .use(authMiddleware)
  .guard({ role: 'ADMIN' })

  .post("/", async ({ body, counterService, error }) => {
    try {
      return await counterService.create(body);
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  }, {
    body: t.Object({
      name: t.String(),
      label: t.Optional(t.String())
    })
  })

  .put("/:id", async ({ params: { id }, body, counterService, error }) => {
    try {
      return await counterService.update(Number(id), body);
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      label: t.Optional(t.String())
    })
  })

  .delete("/:id", async ({ params: { id }, counterService, error }) => {
    try {
      await counterService.delete(Number(id));
      return { success: true, message: "Counter deleted successfully" };
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  });
