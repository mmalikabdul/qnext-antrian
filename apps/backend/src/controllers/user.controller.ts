import { Elysia, t } from "elysia";
import { UserService } from "../services/user.service";
import { jwt } from "@elysiajs/jwt";

export const UserController = new Elysia({ prefix: "/users" })
  .decorate("userService", new UserService())
  
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

  // GET /api/users - List semua staff
  .get("/", async ({ query, userService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    const { search, role } = query;
    return userService.findAll(search, role);
  }, {
    query: t.Object({
        search: t.Optional(t.String()),
        role: t.Optional(t.String())
    })
  })

  // GET /api/users/:id - Get Single User
  .get("/:id", async ({ params: { id }, userService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    try {
      return await userService.findById(Number(id));
    } catch (e: any) {
      set.status = 404;
      return { success: false, message: e.message };
    }
  })

  // POST /api/users - Add Staff (Register User baru oleh Admin)
  .post("/", async ({ body, userService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    try {
      return await userService.create({
        email: body.email,
        passwordRaw: body.password,
        name: body.name,
        role: body.role as any,
        counters: body.counters
      });
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
      name: t.String(),
      role: t.Union([t.Literal('ADMIN'), t.Literal('STAFF'), t.Literal('GREETER')]),
      counters: t.Optional(t.Array(t.Number()))
    })
  })

  // PUT /api/users/:id - Update Staff
  .put("/:id", async ({ params: { id }, body, userService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    try {
      const updatedUser = await userService.update(Number(id), {
        name: body.name,
        role: body.role as any,
        counters: body.counters,
        passwordRaw: body.password // Opsional
      });
      return { success: true, data: updatedUser };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      role: t.Optional(t.Union([t.Literal('ADMIN'), t.Literal('STAFF'), t.Literal('GREETER')])),
      counters: t.Optional(t.Array(t.Number())),
      password: t.Optional(t.String())
    })
  })

  // DELETE /api/users/:id - Delete Staff
  .delete("/:id", async ({ params: { id }, userService, user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    if (user.role !== 'ADMIN') {
      set.status = 403;
      return { success: false, message: "Forbidden" };
    }
    try {
      await userService.delete(Number(id));
      return { success: true, message: "User deleted successfully" };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
