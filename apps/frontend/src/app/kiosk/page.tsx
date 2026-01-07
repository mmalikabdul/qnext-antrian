'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { KioskLayout } from '@/features/kiosk/components/KioskLayout';
import { TicketModal } from '@/features/kiosk/components/TicketModal';
import { kioskService } from '@/features/kiosk/services/kiosk.service';
import { Service, Ticket } from '@/types/queue';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const getIcon = (iconName: string): React.ComponentType<LucideIcons.LucideProps> => {
    // @ts-ignore
    return LucideIcons[iconName] || LucideIcons['Ticket'];
}

export default function KioskPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    kioskService.getServices()
        .then(setServices)
        .catch(err => console.error("Failed to load services", err));
  }, []);

  const handleServiceSelection = async (service: Service) => {
    setIsLoading(true);
    try {
        const newTicket = await kioskService.createTicket(service.id);
        setSelectedTicket(newTicket);
        setIsModalOpen(true);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Gagal Mengambil Tiket",
            description: error.message || "Terjadi kesalahan sistem."
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <KioskLayout>
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-primary tracking-tight">
              Selamat Datang
            </h2>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
              Silakan pilih layanan yang Anda butuhkan untuk mendapatkan nomor
              antrian.
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
                const Icon = getIcon(service.icon || 'Ticket'); // Pastikan service.icon ada di tipe data atau fetcher
                return (
                    <button
                        key={service.id}
                        onClick={() => handleServiceSelection(service)}
                        disabled={isLoading}
                        className="group relative flex flex-col items-center justify-center p-8 bg-card rounded-xl shadow-md border-2 border-transparent hover:border-primary/50 hover:shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                         <div className="mb-6 p-4 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                             <Icon className="h-12 w-12 text-primary group-hover:text-white" />
                         </div>
                         <h3 className="text-2xl font-bold text-foreground mb-2">{service.name}</h3>
                         <p className="text-muted-foreground text-sm">{service.description || 'Klik untuk ambil tiket'}</p>
                    </button>
                )
                })}
            </div>
          )}

        {isLoading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                 <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
                     <Loader2 className="h-10 w-10 text-primary animate-spin" />
                     <p className="font-semibold">Sedang Mencetak Tiket...</p>
                 </div>
            </div>
        )}

      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticket={selectedTicket}
      />
    </KioskLayout>
  );
}