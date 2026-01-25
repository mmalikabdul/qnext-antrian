import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket, Users, Briefcase, Clock, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { dashboardService } from '../services/dashboard.service';
import { counterService } from '../services/counter.service';
import { Ticket as TicketType, Counter } from '@/types/queue';

export const DashboardTab = () => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [servingTickets, setServingTickets] = useState<TicketType[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayData, servingData, allCounters] = await Promise.all([
          dashboardService.getTodayTickets(),
          dashboardService.getServingTickets(),
          counterService.getAll()
        ]);
        setTickets(todayData);
        setServingTickets(servingData);
        setCounters(allCounters);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Polling setiap 5 detik agar status loket realtime
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalTickets = tickets.length;
  const waitingTickets = tickets.filter(t => t.status === 'WAITING').length;
  const servedTickets = tickets.filter(t => t.status === 'DONE').length;

  // Hitung Status Loket
  const activeCounters = counters.filter(c => c.status === 'ACTIVE').length;
  const breakCounters = counters.filter(c => c.status === 'BREAK').length;
  const inactiveCounters = counters.filter(c => !c.status || c.status === 'INACTIVE').length;

  if (loading) return <div>Memuat Data Dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Antrian Hari Ini</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Menunggu</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingTickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Telah Dilayani</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servedTickets}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Loket</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mt-1">
                <Badge className="bg-green-600 hover:bg-green-700">{activeCounters} Aktif</Badge>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{breakCounters} Istirahat</Badge>
                <Badge variant="destructive">{inactiveCounters} Tutup</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle>Statistik Antrian</CardTitle>
           </CardHeader>
           <CardContent>
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                   Chart Placeholder (Data belum cukup)
               </div>
           </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Sedang Dilayani</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[350px]">
                    {servingTickets.length > 0 ? (
                        <div className="space-y-3">
                             {servingTickets.map(t => (
                                <div key={t.id} className="flex justify-between items-center p-2 border rounded">
                                    <div>
                                        <div className="font-bold text-lg">{t.number}</div>
                                        <div className="text-sm text-muted-foreground">{t.service?.name}</div>
                                    </div>
                                    <Badge>Loket {t.counter?.name}</Badge>
                                </div>
                             ))}
                        </div>
                    ) : <p className="text-center text-muted-foreground mt-10">Tidak ada antrian aktif.</p>}
                </ScrollArea>
            </CardContent>
        </Card>
       </div>
    </div>
  );
};
