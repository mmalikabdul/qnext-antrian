import { prisma } from "../lib/prisma";
import { emitQueueUpdate } from "../lib/socket";

export class HolidayService {
  async findAll() {
    return await prisma.holiday.findMany({
      orderBy: { date: 'asc' }
    });
  }

  async create(data: { date: string; description: string; isActive?: boolean }) {
    const holidayDate = new Date(data.date);
    // Cek duplikat
    const existing = await prisma.holiday.findUnique({
        where: { date: holidayDate }
    });
    if (existing) throw new Error("Tanggal libur sudah ada.");

    const res = await prisma.holiday.create({
      data: {
        date: holidayDate,
        description: data.description,
        isActive: data.isActive ?? true
      }
    });
    
    emitQueueUpdate({ type: "HOLIDAY_UPDATE" });
    return res;
  }

  async update(id: number, data: { date?: string; description?: string; isActive?: boolean }) {
    const updateData: any = { ...data };
    if (data.date) {
        updateData.date = new Date(data.date);
    }
    const res = await prisma.holiday.update({
      where: { id },
      data: updateData
    });

    emitQueueUpdate({ type: "HOLIDAY_UPDATE" });
    return res;
  }

  async delete(id: number) {
    const res = await prisma.holiday.delete({
      where: { id }
    });

    emitQueueUpdate({ type: "HOLIDAY_UPDATE" });
    return res;
  }

  // Cek apakah hari ini libur
  async isHoliday(date: Date = new Date()): Promise<boolean> {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    
    const holiday = await prisma.holiday.findFirst({
        where: {
            date: today,
            isActive: true
        }
    });
    return !!holiday;
  }
}
