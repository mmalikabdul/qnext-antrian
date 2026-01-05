import { Elysia } from "elysia";
import { HealthService } from "../services/health.service";

export const HealthController = new Elysia({ prefix: "/health" })
  .decorate("healthService", new HealthService())
  .get("/", ({ healthService }) => healthService.check());
