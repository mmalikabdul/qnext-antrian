'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { KioskLayout } from '@/features/kiosk/components/KioskLayout';
import { TicketModal } from '@/features/kiosk/components/TicketModal';
import { kioskService } from '@/features/kiosk/services/kiosk.service';
import { bookingService } from '@/features/booking/services/booking.service';
import { Service, Ticket } from '@/types/queue';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import { holidayService } from "@/features/admin/services/holiday.service";

const getIcon = (iconName: string): React.ComponentType<LucideIcons.LucideProps> => {
    // @ts-ignore
    return LucideIcons[iconName] || LucideIcons['Ticket'];
}

export default function KioskPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Modals
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  const [bookingCode, setBookingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTodayHoliday, setIsTodayHoliday] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    checkHoliday();

    // Socket Connection
    if (!socket.connected) socket.connect();

    const handleUpdate = (data: any) => {
        // Jika ada update layanan atau antrian, refresh data
        // Kita refresh untuk memastikan status Open/Close terupdate
        fetchServices();
        
        // Cek ulang hari libur juga
        checkHoliday();
    };

    socket.on("queue-updated", handleUpdate);

    return () => {
        socket.off("queue-updated", handleUpdate);
        // Jangan disconnect global socket jika dipakai page lain, 
        // tapi untuk kiosk dedicated bisa dipertimbangkan. 
        // Biarkan connected untuk performa.
    };
  }, []);

  const fetchServices = () => {
    kioskService.getServices()
        .then(setServices)
        .catch(err => console.error("Failed to load services", err));
  }

  const checkHoliday = async () => {
    try {
        const holidays = await holidayService.getActiveHolidays();
        const now = new Date();
        const isHoliday = holidays.some(h => 
            h.getFullYear() === now.getFullYear() &&
            h.getMonth() === now.getMonth() &&
            h.getDate() === now.getDate()
        );
        setIsTodayHoliday(isHoliday);
    } catch (e) {
        console.error("Failed to check holiday", e);
    }
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setBookingCode(''); // Reset input
    setIsBookingModalOpen(true);
  };

  // Proses dengan Kode Booking
  const handleBookingRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !bookingCode) return;

    setIsLoading(true);
    try {
        // Panggil endpoint redeem booking
        // Asumsi endpoint mengembalikan object { ticket: Ticket }
        const res: any = await bookingService.redeemBooking(bookingCode, selectedService.id);
        const newTicket = res.ticket; // Sesuaikan dengan response controller
        
        finishTransaction(newTicket);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Booking Tidak Valid",
            description: error.message
        });
    } finally {
        setIsLoading(false);
    }
  };

  // Proses Tanpa Booking (Walk-in)
  const handleWalkIn = async () => {
    if (!selectedService) return;
    setIsLoading(true);
    try {
        const newTicket = await kioskService.createTicket(selectedService.id);
        finishTransaction(newTicket);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Gagal Mengambil Tiket",
            description: error.message
        });
    } finally {
        setIsLoading(false);
    }
  };

  const finishTransaction = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsBookingModalOpen(false); // Tutup input booking
    setIsTicketModalOpen(true); // Buka tiket hasil
    fetchServices(); // Refresh data (meski kuota visual di-hide, good practice)
  };

  return (
    <KioskLayout>
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-primary tracking-tight">
              {isTodayHoliday ? "Layanan Libur" : "Selamat Datang"}
            </h2>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
              {isTodayHoliday 
                ? "Mohon maaf, hari ini layanan antrian sedang tidak beroperasi karena hari libur." 
                : "Silakan pilih layanan yang Anda butuhkan."}
            </p>
          </div>

          {services.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">Memuat Layanan...</p>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
                {services.map((service) => {
                // @ts-ignore
                const Icon = getIcon(service.icon || 'Ticket');
                const isClosed = service.isOpen === false || isTodayHoliday;
                
                return (
                    <button
                        key={service.id}
                        onClick={() => !isClosed && handleServiceClick(service)}
                        disabled={isLoading || isClosed}
                        className={`group relative flex flex-col items-center justify-center p-8 bg-card rounded-xl shadow-md border-2 border-transparent transition-all duration-300 active:scale-95 
                            ${isClosed 
                                ? 'opacity-60 cursor-not-allowed bg-slate-100 border-slate-200' 
                                : 'hover:border-primary/50 hover:shadow-xl'
                            }
                        `}
                    >
                         <div className={`mb-6 p-4 rounded-full transition-colors duration-300 
                             ${isClosed ? 'bg-slate-200 text-slate-400' : 'bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground'}
                         `}>
                             <Icon className="h-12 w-12" />
                         </div>
                         <h3 className={`text-2xl font-bold mb-2 ${isClosed ? 'text-slate-500' : 'text-foreground'}`}>{service.name}</h3>
                         
                         {isClosed ? (
                             <div className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-xs font-medium mt-2">
                                {isTodayHoliday ? 'Tutup (Hari Libur)' : (service.statusMessage || 'Tutup')}
                             </div>
                         ) : (
                             <p className="text-muted-foreground text-sm mb-4">{service.description || 'Klik untuk ambil tiket'}</p>
                         )}
                    </button>
                )
                })}
            </div>
          )}

        {/* Loading Overlay */}
        {isLoading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                 <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
                     <Loader2 className="h-10 w-10 text-primary animate-spin" />
                     <p className="font-semibold">Memproses...</p>
                 </div>
            </div>
        )}

        {/* Modal Input Kode Booking */}
        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Masukkan Kode Booking</DialogTitle>
                    <DialogDescription>
                        Jika Anda sudah melakukan reservasi online, masukkan kode booking Anda.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleBookingRedeem} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Input 
                            placeholder="Contoh: BA-1234..." 
                            className="text-center text-xl tracking-widest uppercase"
                            value={bookingCode}
                            onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                            autoFocus
                        />
                    </div>
                    
                    <DialogFooter className="flex-col sm:flex-col gap-3">
                        <Button type="submit" size="lg" className="w-full" disabled={!bookingCode}>
                            Proses Booking
                        </Button>
                        
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Atau
                                </span>
                            </div>
                        </div>

                        <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleWalkIn}>
                            Cetak Tiket Langsung (Tanpa Booking)
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

      {/* Modal Tiket Berhasil */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        ticket={selectedTicket}
      />
    </KioskLayout>
  );
}