import { Elysia, t } from "elysia";
import { HolidayService } from "../services/holiday.service";

export const HolidayController = new Elysia({ prefix: "/holidays" })
  .decorate("holidayService", new HolidayService())
  
  .get("/", ({ holidayService }) => holidayService.findAll())
  
  .post("/", async ({ body, holidayService, set }) => {
    try {
        return await holidayService.create(body);
    } catch (e: any) {
        set.status = 400;
        return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
        date: t.String(),
        description: t.String(),
        isActive: t.Optional(t.Boolean())
    })
  })

  .put("/:id", async ({ params, body, holidayService, set }) => {
    try {
        return await holidayService.update(Number(params.id), body);
    } catch (e: any) {
        set.status = 400;
        return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
        date: t.Optional(t.String()),
        description: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean())
    })
  })

  .delete("/:id", async ({ params, holidayService, set }) => {
    try {
        await holidayService.delete(Number(params.id));
        return { success: true };
    } catch (e: any) {
        set.status = 400;
        return { success: false, message: e.message };
    }
  });
