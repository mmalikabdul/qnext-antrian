'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useQueue } from '@/context/queue-context';
import type { Service, Ticket } from '@/context/queue-context';
import { TicketModal } from '@/components/ticket-modal';
import Image from 'next/image';

const getIcon = (iconName: string): React.ComponentType<LucideIcons.LucideProps> => {
    // @ts-ignore
    return LucideIcons[iconName] || LucideIcons['Ticket'];
}

export default function KioskPage() {
  const { state, addTicket } = useQueue();
  const { services } = state;
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [dateTime, setDateTime] = useState({ date: '', time: '' });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setDateTime({
        date: now.toLocaleDateString('id-ID', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }),
        time: now.toLocaleTimeString('id-ID', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleServiceSelection = async (service: Service) => {
    const newTicket = await addTicket(service);
    if (newTicket) {
      setSelectedTicket(newTicket);
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background font-sans">
        <header className="bg-card shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-24">
              <div className="flex items-center">
                <Image
                  src="/qnext-logo.svg"
                  alt="Qnext Logo"
                  width={200}
                  height={62}
                  priority
                />
                <h1 className="text-xl font-bold text-primary ml-6">LAYANAN SISTEM ANTRIAN PUBLIK</h1>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-muted-foreground">{dateTime.time}</p>
                <p className="text-sm text-muted-foreground">{dateTime.date}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-primary tracking-tight">
              Selamat Datang
            </h2>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
              Silakan pilih layanan yang Anda butuhkan untuk mendapatkan nomor
              antrian.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = getIcon(service.icon);
              return (
                 <Card
                  key={service.id}
                  className="text-center transform hover:-translate-y-2 transition-transform duration-300 ease-in-out cursor-pointer shadow-lg hover:shadow-xl rounded-lg overflow-hidden"
                  onClick={() => handleServiceSelection(service)}
                >
                  <CardHeader className="bg-primary/5 p-8">
                    <div className="mx-auto text-primary">
                       <Icon className="h-12 w-12" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardTitle className="text-xl font-semibold text-primary">
                      {service.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Klik untuk mengambil nomor antrian
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </main>

        <footer className="text-center py-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Q-NEXT. All rights reserved.
        </footer>
      </div>
      {selectedTicket && (
        <TicketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ticket={selectedTicket}
        />
      )}
    </>
  );
}
