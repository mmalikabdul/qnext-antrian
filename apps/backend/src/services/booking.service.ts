import { prisma } from "../lib/prisma";
import { BookingStatus, BookingType } from "@prisma/client";
import { TicketService } from "./ticket.service";
import * as ExcelJS from 'exceljs';

export class BookingService {
  private ticketService = new TicketService();

  /**
   * Cek Ketersediaan Slot untuk Tanggal Tertentu
   */
  async checkAvailability(serviceId: number, dateStr: string) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new Error("Layanan tidak ditemukan");

    // Jika quota 0 = Unlimited
    if (service.quota === 0) return { available: true, remaining: 9999, quota: 0 };

    // Format tanggal ke jam 00:00:00 WIB
    const bookingDate = new Date(dateStr); 
    // Catatan: Pastikan input dateStr sudah format YYYY-MM-DD
    
    // Hitung booking yang sudah CONFIRMED/PENDING/USED pada tanggal tersebut
    // Kita exclude CANCELLED
    // DAN HANYA HITUNG YANG ONLINE (Sesuai request: Offline tidak memotong kuota)
    const existingBookings = await prisma.booking.count({
      where: {
        serviceId,
        bookingDate: bookingDate,
        status: { not: BookingStatus.CANCELLED },
        jenisBooking: BookingType.ONLINE 
      }
    });

    const remaining = service.quota - existingBookings;
    
    return {
      available: remaining > 0,
      remaining: Math.max(0, remaining),
      quota: service.quota
    };
  }

  /**
   * Buat Booking Baru
   */
  async createBooking(
    serviceId: number, 
    dateStr: string, 
    issueDescription?: string, 
    fileUrl?: string,
    email?: string,
    nama?: string,
    nib?: string,
    namaPerusahaan?: string,
    idProfileOss?: string,
    jenisBooking: BookingType = BookingType.ONLINE
  ) {
    let bookingDate: Date;

    // LOGIKA TANGGAL & KUOTA
    if (jenisBooking === BookingType.OFFLINE) {
        // Jika OFFLINE (Greeter), paksa tanggal menjadi HARI INI (Server Time)
        const today = new Date();
        // Set ke jam 00:00:00 untuk konsistensi penyimpanan
        bookingDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // Pengecekan Kuota DI-SKIP untuk Offline (Bisa overbook / unlimited by Greeter)
    } else {
        // Jika ONLINE, gunakan tanggal request dan CEK KUOTA
        bookingDate = new Date(dateStr);
        
        const check = await this.checkAvailability(serviceId, dateStr);
        if (!check.available) {
          throw new Error("Kuota penuh untuk tanggal tersebut.");
        }
    }

    // 2. Generate Booking Code (e.g., BOOK-TIMESTAMP-RANDOM)
    // Agar unik dan simple: B-[SERVICE_CODE]-[RANDOM 4 DIGIT]
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if(!service) throw new Error("Service not found");

    const randomStr = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit random
    const timestampCode = Date.now().toString().slice(-4); // 4 digit timestamp tail
    const code = `B${service.code}-${randomStr}${timestampCode}`;

    // 3. Simpan ke DB
    return await prisma.booking.create({
      data: {
        code,
        serviceId,
        bookingDate,
        issueDescription,
        fileUrl,
        email,
        nama,
        nib,
        namaPerusahaan,
        idProfileOss,
        jenisBooking,
        status: BookingStatus.PENDING
      },
      include: {
        service: true
      }
    });
  }

  /**
   * Redeem Booking (Dipanggil Kiosk)
   * Validasi kode, cocokkan dengan hari ini, lalu cetak tiket.
   */
  async redeemBooking(code: string, serviceId: number) {
    // 1. Cari Booking
    const booking = await prisma.booking.findUnique({
      where: { code },
      include: { service: true }
    });

    if (!booking) throw new Error("Kode booking tidak ditemukan.");

    // 2. Validasi Service
    if (booking.serviceId !== serviceId) {
        throw new Error(`Kode ini untuk layanan ${booking.service.name}, bukan layanan yang dipilih.`);
    }

    // 3. Validasi Status
    if (booking.status === BookingStatus.USED) throw new Error("Kode booking sudah digunakan.");
    if (booking.status === BookingStatus.CANCELLED) throw new Error("Kode booking telah dibatalkan.");
    if (booking.status === BookingStatus.EXPIRED) throw new Error("Kode booking kedaluwarsa.");

    // 4. Validasi Tanggal (Harus HARI INI)
    // Gunakan logika getStartOfToday yang sama dengan TicketUtil agar konsisten
    const now = new Date();
    const jakartaFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const parts = jakartaFormatter.formatToParts(now);
    const todayStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
    
    // Bandingkan string YYYY-MM-DD
    const bookingDateStr = booking.bookingDate.toISOString().split('T')[0];
    
    // Perbaikan: bookingDate di DB disimpan sebagai UTC timestamp yang merepresentasikan 00:00 WIB.
    // Jika kita simpan "2026-01-14T00:00:00+07:00", Prisma akan simpan "2026-01-13T17:00:00Z".
    // Jadi saat di-fetch, kita harus hati-hati membandingkannya.
    // Solusi paling aman: Cek apakah bookingDate berada di antara StartOfDay dan EndOfDay hari ini.
    
    // Kita asumsikan createBooking menyimpan tanggal dengan benar (Timezone aware).
    // Tapi untuk simplifikasi di sini, kita cek range waktu.
    
    // Logic: Apakah bookingDate == Hari Ini?
    // Karena kita menyimpan bookingDate sebagai "Midnight Jakarta", kita bisa cek apakah bookingDate == getStartOfToday()
    // Tapi karena masalah parsing JS Date yang kadang ribet, kita pakai range toleransi 24 jam.
    
    // Alternatif sederhana:
    // Kita ambil string YYYY-MM-DD dari bookingDate (di konversi ke Jakarta Time)
    const bookingDateInJakarta = new Intl.DateTimeFormat('en-CA', { // en-CA output YYYY-MM-DD
        timeZone: 'Asia/Jakarta'
    }).format(booking.bookingDate);

    const todayInJakarta = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta'
    }).format(now);

    if (bookingDateInJakarta !== todayInJakarta) {
        throw new Error(`Booking ini untuk tanggal ${bookingDateInJakarta}, hari ini tanggal ${todayInJakarta}.`);
    }

    // 5. Jika Lolos -> Cetak Tiket (Link ke Booking ID)
    const ticket = await this.ticketService.createTicket(serviceId, booking.id);

    // 6. Update Status Booking jadi USED dan catat Check-In
    await prisma.booking.update({
        where: { id: booking.id },
        data: { 
            status: BookingStatus.USED,
            checkInDate: new Date()
        }
    });

    return ticket;
  }

  /**
   * Helper Private: Build Where Clause
   */
  private buildWhereClause(search?: string, status?: string, date?: string) {
    const whereClause: any = {};

    // Filter Search
    if (search) {
        whereClause.OR = [
            { code: { contains: search, mode: 'insensitive' } },
            { namaPerusahaan: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { nib: { contains: search, mode: 'insensitive' } },
        ];
    }

    // Filter Status
    if (status && status !== 'ALL') {
        whereClause.status = status;
    }

    // Filter Date (createdAt)
    if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        whereClause.createdAt = {
            gte: start,
            lte: end
        };
    }

    return whereClause;
  }

  /**
   * Ambil Semua Booking (Untuk Admin - Daftar Tamu)
   */
  async getAll(page: number = 1, limit: number = 10, search?: string, status?: string, date?: string) {
    const skip = (page - 1) * limit;
    const whereClause = this.buildWhereClause(search, status, date);

    const [data, total] = await Promise.all([
        prisma.booking.findMany({
            where: whereClause,
            include: { service: true, ticket: true },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.booking.count({ where: whereClause })
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
   * Export Data ke Excel
   */
  async exportToExcel(search?: string, status?: string, date?: string) {
    const whereClause = this.buildWhereClause(search, status, date);

    // Ambil SEMUA data (tanpa skip/take)
    const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: { service: true, ticket: true },
        orderBy: { createdAt: 'desc' }
    });

    // Buat Workbook Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Daftar Tamu');

    // Definisi Kolom
    sheet.columns = [
        { header: 'ID Booking', key: 'code', width: 20 },
        { header: 'No. Tiket', key: 'ticketNumber', width: 15 },
        { header: 'Nama Tamu', key: 'nama', width: 25 }, // Kolom Baru
        { header: 'Nama Perusahaan', key: 'namaPerusahaan', width: 30 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'NIB', key: 'nib', width: 20 },
        { header: 'Layanan', key: 'service', width: 20 },
        { header: 'Jenis Booking', key: 'jenisBooking', width: 15 }, // Kolom Baru
        { header: 'Status Booking', key: 'status', width: 15 },
        { header: 'Status Terlayani', key: 'ticketStatus', width: 20 },
        { header: 'Deskripsi Kendala', key: 'issueDescription', width: 40 },
        { header: 'Tanggal Booking', key: 'bookingDate', width: 15 },
        { header: 'Waktu Check-In', key: 'checkInDate', width: 20 },
        { header: 'Waktu Dibuat', key: 'createdAt', width: 20 },
    ];

    // Mapping Status Tiket ke Bahasa Indonesia
    const ticketStatusMap: Record<string, string> = {
        WAITING: 'Menunggu Dipanggil',
        SERVING: 'Dilayani',
        DONE: 'Selesai Dilayani',
        SKIPPED: 'Dilewati'
    };

    // Isi Baris
    bookings.forEach(b => {
        sheet.addRow({
            code: b.code,
            ticketNumber: b.ticket?.number || '-',
            nama: b.nama || '-',
            namaPerusahaan: b.namaPerusahaan || '-',
            email: b.email || '-',
            nib: b.nib || '-',
            service: b.service.name,
            jenisBooking: b.jenisBooking,
            status: b.status,
            ticketStatus: b.ticket ? (ticketStatusMap[b.ticket.status] || b.ticket.status) : '-',
            issueDescription: b.issueDescription || '-',
            bookingDate: b.bookingDate.toISOString().split('T')[0],
            checkInDate: b.checkInDate ? b.checkInDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-',
            createdAt: b.createdAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        });
    });

    // Styling Header Sederhana
    sheet.getRow(1).font = { bold: true };
    
    // Return Buffer
    return await workbook.xlsx.writeBuffer();
  }
}
