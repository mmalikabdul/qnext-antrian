import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { HealthController } from "./controllers/health.controller";
import { AuthController } from "./controllers/auth.controller";
import { UserController } from "./controllers/user.controller";
import { ServiceController } from "./controllers/service.controller";
import { CounterController } from "./controllers/counter.controller";
import { TicketController } from "./controllers/ticket.controller";
import { SettingController } from "./controllers/setting.controller";
import { BookingController } from "./controllers/booking.controller";
import { initSocket } from "./lib/socket";

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .group("/api", (app) => 
    app
      .use(HealthController)
      .use(AuthController)
      .use(UserController)
      .use(ServiceController)
      .use(CounterController)
      .use(TicketController)
      .use(SettingController)
      .use(BookingController)
  )
  .listen(process.env.PORT || 3001);

initSocket(app.server);

console.log(
  `🚀 Server is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(`🌐 WebSocket is ready`);