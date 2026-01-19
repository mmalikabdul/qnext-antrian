import { prisma } from "../lib/prisma";
import { BookingStatus } from "@prisma/client";
import { TicketService } from "./ticket.service";

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
    const existingBookings = await prisma.booking.count({
      where: {
        serviceId,
        bookingDate: bookingDate,
        status: { not: BookingStatus.CANCELLED }
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
    nib?: string,
    namaPerusahaan?: string,
    idProfileOss?: string
  ) {
    // 1. Cek Availability dulu
    const check = await this.checkAvailability(serviceId, dateStr);
    if (!check.available) {
      throw new Error("Kuota penuh untuk tanggal tersebut.");
    }

    const bookingDate = new Date(dateStr);

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
        nib,
        namaPerusahaan,
        idProfileOss,
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

    // 5. Jika Lolos -> Cetak Tiket
    const ticket = await this.ticketService.createTicket(serviceId);

    // 6. Update Status Booking jadi USED
    await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.USED }
    });

    return ticket;
  }
}
