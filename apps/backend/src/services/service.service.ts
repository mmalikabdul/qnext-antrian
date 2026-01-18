import { prisma } from "../lib/prisma";
import { getStartOfToday } from "../utils/ticket.util";

export class ServiceService {
  /**
   * Mengambil semua Service dengan info kuota hari ini
   */
  async findAll() {
    const today = getStartOfToday();
    const services = await prisma.service.findMany({
      orderBy: { code: 'asc' }
    });

    // Tambahkan hitungan tiket hari ini untuk masing-masing service
    return await Promise.all(services.map(async (service) => {
      const usedQuota = await prisma.ticket.count({
        where: {
          serviceId: service.id,
          createdAt: { gte: today }
        }
      });
      return { ...service, usedQuota };
    }));
  }

  /**
   * Membuat Service Baru
   */
  async create(data: { name: string; code: string; description?: string; icon?: string; quota?: number }) {
    const existing = await prisma.service.findUnique({ where: { code: data.code } });
    if (existing) throw new Error("Service code already exists");

    return await prisma.service.create({
      data
    });
  }

  /**
   * Update Service
   */
  async update(id: number, data: { name?: string; code?: string; description?: string; icon?: string; quota?: number }) {
    // Jika update code, cek duplikat
    if (data.code) {
        const existing = await prisma.service.findFirst({
            where: { 
                code: data.code,
                NOT: { id } // Kecuali dirinya sendiri
            }
        });
        if (existing) throw new Error("Service code already exists");
    }

    return await prisma.service.update({
      where: { id },
      data
    });
  }

  /**
   * Hapus Service
   */
  async delete(id: number) {
    return await prisma.service.delete({
      where: { id }
    });
  }
}