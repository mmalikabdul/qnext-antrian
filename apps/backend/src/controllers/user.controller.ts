import { Elysia, t } from "elysia";
import { UserService } from "../services/user.service";
import { authMiddleware } from "../middlewares/auth.middleware";

export const UserController = new Elysia({ prefix: "/users" })
  // 1. Pasang Middleware Auth
  .use(authMiddleware)
  
  // 2. Decorate Service
  .decorate("userService", new UserService())

  // 3. Batasi akses hanya untuk ADMIN untuk semua route di bawah ini
  .guard({ role: 'ADMIN' })

  // GET /api/users - List semua staff
  .get("/", ({ userService }) => userService.findAll())

  // GET /api/users/:id - Get Single User
  .get("/:id", async ({ params: { id }, userService, error }) => {
    try {
      return await userService.findById(Number(id));
    } catch (e: any) {
      return error(404, { success: false, message: e.message });
    }
  })

  // POST /api/users - Add Staff (Register User baru oleh Admin)
  .post("/", async ({ body, userService, error }) => {
    try {
      return await userService.create({
        email: body.email,
        passwordRaw: body.password,
        name: body.name,
        role: body.role as any,
        counters: body.counters
      });
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

  // PUT /api/users/:id - Update Staff
  .put("/:id", async ({ params: { id }, body, userService, error }) => {
    try {
      const updatedUser = await userService.update(Number(id), {
        name: body.name,
        role: body.role as any,
        counters: body.counters,
        passwordRaw: body.password // Opsional
      });
      return { success: true, data: updatedUser };
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      role: t.Optional(t.Union([t.Literal('ADMIN'), t.Literal('STAFF')])),
      counters: t.Optional(t.Array(t.Number())),
      password: t.Optional(t.String())
    })
  })

  // DELETE /api/users/:id - Delete Staff
  .delete("/:id", async ({ params: { id }, userService, error }) => {
    try {
      await userService.delete(Number(id));
      return { success: true, message: "User deleted successfully" };
    } catch (e: any) {
      return error(400, { success: false, message: e.message });
    }
  });
