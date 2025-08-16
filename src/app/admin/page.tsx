'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, Ticket, Clock, LogOut, BarChart2, Settings, UserCog, Building, FileText, PlusCircle, Edit, Trash2 } from 'lucide-react';
import BkpmLogo from '@/components/icons/bkpm-logo';
import { useQueue } from '@/context/queue-context';
import type { Staff, Counter, Service } from '@/context/queue-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

const chartData = [
  { name: '09:00', 'Layanan Konsultasi': 12, 'Pengajuan Perizinan': 20, 'Layanan Prioritas': 5 },
  { name: '10:00', 'Layanan Konsultasi': 15, 'Pengajuan Perizinan': 18, 'Layanan Prioritas': 8 },
  { name: '11:00', 'Layanan Konsultasi': 25, 'Pengajuan Perizinan': 22, 'Layanan Prioritas': 10 },
  { name: '13:00', 'Layanan Konsultasi': 18, 'Pengajuan Perizinan': 30, 'Layanan Prioritas': 7 },
  { name: '14:00', 'Layanan Konsultasi': 22, 'Pengajuan Perizinan': 25, 'Layanan Prioritas': 12 },
  { name: '15:00', 'Layanan Konsultasi': 10, 'Pengajuan Perizinan': 15, 'Layanan Prioritas': 6 },
];

const DashboardTab = () => {
  const { state } = useQueue();
  const { tickets } = state;

  const totalTickets = tickets.length;
  const waitingTickets = tickets.filter(t => t.status === 'waiting').length;
  const servedTickets = tickets.filter(t => t.status === 'done').length;

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
            <p className="text-xs text-muted-foreground">Jumlah total tiket yang diambil</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Menunggu</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingTickets}</div>
            <p className="text-xs text-muted-foreground">Jumlah pelanggan yang sedang dalam antrian</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Telah Dilayani</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servedTickets}</div>
            <p className="text-xs text-muted-foreground">Jumlah pelanggan yang telah selesai dilayani</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waktu Tunggu Rata-rata</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~5 mnt</div>
            <p className="text-xs text-muted-foreground">Perkiraan waktu tunggu (data dummy)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart2 className="mr-2 h-5 w-5" />
            Statistik Antrian per Jam
          </CardTitle>
          <CardDescription>Jumlah antrian yang masuk untuk setiap layanan per jam.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#555" />
              <YAxis stroke="#555" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }} />
              <Legend />
              <Bar dataKey="Layanan Konsultasi" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengajuan Perizinan" fill="hsl(var(--primary) / 0.7)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Layanan Prioritas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

const StaffForm = ({ staff, onSave, closeDialog }: { staff?: Staff | null, onSave: (data: Omit<Staff, 'id'> | Staff) => void, closeDialog: () => void }) => {
    const { state: { counters } } = useQueue();
    const [name, setName] = React.useState(staff?.name || '');
    const [assignedCounters, setAssignedCounters] = React.useState<number[]>(staff?.counters || []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const staffData = { name, counters: assignedCounters };
        if (staff?.id) {
            onSave({ ...staffData, id: staff.id });
        } else {
            onSave(staffData);
        }
        closeDialog();
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="staff-name">Nama Petugas</Label>
                <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label>Loket yang Dilayani</Label>
                <div className="grid grid-cols-3 gap-2">
                    {counters.filter(c => c.status === 'open').map(counter => (
                        <div key={counter.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`counter-${counter.id}`}
                                checked={assignedCounters.includes(counter.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setAssignedCounters([...assignedCounters, counter.id]);
                                    } else {
                                        setAssignedCounters(assignedCounters.filter(id => id !== counter.id));
                                    }
                                }}
                            />
                            <Label htmlFor={`counter-${counter.id}`}>{counter.name}</Label>
                        </div>
                    ))}
                </div>
            </div>
            <DialogFooter>
                <Button type="submit">Simpan</Button>
            </DialogFooter>
        </form>
    );
};


const StaffTab = () => {
    const { state: { staff, counters }, addStaff, updateStaff, deleteStaff } = useQueue();
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [editingStaff, setEditingStaff] = React.useState<Staff | null>(null);
    const { toast } = useToast();

    const handleSaveStaff = async (data: Omit<Staff, 'id'> | Staff) => {
        try {
            if ('id' in data) {
                await updateStaff(data);
                toast({ title: "Sukses", description: "Data petugas berhasil diperbarui." });
            } else {
                await addStaff(data);
                toast({ title: "Sukses", description: "Petugas baru berhasil ditambahkan." });
            }
        } catch(e) {
            toast({ title: "Error", description: "Gagal menyimpan data petugas.", variant: "destructive" });
        }
    }

    const handleDeleteStaff = async (id: string) => {
        try {
            await deleteStaff(id);
            toast({ title: "Sukses", description: "Petugas berhasil dihapus." });
        } catch(e) {
            toast({ title: "Error", description: "Gagal menghapus petugas.", variant: "destructive" });
        }
    }

    const getCounterName = (counterId: number) => {
        return counters.find(c => c.id === counterId)?.name || `Loket ${counterId}`;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manajemen Petugas</CardTitle>
                    <CardDescription>Tambah, edit, atau hapus data petugas.</CardDescription>
                </div>
                 <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2"/> Tambah Petugas</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Petugas Baru</DialogTitle>
                        </DialogHeader>
                        <StaffForm onSave={handleSaveStaff} closeDialog={() => setIsAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Loket yang Dilayani</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell>{s.counters.map(getCounterName).join(', ')}</TableCell>
                                <TableCell className="text-right">
                                     <Dialog open={editingStaff?.id === s.id} onOpenChange={(isOpen) => !isOpen && setEditingStaff(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingStaff(s)}><Edit className="h-4 w-4"/></Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Petugas</DialogTitle>
                                            </DialogHeader>
                                            <StaffForm staff={s} onSave={handleSaveStaff} closeDialog={() => setEditingStaff(null)} />
                                        </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                                <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Ini akan menghapus petugas secara permanen.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteStaff(s.id)}>Hapus</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const CounterForm = ({ counter, onSave, closeDialog }: { counter?: Counter | null, onSave: (data: Omit<Counter, 'id' | 'docId'> | Counter) => void, closeDialog: () => void }) => {
    const [name, setName] = React.useState(counter?.name || '');
    const [status, setStatus] = React.useState<'open' | 'closed'>(counter?.status || 'open');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const counterData = { name, status };
        if (counter?.docId) {
            onSave({ ...counter, ...counterData });
        } else {
            onSave(counterData);
        }
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="counter-name">Nama Loket</Label>
                <Input id="counter-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="counter-status">Status</Label>
                <Select value={status} onValueChange={(value: 'open' | 'closed') => setStatus(value)}>
                    <SelectTrigger id="counter-status">
                        <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="open">Buka</SelectItem>
                        <SelectItem value="closed">Tutup</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button type="submit">Simpan</Button>
            </DialogFooter>
        </form>
    );
};

const CounterTab = () => {
    const { state: { counters }, addCounter, updateCounter, deleteCounter } = useQueue();
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [editingCounter, setEditingCounter] = React.useState<Counter | null>(null);
    const { toast } = useToast();
    
    const handleSaveCounter = async (data: Omit<Counter, 'id' | 'docId'> | Counter) => {
        try {
            if ('docId' in data) {
                await updateCounter(data);
                toast({ title: "Sukses", description: "Data loket berhasil diperbarui." });
            } else {
                await addCounter(data);
                toast({ title: "Sukses", description: "Loket baru berhasil ditambahkan." });
            }
        } catch(e) {
            toast({ title: "Error", description: "Gagal menyimpan data loket.", variant: "destructive" });
        }
    }

    const handleDeleteCounter = async (docId: string) => {
        try {
            await deleteCounter(docId);
            toast({ title: "Sukses", description: "Loket berhasil dihapus." });
        } catch(e) {
            toast({ title: "Error", description: "Gagal menghapus loket.", variant: "destructive" });
        }
    }


    return (
        <Card>
            <CardHeader  className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manajemen Loket</CardTitle>
                    <CardDescription>Atur loket yang tersedia untuk melayani.</CardDescription>
                </div>
                 <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2"/> Tambah Loket</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Tambah Loket Baru</DialogTitle></DialogHeader>
                        <CounterForm onSave={handleSaveCounter} closeDialog={() => setIsAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Loket</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {counters.map(c => (
                            <TableRow key={c.docId}>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell>{c.status === 'open' ? 'Buka' : 'Tutup'}</TableCell>
                                <TableCell className="text-right">
                                    <Dialog open={editingCounter?.docId === c.docId} onOpenChange={(isOpen) => !isOpen && setEditingCounter(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingCounter(c)}><Edit className="h-4 w-4"/></Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Edit Loket</DialogTitle></DialogHeader>
                                            <CounterForm counter={c} onSave={handleSaveCounter} closeDialog={() => setEditingCounter(null)} />
                                        </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                                <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Ini akan menghapus loket secara permanen.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteCounter(c.docId)}>Hapus</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const ServiceForm = ({ service, onSave, closeDialog }: { service?: Service | null, onSave: (data: Service | Omit<Service, 'id' | 'icon'> & {id: string}) => void, closeDialog: () => void }) => {
    const [id, setId] = React.useState(service?.id || '');
    const [name, setName] = React.useState(service?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id, name });
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="service-id">ID Layanan</Label>
                <Input id="service-id" value={id} onChange={(e) => setId(e.target.value.toUpperCase())} required disabled={!!service} maxLength={1} />
                 { !service && <p className="text-xs text-muted-foreground">ID Layanan adalah satu huruf unik (misal: D).</p> }
            </div>
            <div className="space-y-2">
                <Label htmlFor="service-name">Nama Layanan</Label>
                <Input id="service-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <DialogFooter>
                <Button type="submit">Simpan</Button>
            </DialogFooter>
        </form>
    );
};


const ServiceTab = () => {
    const { state: { services }, addService, updateService, deleteService } = useQueue();
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [editingService, setEditingService] = React.useState<Service | null>(null);
    const { toast } = useToast();

    const handleSaveService = async (data: Service | Omit<Service, 'id' | 'icon'> & {id: string}) => {
        try {
            const serviceData = { id: data.id, name: data.name };
            if (editingService) {
                await updateService(serviceData);
                toast({ title: "Sukses", description: "Layanan berhasil diperbarui." });
            } else {
                await addService(serviceData);
                toast({ title: "Sukses", description: "Layanan baru berhasil ditambahkan." });
            }
        } catch(e) {
            toast({ title: "Error", description: "Gagal menyimpan layanan.", variant: "destructive" });
        }
    }

    const handleDeleteService = async (id: string) => {
        try {
            await deleteService(id);
            toast({ title: "Sukses", description: "Layanan berhasil dihapus." });
        } catch(e) {
             toast({ title: "Error", description: "Gagal menghapus layanan.", variant: "destructive" });
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manajemen Layanan</CardTitle>
                    <CardDescription>Atur layanan yang dapat dipilih oleh pelanggan.</CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingService(null)}><PlusCircle className="mr-2"/> Tambah Layanan</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Tambah Layanan Baru</DialogTitle></DialogHeader>
                        <ServiceForm onSave={handleSaveService} closeDialog={() => setIsAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Layanan</TableHead>
                            <TableHead>Nama Layanan</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.id}</TableCell>
                                <TableCell>{s.name}</TableCell>
                                <TableCell className="text-right">
                                    <Dialog open={editingService?.id === s.id} onOpenChange={(isOpen) => !isOpen && setEditingService(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingService(s)}><Edit className="h-4 w-4"/></Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Edit Layanan</DialogTitle></DialogHeader>
                                            <ServiceForm service={s} onSave={handleSaveService} closeDialog={() => setEditingService(null)} />
                                        </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                                <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Ini akan menghapus layanan secara permanen.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteService(s.id)}>Hapus</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const ReportTab = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Laporan</CardTitle>
                <CardDescription>Lihat dan ekspor laporan antrian.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Fitur laporan akan segera tersedia.</p>
            </CardContent>
        </Card>
    )
}

export default function AdminPage() {
  const router = useRouter();
  const auth = getAuth(app);
  const { toast } = useToast();
  const { logoutUser } = useQueue();

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
        <Tabs defaultValue="dashboard">
            <TabsList className="mb-4">
                <TabsTrigger value="dashboard"><BarChart2 className="mr-2"/> Dasbor</TabsTrigger>
                <TabsTrigger value="staff"><UserCog className="mr-2"/> Petugas</TabsTrigger>
                <TabsTrigger value="counters"><Building className="mr-2"/> Loket</TabsTrigger>
                <TabsTrigger value="services"><Settings className="mr-2"/> Layanan</TabsTrigger>
                <TabsTrigger value="reports"><FileText className="mr-2"/> Laporan</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard"><DashboardTab /></TabsContent>
            <TabsContent value="staff"><StaffTab /></TabsContent>
            <TabsContent value="counters"><CounterTab /></TabsContent>
            <TabsContent value="services"><ServiceTab /></TabsContent>
            <TabsContent value="reports"><ReportTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
