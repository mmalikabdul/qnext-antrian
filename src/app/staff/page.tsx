'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueue } from '@/context/queue-context';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Briefcase,
  LogOut,
  PhoneCall,
  CheckCircle,
  Clock,
  Ticket as TicketIcon,
} from 'lucide-react';
import BkpmLogo from '@/components/icons/bkpm-logo';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';


const serviceIcons: Record<string, React.ReactNode> = {
    A: <Users className="h-6 w-6 text-primary" />,
    B: <Briefcase className="h-6 w-6 text-primary" />,
    C: <TicketIcon className="h-6 w-6 text-primary" />,
    DEFAULT: <TicketIcon className="h-6 w-6 text-primary" />,
};

const getServiceIcon = (serviceId: string) => {
    const firstChar = serviceId.charAt(0).toUpperCase();
    return serviceIcons[firstChar] || serviceIcons.DEFAULT;
}


const COUNTER_NUMBER = 1; // Static counter number for this demo staff member

export default function StaffPage() {
  const router = useRouter();
  const { state, callNextTicket, completeTicket, recallTicket, logoutUser } = useQueue();
  const { tickets, nowServing, services } = state;
  const { toast } = useToast();
  const auth = getAuth(app);

  const currentServingTicket = nowServing && nowServing.counter === COUNTER_NUMBER ? nowServing.ticket : null;

  const waitingCountByService = services.reduce((acc, service) => {
    acc[service.id] = tickets.filter(
      (t) => t.service.id === service.id && t.status === 'waiting'
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const handleLogout = async () => {
    try {
        await auth.signOut();
        logoutUser();
        toast({ title: "Logout Berhasil", description: "Anda telah keluar dari sesi." });
        router.push('/login');
    } catch (error) {
        toast({ title: "Error", description: "Gagal melakukan logout.", variant: "destructive" });
    }
  };

  const handleCallNext = async (serviceId: string) => {
    if(currentServingTicket) {
      toast({ title: "Perhatian", description: "Selesaikan tiket yang sedang dilayani terlebih dahulu.", variant: 'destructive'});
      return;
    }
    await callNextTicket(serviceId, COUNTER_NUMBER);
  };
  
  const handleComplete = async () => {
    if (currentServingTicket) {
        await completeTicket(currentServingTicket.id);
    }
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <BkpmLogo className="h-10 w-10 text-primary" />
              <h1 className="text-2xl font-bold text-primary tracking-tight">
                Panel Petugas - Loket {COUNTER_NUMBER}
              </h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Kontrol Antrian</CardTitle>
                <CardDescription>
                  Panggil antrian berikutnya berdasarkan layanan.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card key={service.id} className="p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">Antrian: {waitingCountByService[service.id] || 0}</p>
                        </div>
                        {getServiceIcon(service.id)}
                    </div>
                    <Button
                      onClick={() => handleCallNext(service.id)}
                      disabled={(waitingCountByService[service.id] || 0) === 0 || !!currentServingTicket}
                      className="w-full mt-4"
                    >
                      <PhoneCall className="mr-2 h-4 w-4" />
                      Panggil Berikutnya
                    </Button>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="shadow-lg sticky top-28">
              <CardHeader>
                <CardTitle>Sedang Dilayani</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {currentServingTicket ? (
                  <div className="space-y-4">
                    <p className="text-6xl font-extrabold text-primary">
                      {currentServingTicket.number}
                    </p>
                    <p className="text-muted-foreground font-medium">
                      {currentServingTicket.service.name}
                    </p>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      Dipanggil pada:{' '}
                      {new Date(currentServingTicket.timestamp).toLocaleTimeString('id-ID')}
                    </div>
                    <div className="pt-4 space-y-2">
                       <Button onClick={recallTicket} size="lg" variant="secondary" className="w-full">
                        Panggil Ulang
                      </Button>
                      <Button onClick={handleComplete} size="lg" className="w-full">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Selesai Melayani
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">
                      Tidak ada antrian yang sedang dilayani.
                    </p>
                    <p className="text-sm text-muted-foreground/80 mt-2">
                        Pilih "Panggil Berikutnya" dari salah satu layanan.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
