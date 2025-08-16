'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
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
  Ticket,
  Clock,
  LogOut,
  BarChart2,
} from 'lucide-react';
import BkpmLogo from '@/components/icons/bkpm-logo';
import { useQueue } from '@/context/queue-context';

const chartData = [
  { name: '09:00', 'Layanan Konsultasi': 12, 'Pengajuan Perizinan': 20, 'Layanan Prioritas': 5 },
  { name: '10:00', 'Layanan Konsultasi': 15, 'Pengajuan Perizinan': 18, 'Layanan Prioritas': 8 },
  { name: '11:00', 'Layanan Konsultasi': 25, 'Pengajuan Perizinan': 22, 'Layanan Prioritas': 10 },
  { name: '13:00', 'Layanan Konsultasi': 18, 'Pengajuan Perizinan': 30, 'Layanan Prioritas': 7 },
  { name: '14:00', 'Layanan Konsultasi': 22, 'Pengajuan Perizinan': 25, 'Layanan Prioritas': 12 },
  { name: '15:00', 'Layanan Konsultasi': 10, 'Pengajuan Perizinan': 15, 'Layanan Prioritas': 6 },
];

export default function AdminPage() {
  const router = useRouter();
  const { state } = useQueue();
  const { tickets } = state;

  const totalTickets = tickets.length;
  const waitingTickets = tickets.filter(t => t.status === 'waiting').length;
  const servedTickets = tickets.filter(t => t.status === 'done').length;

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <BkpmLogo className="h-10 w-10 text-primary" />
              <h1 className="text-2xl font-bold text-primary tracking-tight">
                Dasbor Admin
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
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Antrian Hari Ini
                </CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTickets}</div>
                <p className="text-xs text-muted-foreground">
                  Jumlah total tiket yang diambil
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sedang Menunggu
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{waitingTickets}</div>
                <p className="text-xs text-muted-foreground">
                  Jumlah pelanggan yang sedang dalam antrian
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Telah Dilayani</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{servedTickets}</div>
                <p className="text-xs text-muted-foreground">
                  Jumlah pelanggan yang telah selesai dilayani
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Waktu Tunggu Rata-rata
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">~5 mnt</div>
                <p className="text-xs text-muted-foreground">
                  Perkiraan waktu tunggu (data dummy)
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5" />
                Statistik Antrian per Jam
              </CardTitle>
              <CardDescription>
                Jumlah antrian yang masuk untuk setiap layanan per jam.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#555" />
                  <YAxis stroke="#555" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Layanan Konsultasi" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengajuan Perizinan" fill="hsl(var(--primary) / 0.7)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Layanan Prioritas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
