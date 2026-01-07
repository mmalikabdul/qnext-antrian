export class HealthService {
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      backend: "ElysiaJS + Bun"
    };
  }
}
