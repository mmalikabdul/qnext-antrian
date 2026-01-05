import { prisma } from "../lib/prisma";

export class LogService {
  /**
   * Mencatat aktivitas Auth (Login/Logout)
   */
  async recordAuth(data: { 
    userId: number; 
    action: "LOGIN" | "LOGOUT"; 
    ipAddress?: string; 
    userAgent?: string; 
  }) {
    return await prisma.authLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Mengambil riwayat log (biasanya untuk Admin)
   */
  async getAuthLogs(limit = 100) {
    return await prisma.authLog.findMany({
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
