import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";

export class AuthService {
  /**
   * Login User
   * Mengembalikan user jika valid, throw error jika invalid
   */
  async login(email: string, passwordRaw: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await Bun.password.verify(passwordRaw, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    // Return user tanpa password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Register User Baru (Biasanya hanya Admin yang bisa tambah staff)
   */
  async register(data: { email: string; passwordRaw: string; name: string; role: Role; counters?: number[] }) {
    // Cek duplikat
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
      }
    });

    const { password, ...result } = newUser;
    return result;
  }
}
