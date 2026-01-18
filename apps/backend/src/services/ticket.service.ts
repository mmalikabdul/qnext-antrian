import { prisma } from "../lib/prisma";
import { TicketStatus } from "@prisma/client";
import { emitQueueUpdate } from "../lib/socket";
import { formatTicketNumber, getStartOfToday } from "../utils/ticket.util";

export class TicketService {
  /**
   * Mengambil daftar tiket hari ini (Waiting & Serving)
   * Untuk ditampilkan di Monitoring/Staff Dashboard
   */
  async getTodayTickets() {
    const today = getStartOfToday();
    return await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: today
        }
      },
      include: {
        service: true,
        counter: true
      },
      orderBy: {
        id: 'asc' // Urutan masuk
      }
    });
  }

  /**
   * Mengambil tiket yang sedang dipanggil (Serving)
   * Untuk Display Layar
   */
  async getServingTickets() {
    const today = getStartOfToday();
    return await prisma.ticket.findMany({
      where: {
        createdAt: { gte: today },
        status: TicketStatus.SERVING
      },
      include: {
        service: true,
        counter: true
      },
      orderBy: {
        updatedAt: 'desc' // Yang baru dipanggil paling atas (atau sesuai kebutuhan display)
      }
    });
  }

  /**
   * Cetak Tiket Baru (Kiosk)
   */
  async createTicket(serviceId: number) {
    const today = getStartOfToday();
    
    // Gunakan Transaction agar sequence aman
    return await prisma.$transaction(async (tx) => {
      const service = await tx.service.findUnique({ where: { id: serviceId } });
      if (!service) throw new Error("Service not found");

      // Hitung jumlah tiket layanan ini hari ini untuk menentukan sequence
      const countToday = await tx.ticket.count({
        where: {
          serviceId,
          createdAt: { gte: today }
        }
      });

      // Cek Kuota (LOGIC LAMA: DI-SKIP DULU SESUAI REQUEST)
      // if (service.quota > 0 && countToday >= service.quota) {
      //   throw new Error(`Kuota untuk layanan ${service.name} sudah penuh (${service.quota}).`);
      // }

      const sequence = countToday + 1;
      const number = formatTicketNumber(sequence, service.code);

      const ticket = await tx.ticket.create({
        data: {
          serviceId,
          sequence,
          number,
          status: TicketStatus.WAITING
        },
        include: {
          service: true
        }
      });

      // --- RECORD STATISTIK HARIAN ---
      // Kita simpan/update statistik harian untuk keperluan reporting cepat & histori kuota
      await tx.serviceDailyStat.upsert({
        where: {
            date_serviceId: {
                date: today,
                serviceId: serviceId
            }
        },
        create: {
            date: today,
            serviceId: serviceId,
            quotaSnapshot: service.quota, // Simpan kuota saat ini sebagai histori
            totalTickets: 1
        },
        update: {
            totalTickets: { increment: 1 },
            // Opsional: Update quotaSnapshot jika ingin mengikuti perubahan terakhir hari ini
            quotaSnapshot: service.quota 
        }
      });
      // -------------------------------

      // Broadcast update ke semua client
      emitQueueUpdate({ type: "NEW_TICKET", ticket });
      
      return ticket;
    });
  }

  /**
   * Panggil Tiket Berikutnya (Staff)
   */
  async callNextTicket(serviceId: number, counterId: number, userId?: number) {
    const today = getStartOfToday();

    return await prisma.$transaction(async (tx) => {
      // 1. Cek apakah Counter ini sedang melayani tiket lain?
      const activeTicket = await tx.ticket.findFirst({
        where: {
          counterId,
          status: TicketStatus.SERVING,
          createdAt: { gte: today }
        }
      });

      if (activeTicket) {
        throw new Error(`Loket ini sedang melayani tiket ${activeTicket.number}. Selesaikan dulu.`);
      }

      // 2. Cari tiket WAITING tertua untuk service ini
      const nextTicket = await tx.ticket.findFirst({
        where: {
          serviceId,
          status: TicketStatus.WAITING,
          createdAt: { gte: today }
        },
        orderBy: {
          id: 'asc' // FIFO
        }
      });

      if (!nextTicket) {
        throw new Error("Tidak ada antrian menunggu untuk layanan ini.");
      }

      // 3. Update Status -> SERVING
      const updatedTicket = await tx.ticket.update({
        where: { id: nextTicket.id },
        data: {
          status: TicketStatus.SERVING,
          counterId,
          updatedAt: new Date() // Waktu panggil
        },
        include: {
          service: true,
          counter: true
        }
      });

      // Broadcast PANGGILAN
      emitQueueUpdate({ type: "CALL_TICKET", ticket: updatedTicket });

      return updatedTicket;
    });
  }

  /**
   * Panggil Ulang (Recall)
   */
  async recallTicket(ticketId: number) {
     const ticket = await prisma.ticket.findUnique({
         where: { id: ticketId },
         include: { service: true, counter: true }
     });
     
     if (!ticket) throw new Error("Ticket not found");
     if (ticket.status !== TicketStatus.SERVING) throw new Error("Hanya tiket yang sedang dilayani yang bisa dipanggil ulang.");

     // Broadcast RECALL (Frontend akan mainkan suara)
     emitQueueUpdate({ type: "RECALL_TICKET", ticket });
     return ticket;
  }

  /**
   * Selesaikan Tiket (Done)
   */
  async completeTicket(ticketId: number) {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.DONE
      }
    });
    
    emitQueueUpdate({ type: "COMPLETE_TICKET", ticketId });
    return ticket;
  }

  /**
   * Skip Tiket (Tidak hadir)
   */
  async skipTicket(ticketId: number) {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.SKIPPED
      }
    });

    emitQueueUpdate({ type: "SKIP_TICKET", ticketId });
    return ticket;
  }

  /**
   * Laporan Tiket (Report)
   */
  async getReportData(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        service: true,
        counter: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }
}
