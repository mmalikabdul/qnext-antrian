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
  Building,
  SkipForward,
} from 'lucide-react';
import BkpmLogo from '@/components/icons/bkpm-logo';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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


export default function StaffPage() {
  const router = useRouter();
  const { state, callNextTicket, completeTicket, recallTicket, skipTicket, logoutUser } = useQueue();
  const { tickets, nowServing, services, currentUser, counters, authLoaded } = state;
  const { toast } = useToast();
  const auth = getAuth(app);
  
  const [activeCounterId, setActiveCounterId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (authLoaded && !currentUser) {
        router.push('/login');
    }
    if (currentUser && currentUser.counters && currentUser.counters.length > 0) {
        setActiveCounterId(currentUser.counters[0]);
    }
  }, [currentUser, authLoaded, router]);

  const staffCounters = React.useMemo(() => {
    return counters.filter(c => currentUser?.counters?.includes(c.id));
  }, [counters, currentUser]);

  const currentServingTicket = nowServing && nowServing.counter === activeCounterId ? nowServing.ticket : null;
  
  const servicesForActiveCounter = React.useMemo(() => {
      if (!activeCounterId) return [];
      return services.filter(service => service.servingCounters?.includes(activeCounterId));
  }, [services, activeCounterId]);

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
    if (!activeCounterId) {
        toast({ title: "Error", description: "Pilih loket aktif terlebih dahulu.", variant: 'destructive'});
        return;
    }
    if (currentServingTicket) {
      toast({ title: "Perhatian", description: "Selesaikan tiket yang sedang dilayani terlebih dahulu.", variant: 'destructive'});
      return;
    }
    await callNextTicket(serviceId, activeCounterId);
  };
  
  const handleComplete = async () => {
    if (currentServingTicket) {
        await completeTicket(currentServingTicket.id);
    }
  }

  const handleSkip = async () => {
    if (currentServingTicket) {
        await skipTicket(currentServingTicket.id);
    }
  }
  
  if (!authLoaded || !currentUser) {
      return <div className="flex items-center justify-center min-h-screen">Memuat...</div>
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <BkpmLogo className="h-10 w-10 text-primary" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-primary tracking-tight">Panel Petugas</h1>
                <p className="text-sm text-muted-foreground">{currentUser.name || currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
                {staffCounters.length > 0 && (
                     <div className="flex items-center space-x-2">
                         <Building className="h-5 w-5 text-muted-foreground"/>
                         <Select onValueChange={(val) => setActiveCounterId(Number(val))} defaultValue={activeCounterId?.toString()}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Pilih Loket Aktif" />
                            </SelectTrigger>
                            <SelectContent>
                                {staffCounters.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                )}
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
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
                  Panggil antrian berikutnya dari loket aktif: <span className="font-bold text-primary">{counters.find(c => c.id === activeCounterId)?.name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCounterId ? (
                    servicesForActiveCounter.length > 0 ? (
                        servicesForActiveCounter.map((service) => (
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
                        ))
                    ) : (
                        <p className="col-span-full text-muted-foreground">Tidak ada layanan yang diatur untuk loket ini.</p>
                    )
                ) : (
                     <p className="col-span-full text-muted-foreground">Pilih loket aktif untuk melihat layanan yang tersedia.</p>
                )}
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
                       <Button onClick={() => recallTicket(currentServingTicket.id)} size="lg" variant="secondary" className="w-full">
                        Panggil Ulang
                      </Button>
                      <Button onClick={handleSkip} size="lg" variant="outline" className="w-full">
                        <SkipForward className="mr-2 h-4 w-4" />
                        Lewati Antrian
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
                      Tidak ada antrian yang sedang dilayani di loket ini.
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
