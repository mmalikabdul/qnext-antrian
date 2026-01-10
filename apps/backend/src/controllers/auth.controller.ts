import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { AuthService } from "../services/auth.service";
import { LogService } from "../services/log.service";

export const AuthController = new Elysia({ prefix: "/auth" })
  // Inisialisasi Plugin JWT Inline agar stabil
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
  .decorate("authService", new AuthService())
  .decorate("logService", new LogService())
  
  // LOGIN Endpoint
  .post("/login", async ({ body, authService, logService, jwt, request, set }) => {
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
      set.status = 401;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })

  // REGISTER Endpoint
  .post("/register", async ({ body, authService, set }) => {
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
      set.status = 400;
      return { success: false, message: e.message };
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
  .post("/logout", async ({ logService, user, request }) => {
    if (!user) return { success: true, message: "Logged out" };

    await logService.recordAuth({
      userId: user.id,
      action: "LOGIN", // Sesuai pattern di service
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown"
    });

    return { success: true, message: "Logged out successfully" };
  })

  // GET CURRENT USER (Protected)
  .get("/me", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    return { user };
  })

  // GET LOGS (Admin Only)
  .get("/logs", ({ logService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    return logService.getAuthLogs();
  });
