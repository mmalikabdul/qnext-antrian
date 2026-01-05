import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";

export class UserService {
  /**
   * Mengambil semua user (Admin & Staff)
   */
  async findAll() {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        counters: true,
        createdAt: true,
        updatedAt: true
        // Password tidak direturn demi keamanan
      }
    });
  }

  /**
   * Membuat User Baru (Staff/Admin)
   * Logika mirip dengan register, tapi untuk penggunaan internal/admin
   */
  async create(data: { email: string; passwordRaw: string; name: string; role: Role; counters?: number[] }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("Email already exists");

    const hashedPassword = await Bun.password.hash(data.passwordRaw);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        counters: data.counters || []
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        counters: true,
        createdAt: true
      }
    });

    return newUser;
  }

  /**
   * Update User
   */
  async update(id: number, data: { name?: string; role?: Role; counters?: number[]; passwordRaw?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("User not found");

    const updateData: any = {
      name: data.name,
      role: data.role,
      counters: data.counters
    };

    // Update password hanya jika dikirim
    if (data.passwordRaw) {
      updateData.password = await Bun.password.hash(data.passwordRaw);
    }

    // Hapus field undefined agar tidak menimpa data lama dengan null/undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        counters: true,
        updatedAt: true
      }
    });
  }

  /**
   * Hapus User
   */
  async delete(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("User not found");

    // Hapus log auth terkait user ini dulu (jika cascade delete tidak diset di DB)
    // Tapi biasanya di schema prisma relation bisa handle, kita coba delete user langsung.
    // Jika ada foreign key error, kita perlu hapus child record dulu. 
    // Di schema.prisma: AuthLog refer ke User. Kita asumsikan perlu hapus log dulu atau biarkan error jika ada relasi restrict.
    // Untuk amannya kita hapus log dulu.
    
    await prisma.authLog.deleteMany({
      where: { userId: id }
    });

    return await prisma.user.delete({
      where: { id }
    });
  }
}
