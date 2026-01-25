import { prisma } from "../lib/prisma";
import { TicketStatus } from "@prisma/client";
import { emitQueueUpdate } from "../lib/socket";
import { formatTicketNumber, getStartOfToday } from "../utils/ticket.util";

import * as ExcelJS from 'exceljs';

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
  async createTicket(serviceId: number, bookingId?: number) {
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
          bookingId, // Link ke Booking jika ada
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
          startedAt: new Date(), // Mulai hitung waktu layanan
          updatedAt: new Date() 
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
        status: TicketStatus.DONE,
        finishedAt: new Date() // Selesai dilayani
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
   * Ambil Semua Tiket (Pagination & Filter)
   */
  async getAll(page: number, limit: number, startDate?: string, endDate?: string, serviceId?: number, counterId?: number) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};

    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        whereClause.createdAt = {
            gte: start,
            lte: end
        };
    }

    if (serviceId) {
        whereClause.serviceId = serviceId;
    }

    if (counterId) {
        whereClause.counterId = counterId;
    }

    const [data, total] = await Promise.all([
        prisma.ticket.findMany({
            where: whereClause,
            include: {
                service: true,
                counter: true,
                booking: true
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.ticket.count({ where: whereClause })
    ]);

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
  }

  /**
   * Export Laporan Tiket ke Excel
   */
  async exportToExcel(startDate?: string, endDate?: string, serviceId?: number, counterId?: number) {
    const whereClause: any = {};

    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        whereClause.createdAt = {
            gte: start,
            lte: end
        };
    }

    if (serviceId) whereClause.serviceId = serviceId;
    if (counterId) whereClause.counterId = counterId;

    const tickets = await prisma.ticket.findMany({
        where: whereClause,
        include: {
            service: true,
            counter: true,
            booking: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // Buat Workbook Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Antrian');

    // Definisi Kolom
    sheet.columns = [
        { header: 'Waktu Dibuat', key: 'createdAt', width: 20 },
        { header: 'Nomor Tiket', key: 'number', width: 15 },
        { header: 'Kode Booking', key: 'bookingCode', width: 20 },
        { header: 'Nama Perusahaan', key: 'namaPerusahaan', width: 30 },
        { header: 'NIB', key: 'nib', width: 20 },
        { header: 'Layanan', key: 'service', width: 25 },
        { header: 'Loket', key: 'counter', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Jenis Booking', key: 'bookingType', width: 15 },
        { header: 'Kendala', key: 'issueDescription', width: 40 },
        { header: 'Waktu Mulai', key: 'startedAt', width: 20 },
        { header: 'Waktu Selesai', key: 'finishedAt', width: 20 },
        { header: 'Durasi (Menit)', key: 'duration', width: 15 },
    ];

    // Mapping Status Tiket ke Bahasa Indonesia (Opsional, agar konsisten dengan Booking)
    const ticketStatusMap: Record<string, string> = {
        WAITING: 'Menunggu',
        SERVING: 'Dilayani',
        DONE: 'Selesai',
        SKIPPED: 'Dilewati'
    };

    tickets.forEach(t => {
        let duration = '-';
        if (t.startedAt && t.finishedAt) {
            const diffMs = t.finishedAt.getTime() - t.startedAt.getTime();
            duration = (diffMs / 60000).toFixed(2); // Menit dengan 2 desimal
        }

        sheet.addRow({
            createdAt: t.createdAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
            number: t.number,
            bookingCode: t.booking?.code || '-',
            namaPerusahaan: t.booking?.namaPerusahaan || '-',
            nib: t.booking?.nib || '-',
            service: t.service.name,
            counter: t.counter?.name || '-',
            status: ticketStatusMap[t.status] || t.status,
            bookingType: t.booking?.jenisBooking || '-',
            issueDescription: t.booking?.issueDescription || '-',
            startedAt: t.startedAt ? t.startedAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-',
            finishedAt: t.finishedAt ? t.finishedAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-',
            duration: duration
        });
    });

    sheet.getRow(1).font = { bold: true };
    return await workbook.xlsx.writeBuffer();
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
