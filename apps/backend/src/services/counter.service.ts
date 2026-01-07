import { prisma } from "../lib/prisma";

export class CounterService {
  async findAll() {
    return await prisma.counter.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async create(data: { name: string; label?: string }) {
    return await prisma.counter.create({
      data
    });
  }

  async update(id: number, data: { name?: string; label?: string }) {
    return await prisma.counter.update({
      where: { id },
      data
    });
  }

  async delete(id: number) {
    return await prisma.counter.delete({
      where: { id }
    });
  }
}
