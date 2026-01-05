import { Elysia, t } from "elysia";
import { SettingService } from "../services/setting.service";
import { authMiddleware } from "../middlewares/auth.middleware";

export const SettingController = new Elysia({ prefix: "/settings" })
  .decorate("settingService", new SettingService())

  // Public: Get Settings (Untuk Display)
  .get("/", ({ settingService }) => settingService.getSettings())

  // Protected: Update Settings (Admin)
  .use(authMiddleware)
  .onBeforeHandle(({ role }) => role('ADMIN'))

  .post("/", async ({ body, settingService, error }) => {
    try {
      return await settingService.updateSettings(body);
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  }, {
    body: t.Object({
      videoUrl: t.Optional(t.String()),
      footerText: t.Optional(t.String()),
      colorScheme: t.Optional(t.String()),
      soundUrl: t.Optional(t.String())
    })
  });
