'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Users,
  Monitor,
  LogIn,
  Ticket,
} from 'lucide-react';
import { useQueue } from '@/context/queue-context';
import type { Service } from '@/context/queue-context';
import TicketModal from '@/components/ticket-modal';
import BkpmLogo from '@/components/icons/bkpm-logo';
import Link from 'next/link';

const services: Service[] = [
  { id: 'A', name: 'Layanan Konsultasi', icon: <Users className="h-12 w-12" /> },
  {
    id: 'B',
    name: 'Pengajuan Perizinan',
    icon: <Briefcase className="h-12 w-12" />,
  },
  {
    id: 'C',
    name: 'Layanan Prioritas',
    icon: <Ticket className="h-12 w-12" />,
  },
];

export default function KioskPage() {
  const { addTicket } = useQueue();
  const [selectedTicket, setSelectedTicket] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleServiceSelection = (service: Service) => {
    const newTicket = addTicket(service);
    setSelectedTicket(newTicket.number);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background font-sans">
        <header className="bg-card shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <BkpmLogo className="h-10 w-10 text-primary" />
                <h1 className="text-2xl font-bold text-primary tracking-tight">
                  BKPM Q
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/monitor">
                    <Monitor className="mr-2 h-4 w-4" />
                    Monitor
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Staff/Admin Login
                  </Link>
                </Button>
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
            {services.map((service) => (
              <Card
                key={service.id}
                className="text-center transform hover:-translate-y-2 transition-transform duration-300 ease-in-out cursor-pointer shadow-lg hover:shadow-xl rounded-lg overflow-hidden"
                onClick={() => handleServiceSelection(service)}
              >
                <CardHeader className="bg-primary/5 p-8">
                  <div className="mx-auto text-primary">{service.icon}</div>
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
            ))}
          </div>
        </main>

        <footer className="text-center py-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} BKPM Q. All rights reserved.
        </footer>
      </div>
      {selectedTicket && (
        <TicketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ticketNumber={selectedTicket}
        />
      )}
    </>
  );
}
