import { prisma } from "../lib/prisma";
import { getStartOfToday } from "../utils/ticket.util";
import { HolidayService } from "./holiday.service";
import { emitQueueUpdate } from "../lib/socket";

export class ServiceService {
  private holidayService = new HolidayService();

  /**
   * Mengambil semua Service dengan info kuota hari ini & status operasional
   */
  async findAll() {
    const today = getStartOfToday();
    const services = await prisma.service.findMany({
      orderBy: { code: 'asc' }
    });

    const isHoliday = await this.holidayService.isHoliday(new Date());
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }); // "08:30"

    // Tambahkan hitungan tiket hari ini untuk masing-masing service
    return await Promise.all(services.map(async (service) => {
      const usedQuota = await prisma.ticket.count({
        where: {
          serviceId: service.id,
          createdAt: { gte: today }
        }
      });

      // Logic Check Open/Closed
      let isOpen = true;
      let statusMessage = "Buka";

      if (isHoliday) {
          isOpen = false;
          statusMessage = "Tutup (Hari Libur)";
      } else {
          // Check Jam Kerja
          // Asumsi format HH:mm, misal "08:00" <= "09:00" <= "15:00"
          if (nowStr < service.startTime || nowStr > service.endTime) {
              isOpen = false;
              statusMessage = "Tutup (Di luar jam kerja)";
          }
      }

      return { 
          ...service, 
          usedQuota, 
          isOpen, 
          statusMessage 
      };
    }));
  }

  /**
   * Membuat Service Baru
   */
  async create(data: { 
      name: string; 
      code: string; 
      description?: string; 
      icon?: string; 
      quota?: number;
      startTime?: string;
      endTime?: string;
  }) {
    const existing = await prisma.service.findUnique({ where: { code: data.code } });
    if (existing) throw new Error("Service code already exists");

    return await prisma.service.create({
      data: {
          ...data,
          startTime: data.startTime || "08:00",
          endTime: data.endTime || "15:00"
      }
    });
  }

  /**
   * Update Service
   */
  async update(id: number, data: { 
      name?: string; 
      code?: string; 
      description?: string; 
      icon?: string; 
      quota?: number;
      startTime?: string;
      endTime?: string;
  }) {
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

    const updatedService = await prisma.service.update({
      where: { id },
      data
    });

    emitQueueUpdate({ type: "SERVICE_UPDATE" });
    return updatedService;
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
