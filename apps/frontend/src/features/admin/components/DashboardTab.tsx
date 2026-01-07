import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket, Users, Briefcase, Clock, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { dashboardService } from '../services/dashboard.service';
import { Ticket as TicketType } from '@/types/queue';

export const DashboardTab = () => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [servingTickets, setServingTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayData, servingData] = await Promise.all([
          dashboardService.getTodayTickets(),
          dashboardService.getServingTickets()
        ]);
        setTickets(todayData);
        setServingTickets(servingData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Polling setiap 10 detik (sementara ganti socket)
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalTickets = tickets.length;
  const waitingTickets = tickets.filter(t => t.status === 'WAITING').length;
  const servedTickets = tickets.filter(t => t.status === 'DONE').length;

  // Dummy Chart Data (Nanti bisa dihitung real dari tickets)
  const chartData = [
      { name: '09:00', 'Layanan A': 4, 'Layanan B': 2 },
      { name: '10:00', 'Layanan A': 5, 'Layanan B': 8 },
  ];

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
            <CardTitle className="text-sm font-medium">Waktu Tunggu Rata-rata</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">- mnt</div>
             <p className="text-xs text-muted-foreground">Belum dihitung</p>
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
