import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mic, CheckCircle, XCircle, SkipForward, LogOut, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { counterService } from '@/features/admin/services/counter.service';
import { serviceService } from '@/features/admin/services/service.service';
import { ticketService } from '../services/ticket.service';
import { Counter, Service, Ticket } from '@/types/queue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [counters, setCounters] = useState<Counter[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [counterStatus, setCounterStatus] = useState<'ACTIVE' | 'INACTIVE' | 'BREAK'>('INACTIVE');
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [waitingCounts, setWaitingCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 1. Load Data Awal (Counter & Services)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allCounters, allServices] = await Promise.all([
          counterService.getAll(),
          serviceService.getAll()
        ]);

        // Filter counter sesuai yang di-assign ke staff
        const myCounters = allCounters.filter(c => user?.counters?.includes(c.id));
        setCounters(myCounters);
        setServices(allServices);

        // Auto select counter pertama jika ada & set statusnya
        if (myCounters.length > 0) {
            const first = myCounters[0];
            setSelectedCounterId(first.id.toString());
            setCounterStatus(first.status || 'INACTIVE');
        }
      } catch (e) {
        console.error("Failed to load init data", e);
      }
    };
    if (user) fetchData();
  }, [user]);

  // Handle Status Change
  const handleStatusChange = async (newStatus: 'ACTIVE' | 'INACTIVE' | 'BREAK') => {
      if (!selectedCounterId) return;
      try {
          // Optimistic update
          setCounterStatus(newStatus);
          
          await counterService.update(Number(selectedCounterId), { status: newStatus });
          toast({ title: 'Status Diperbarui', description: `Loket sekarang ${newStatus === 'BREAK' ? 'Istirahat' : newStatus === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}` });
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Gagal', description: e.message });
      }
  };

  // 2. Poll Waiting Counts (Update jumlah antrian setiap 5 detik)
  useEffect(() => {
    const fetchQueue = async () => {
        try {
            const tickets = await ticketService.getQueueStatus();
            
            // Hitung waiting per service
            const counts: Record<number, number> = {};
            tickets.forEach(t => {
                if(t.status === 'WAITING') {
                    counts[t.serviceId] = (counts[t.serviceId] || 0) + 1;
                }
            });
            setWaitingCounts(counts);

            // Cek apakah kita punya tiket yang sedang serving tapi belum selesai (recovery state)
            if (!currentTicket && user && selectedCounterId) {
                const myActiveTicket = tickets.find(t => 
                    t.status === 'SERVING' && 
                    t.counterId === Number(selectedCounterId)
                );
                if (myActiveTicket) setCurrentTicket(myActiveTicket);
            }

        } catch (e) {
            console.error(e);
        }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [currentTicket, user, selectedCounterId]);


  // Actions
  const handleCallNext = async (serviceId: number) => {
    if (!selectedCounterId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Pilih loket terlebih dahulu.' });
        return;
    }
    setIsLoading(true);
    try {
        const ticket = await ticketService.callNext(serviceId, Number(selectedCounterId));
        setCurrentTicket(ticket);
        toast({ variant: 'success', title: 'Berhasil', description: `Memanggil ${ticket.number}` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Gagal Memanggil', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleRecall = async () => {
    if (!currentTicket) return;
    try {
        await ticketService.recall(currentTicket.id);
        toast({ title: 'Memanggil Ulang', description: `Nomor ${currentTicket.number} dipanggil ulang.` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleComplete = async () => {
    if (!currentTicket) return;
    setIsLoading(true);
    try {
        await ticketService.complete(currentTicket.id);
        setCurrentTicket(null);
        toast({ variant: 'success', title: 'Selesai', description: 'Antrian diselesaikan.' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

   const handleSkip = async () => {
    if (!currentTicket) return;
    if(!confirm("Lewati antrian ini?")) return;

    setIsLoading(true);
    try {
        await ticketService.skip(currentTicket.id);
        setCurrentTicket(null);
        toast({ variant: 'warning', title: 'Dilewati', description: 'Antrian dilewati.' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-6 shadow-sm">
         <div className="flex items-center gap-4">
             <div className="bg-primary/10 p-2 rounded-full">
                <UserIcon className="text-primary h-5 w-5" />
             </div>
             <div>
                 <h1 className="font-bold text-gray-800">{user?.name}</h1>
                 <p className="text-xs text-muted-foreground">Staff Petugas</p>
             </div>
         </div>
         <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => logout()}>
             <LogOut className="mr-2 h-4 w-4" />
             Keluar
         </Button>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Counter Selection */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Loket Aktif & Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {counters.length > 0 ? (
                        <>
                         <Select value={selectedCounterId} onValueChange={(val) => {
                             setSelectedCounterId(val);
                             // Update status state based on selected counter
                             const c = counters.find(x => x.id === Number(val));
                             if (c) setCounterStatus(c.status || 'INACTIVE');
                         }} disabled={!!currentTicket}>
                            <SelectTrigger className="w-full text-lg h-12">
                                <SelectValue placeholder="Pilih Loket Anda" />
                            </SelectTrigger>
                            <SelectContent>
                                {counters.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name} {c.label ? `(${c.label})` : ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="grid grid-cols-3 gap-2">
                            <Button 
                                variant={counterStatus === 'ACTIVE' ? 'success' : 'outline'} 
                                onClick={() => handleStatusChange('ACTIVE')}
                                className={counterStatus === 'ACTIVE' ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                            >
                                Aktif
                            </Button>
                            <Button 
                                variant={counterStatus === 'BREAK' ? 'warning' : 'outline'} 
                                onClick={() => handleStatusChange('BREAK')}
                                className={counterStatus === 'BREAK' ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
                            >
                                Istirahat
                            </Button>
                            <Button 
                                variant={counterStatus === 'INACTIVE' ? 'destructive' : 'outline'} 
                                onClick={() => handleStatusChange('INACTIVE')}
                            >
                                Tutup
                            </Button>
                        </div>
                        </>
                    ) : (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Tidak ada Loket</AlertTitle>
                            <AlertDescription>Akun Anda belum ditugaskan ke loket manapun. Hubungi Admin.</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* 2. Main Ticket Display */}
            {currentTicket ? (
                <Card className="border-primary/50 shadow-lg bg-white">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-muted-foreground font-normal uppercase tracking-wider text-sm">Sedang Melayani</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4 py-8">
                        <div className="text-8xl font-black text-primary tracking-tighter">
                            {currentTicket.number}
                        </div>
                        <div className="inline-block bg-secondary px-4 py-1 rounded-full text-secondary-foreground font-medium">
                            {currentTicket.service?.name}
                        </div>
                    </CardContent>
                    <Separator />
                    <CardFooter className="grid grid-cols-3 gap-4 p-6 bg-gray-50/50">
                        <Button variant="warning" size="lg" className="h-14 text-base" onClick={handleRecall}>
                            <Mic className="mr-2 h-5 w-5" />
                            Panggil Ulang
                        </Button>
                        <Button variant="destructive" size="lg" className="h-14 text-base" onClick={handleSkip} disabled={isLoading}>
                            <SkipForward className="mr-2 h-5 w-5" />
                            Lewati
                        </Button>
                        <Button 
                            variant="success" 
                            size="lg" 
                            className="h-14 text-base" 
                            onClick={handleComplete} 
                            disabled={isLoading}
                        >
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Selesai
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <Card className="border-dashed h-[400px] flex items-center justify-center bg-gray-50">
                    <div className="text-center text-muted-foreground">
                        <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm">
                            <UserIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700">Siap Melayani</h3>
                        <p>Silakan panggil antrian berikutnya dari menu di samping.</p>
                    </div>
                </Card>
            )}
        </div>

        {/* Right Column: Queue List / Call Buttons */}
        <div className="space-y-6">
             <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Antrian Menunggu</CardTitle>
                    <CardDescription>Pilih layanan untuk memanggil</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                    {services.map(service => {
                        const count = waitingCounts[service.id] || 0;
                        return (
                            <Button 
                                key={service.id}
                                variant="outline" 
                                className="w-full h-auto py-4 flex justify-between items-center group hover:border-primary hover:bg-primary/5"
                                onClick={() => handleCallNext(service.id)}
                                disabled={!!currentTicket || isLoading || !selectedCounterId}
                            >
                                <div className="text-left">
                                    <div className="font-semibold text-gray-800 group-hover:text-primary">{service.name}</div>
                                    <div className="text-xs text-muted-foreground">Kode: {service.code}</div>
                                </div>
                                <Badge variant={count > 0 ? "default" : "secondary"} className="text-sm px-3 py-1">
                                    {count}
                                </Badge>
                            </Button>
                        )
                    })}
                </CardContent>
             </Card>
        </div>

      </main>
    </div>
  );
}
