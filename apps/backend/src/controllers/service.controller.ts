import { Elysia, t } from "elysia";
import { ServiceService } from "../services/service.service";
import { authMiddleware } from "../middlewares/auth.middleware";

export const ServiceController = new Elysia({ prefix: "/services" })
  .decorate("serviceService", new ServiceService())
  
  // Public Access (Untuk Kiosk/Display)
  .get("/", ({ serviceService }) => serviceService.findAll())

  // Protected Routes (Admin Only)
  .use(authMiddleware)
  .onBeforeHandle(({ role }) => role('ADMIN'))

  .post("/", async ({ body, serviceService, error }) => {
    try {
      return await serviceService.create(body);
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  }, {
    body: t.Object({
      name: t.String(),
      code: t.String(),
      description: t.Optional(t.String())
    })
  })

  .put("/:id", async ({ params: { id }, body, serviceService, error }) => {
    try {
      return await serviceService.update(Number(id), body);
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      code: t.Optional(t.String()),
      description: t.Optional(t.String())
    })
  })

  .delete("/:id", async ({ params: { id }, serviceService, error }) => {
    try {
      await serviceService.delete(Number(id));
      return { success: true, message: "Service deleted successfully" };
    } catch (e: any) {
      return error(400, { success: false, message: e.message }); // Kemungkinan error FK constraint
    }
  });
