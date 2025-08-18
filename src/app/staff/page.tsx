'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueue } from '@/context/queue-context';
import * as LucideIcons from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  PhoneCall,
  CheckCircle,
  Clock,
  Building,
  SkipForward,
  Ticket,
  ThumbsUp,
  XCircle,
  List,
} from 'lucide-react';
import QNextLogo from '@/components/icons/q-next-logo';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceStrict, differenceInSeconds, format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';


const getIcon = (iconName: string): React.ComponentType<LucideIcons.LucideProps> => {
    // @ts-ignore
    return LucideIcons[iconName] || LucideIcons['Ticket'];
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

  const { performance, handledTickets } = React.useMemo(() => {
    if (!currentUser || !tickets) {
      return { 
        performance: { servedCount: 0, skippedCount: 0, avgServiceTime: 0, waitingInQueue: 0 },
        handledTickets: []
      };
    }

    const myHandledTickets = tickets
      .filter(t => (t.status === 'done' || t.status === 'skipped') && t.servedBy === currentUser.name)
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));
    
    const servedTickets = myHandledTickets.filter(t => t.status === 'done');
    const skippedTickets = myHandledTickets.filter(t => t.status === 'skipped');
    
    const totalServiceSeconds = servedTickets.reduce((acc, t) => {
        if (t.completedAt && t.calledAt) {
            return acc + differenceInSeconds(t.completedAt, t.calledAt);
        }
        return acc;
    }, 0);

    const waitingInQueue = servicesForActiveCounter.reduce((acc, service) => {
        return acc + (waitingCountByService[service.id] || 0);
    }, 0);

    return {
        performance: {
            servedCount: servedTickets.length,
            skippedCount: skippedTickets.length,
            avgServiceTime: servedTickets.length > 0 ? totalServiceSeconds / servedTickets.length : 0,
            waitingInQueue,
        },
        handledTickets: myHandledTickets,
    }
  }, [tickets, currentUser, servicesForActiveCounter, waitingCountByService]);

  const formatAvgTime = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    const d = new Date(0);
    d.setSeconds(seconds);
    return d.toISOString().substr(14, 5);
  }
  
  const formatDuration = (start?: Date, end?: Date) => {
      if (!start || !end) return '-';
      return formatDistanceStrict(end, start, { locale: localeID });
  };

  const handleLogout = async () => {
    try {
        await auth.signOut();
        logoutUser();
        toast({ title: "Logout Berhasil", description: "Anda telah keluar dari sesi." });
        router.push('/login');
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Gagal melakukan logout." });
    }
  };

  const handleCallNext = async (serviceId: string) => {
    if (!activeCounterId) {
        toast({ variant: "destructive", title: "Error", description: "Pilih loket aktif terlebih dahulu."});
        return;
    }
    if (currentServingTicket) {
      toast({ variant: "warning", title: "Perhatian", description: "Selesaikan tiket yang sedang dilayani terlebih dahulu."});
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
              <QNextLogo className="h-10 w-10 text-primary" />
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
        <div className="space-y-8">
             {/* Performance Summary Cards */}
             <div>
                <h2 className="text-xl font-bold text-primary mb-4">Ringkasan Kinerja Hari Ini</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Dilayani</CardTitle>
                            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{performance.servedCount}</div>
                            <p className="text-xs text-muted-foreground">tiket telah selesai</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Dilewati</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{performance.skippedCount}</div>
                            <p className="text-xs text-muted-foreground">tiket dilewati</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Waktu Layanan Rata-rata</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatAvgTime(performance.avgServiceTime)}</div>
                            <p className="text-xs text-muted-foreground">per tiket (menit:detik)</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Antrian Menunggu</CardTitle>
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{performance.waitingInQueue}</div>
                            <p className="text-xs text-muted-foreground">untuk layanan Anda</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Kontrol Antrian</CardTitle>
                    <CardDescription>
                      Panggil antrian berikutnya dari loket aktif: <span className="font-bold text-primary">{counters.find(c => c.id === activeCounterId)?.name || '...'}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeCounterId ? (
                        servicesForActiveCounter.length > 0 ? (
                            servicesForActiveCounter.map((service) => {
                              const Icon = getIcon(service.icon);
                              return (
                              <Card key={service.id} className="p-4 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg">{service.name}</h3>
                                        <p className="text-sm text-muted-foreground">Antrian: {waitingCountByService[service.id] || 0}</p>
                                    </div>
                                    <Icon className="h-6 w-6 text-primary" />
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
                              )
                            })
                        ) : (
                            <p className="col-span-full text-muted-foreground">Tidak ada layanan yang diatur untuk loket ini.</p>
                        )
                    ) : (
                         <p className="col-span-full text-muted-foreground">Pilih loket aktif untuk melihat layanan yang tersedia.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <List />
                            Riwayat Aktivitas Anda Hari Ini
                        </CardTitle>
                         <CardDescription>
                            Daftar tiket yang telah Anda tangani (selesai atau dilewati).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-96">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>No. Tiket</TableHead>
                                    <TableHead>Layanan</TableHead>
                                    <TableHead>Waktu Panggil</TableHead>
                                    <TableHead>Waktu Selesai</TableHead>
                                    <TableHead>Durasi</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {handledTickets.length > 0 ? (
                                    handledTickets.map(ticket => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.number}</TableCell>
                                        <TableCell>{ticket.service.name}</TableCell>
                                        <TableCell>{ticket.calledAt ? format(ticket.calledAt, 'HH:mm:ss') : '-'}</TableCell>
                                        <TableCell>{ticket.completedAt ? format(ticket.completedAt, 'HH:mm:ss') : '-'}</TableCell>
                                        <TableCell>{formatDuration(ticket.calledAt, ticket.completedAt)}</TableCell>
                                        <TableCell>
                                             <Badge variant={ticket.status === 'done' ? 'secondary' : 'outline'} className={ticket.status === 'done' ? "text-green-700 border-green-200 bg-green-50" : ""}>
                                                {ticket.status === 'done' ? 'Selesai' : 'Dilewati'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        Anda belum menangani tiket hari ini.
                                    </TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
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
                          {currentServingTicket.calledAt ? format(currentServingTicket.calledAt, 'HH:mm:ss') : format(currentServingTicket.timestamp, 'HH:mm:ss')}
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
        </div>
      </main>
    </div>
  );
}
 