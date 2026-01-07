import { prisma } from "../lib/prisma";

export class ServiceService {
  /**
   * Mengambil semua Service
   */
  async findAll() {
    return await prisma.service.findMany({
      orderBy: { code: 'asc' }
    });
  }

  /**
   * Membuat Service Baru
   */
  async create(data: { name: string; code: string; description?: string; icon?: string }) {
    const existing = await prisma.service.findUnique({ where: { code: data.code } });
    if (existing) throw new Error("Service code already exists");

    return await prisma.service.create({
      data
    });
  }

  /**
   * Update Service
   */
  async update(id: number, data: { name?: string; code?: string; description?: string; icon?: string }) {
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