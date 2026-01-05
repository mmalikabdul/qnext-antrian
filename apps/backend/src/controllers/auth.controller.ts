import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { AuthService } from "../services/auth.service";
import { LogService } from "../services/log.service";
import { authMiddleware } from "../middlewares/auth.middleware";

export const AuthController = new Elysia({ prefix: "/auth" })
  // Inisialisasi Plugin JWT
  .use(
    jwt({
      name: "jwt",
      secret: (() => {
        if (!process.env.JWT_SECRET) throw new Error("FATAL: JWT_SECRET is not defined in .env");
        return process.env.JWT_SECRET;
      })(),
      exp: "7d", // Token valid 7 hari
    })
  )
  .decorate("authService", new AuthService())
  .decorate("logService", new LogService())
  
  // LOGIN Endpoint
  .post("/login", async ({ body, authService, logService, jwt, request, error }) => {
    try {
      const user = await authService.login(body.email, body.password);
      
      // Generate Token
      const token = await jwt.sign({
        id: user.id,
        role: user.role,
      });

      // Catat Log Login
      await logService.recordAuth({
        userId: user.id,
        action: "LOGIN",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown"
      });

      return {
        success: true,
        token,
        user,
      };
    } catch (e: any) {
      return error(401, { success: false, message: e.message });
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })

  // REGISTER Endpoint
  .post("/register", async ({ body, authService, error }) => {
    try {
      const newUser = await authService.register({
        email: body.email,
        passwordRaw: body.password,
        name: body.name,
        role: body.role as any,
        counters: body.counters
      });
      return { success: true, data: newUser };
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
      name: t.String(),
      role: t.Union([t.Literal('ADMIN'), t.Literal('STAFF')]),
      counters: t.Optional(t.Array(t.Number()))
    })
  })

  // LOGOUT Endpoint
  // Kita tambahkan middleware agar tahu siapa yang logout
  .post("/logout", async ({ logService, user, request, error }) => {
    if (!user) return { success: true, message: "Logged out" };

    await logService.recordAuth({
      userId: user.id,
      action: "LOGOUT",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown"
    });

    return { success: true, message: "Logged out successfully" };
  }, {
    beforeHandle: [({ headers, user, error }) => {
      // Logout mencatat log hanya jika ada token valid
    }]
  })

  // GET CURRENT USER (Protected)
  .use(authMiddleware)
  .get("/me", ({ user }) => {
    return { user };
  }, {
    isSignIn: true
  })

  // GET LOGS (Admin Only)
  .get("/logs", ({ logService }) => logService.getAuthLogs(), {
    role: "ADMIN"
  });