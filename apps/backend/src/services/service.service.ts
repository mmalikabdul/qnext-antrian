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
  async create(data: { name: string; code: string; description?: string }) {
    const existing = await prisma.service.findUnique({ where: { code: data.code } });
    if (existing) throw new Error("Service code already exists");

    return await prisma.service.create({
      data
    });
  }

  /**
   * Update Service
   */
  async update(id: number, data: { name?: string; code?: string; description?: string }) {
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
    // Cek apakah ada tiket terkait?
    // Jika prisma schema RESTRICT, ini akan error.
    // Opsional: Hapus tiket terkait atau tolak penghapusan.
    // Di schema: on DELETE RESTRICT. Jadi akan error jika masih ada tiket.
    // Kita biarkan error agar user tahu layanan masih dipakai, atau kita bisa force delete (bahaya untuk data reporting).
    
    // Untuk amannya, kita coba delete.
    return await prisma.service.delete({
      where: { id }
    });
  }
}
