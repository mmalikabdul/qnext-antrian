import { Elysia, t } from "elysia";
import { SettingService } from "../services/setting.service";
import { jwt } from "@elysiajs/jwt";

export const SettingController = new Elysia({ prefix: "/settings" })
  .decorate("settingService", new SettingService())

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

  // Public: Get Settings (Untuk Display)
  .get("/", ({ settingService }) => settingService.getSettings())

  // --- PROTECTED ROUTES (Admin) ---
  .post("/", async ({ body, settingService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    try {
      return await settingService.updateSettings(body);
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      videoUrl: t.Optional(t.String()),
      footerText: t.Optional(t.String()),
      colorScheme: t.Optional(t.String()),
      soundUrl: t.Optional(t.String())
    })
  });
