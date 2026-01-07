import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

// Kita gunakan plugin JWT yang sama dengan controller
// Pastikan secret key SAMA persis.
export const authMiddleware = new Elysia()
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

    // Verify token
    const payload = await jwt.verify(token);
    
    if (!payload) return { user: null };

    // Payload berisi { id, role, ... }
    return {
      user: payload as { id: number; role: 'ADMIN' | 'STAFF' }
    };
  })
  .macro(({ onBeforeHandle }) => ({
    role(requiredRole: 'ADMIN' | 'STAFF') {
      onBeforeHandle(({ user, error }) => {
        if (!user) return error(401, { message: "Unauthorized" });
        if (user.role !== requiredRole) return error(403, { message: "Forbidden" });
      });
    },
    isSignIn(enabled: boolean) {
      if (!enabled) return;
      onBeforeHandle(({ user, error }) => {
        if (!user) return error(401, { message: "Unauthorized" });
      })
    }
  }));