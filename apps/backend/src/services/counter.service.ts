import { prisma } from "../lib/prisma";
import { emitQueueUpdate } from "../lib/socket";
import { CounterStatus } from "@prisma/client";

export class CounterService {
  async getAll() {
    return await prisma.counter.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async create(data: { name: string; label?: string }) {
    return await prisma.counter.create({
      data
    });
  }

  async update(id: number, data: { name?: string; label?: string; status?: CounterStatus }) {
    const updatedCounter = await prisma.counter.update({
      where: { id },
      data
    });
    
    emitQueueUpdate({ type: "COUNTER_UPDATE", counter: updatedCounter });
    return updatedCounter;
  }

  async delete(id: number) {
    return await prisma.counter.delete({
      where: { id }
    });
  }
}
