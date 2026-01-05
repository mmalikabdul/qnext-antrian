'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import { Users, Briefcase, Ticket, Clock, LogOut, BarChart2, Settings, UserCog, Building, FileText, PlusCircle, Edit, Trash2, Film, ChevronLeft, ChevronRight, Menu, Icon as IconType, Monitor, Calendar as CalendarIcon, Download, Loader2, Palette, Text, Volume2 } from 'lucide-react';
import { format, differenceInMinutes, formatDistanceStrict } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import * as XLSX from 'xlsx';


import QNextLogo from '@/components/icons/q-next-logo';
import { useQueue } from '@/context/queue-context';
import type { Staff, Counter, Service, User, ReportTicket, DisplaySettings } from '@/context/queue-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

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
  const { tickets, nowServingTickets } = state;

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Petugas Aktif ({nowServingTickets.length})
                </CardTitle>
                <CardDescription>Petugas yang sedang melayani antrian.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[350px]">
                    {nowServingTickets.length > 0 ? (
                        <div className="space-y-3 pr-3">
                            {nowServingTickets.map(info => (
                                <div key={info.ticket.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{info.ticket.servedBy}</p>
                                        <p className="text-sm text-muted-foreground">Melayani <span className="font-medium text-primary">{info.ticket.number}</span></p>
                                    </div>
                                    <Badge variant="outline">Loket {info.counter}</Badge>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted-foreground text-center pt-16">Tidak ada petugas yang sedang melayani.</p>}
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StaffForm = ({ staff, onSave, closeDialog }: { staff?: (Staff & User) | null, onSave: (data: any) => Promise<void>, closeDialog: () => void }) => {
    const { state: { counters } } = useQueue();
    const [name, setName] = React.useState(staff?.name || '');
    const [email, setEmail] = React.useState(staff?.email || '');
    const [password, setPassword] = React.useState('');
    const [assignedCounters, setAssignedCounters] = React.useState<number[]>(staff?.counters || []);
    const [isLoading, setIsLoading] = React.useState(false);
    const [role, setRole] = React.useState<'admin' | 'staff'>(staff?.role || 'staff');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const staffData: any = { name, role };
        
        if (role === 'staff') {
            staffData.counters = assignedCounters;
        }

        if (staff?.uid) { // Editing existing staff
            staffData.uid = staff.uid;
        } else { // Adding new staff
            if (!email || !password) {
                alert("Email dan password harus diisi untuk pengguna baru.");
                setIsLoading(false);
                return;
            }
            staffData.email = email;
            staffData.password = password;
        }
        
        await onSave(staffData);

        setIsLoading(false);
        closeDialog();
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="staff-name">Nama Pengguna</Label>
                <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {!staff && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="staff-email">Email Login</Label>
                        <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="staff-password">Password</Label>
                        <Input id="staff-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Peran</Label>
                      <RadioGroup defaultValue={role} onValueChange={(value: 'admin' | 'staff') => setRole(value)} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="staff" id="r1" />
                              <Label htmlFor="r1">Petugas (Staff)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="admin" id="r2" />
                              <Label htmlFor="r2">Admin</Label>
                          </div>
                      </RadioGroup>
                    </div>
                </>
            )}
            {role === 'staff' && (
                <div className="space-y-2">
                    <Label>Loket yang Dilayani</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {counters && counters.filter(c => c.status === 'open').map(counter => (
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
            )}
            <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Batal</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
};


const StaffTab = () => {
    const { state: { staff, counters, users, currentUser }, addStaff, updateStaff, deleteStaff, logoutUser } = useQueue();
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [editingStaff, setEditingStaff] = React.useState<(Staff & User) | null>(null);
    const { toast } = useToast();
    
    const combinedUserData = users.map(u => {
        const staffData = staff.find(s => s.id === u.uid);
        return { ...u, ...staffData, id: u.uid };
    });

    const handleSaveStaff = async (data: any) => {
        try {
            if (data.uid) { // Editing
                const staffData = { id: data.uid, name: data.name, counters: data.counters || [] };
                await updateStaff(staffData);
                toast({ variant: "success", title: "Sukses", description: "Data pengguna berhasil diperbarui." });
                setEditingStaff(null);
            } else { // Adding
                const isDuplicateName = users.some(u => u.name?.toLowerCase() === data.name.toLowerCase());
                if (isDuplicateName) {
                    toast({ variant: "destructive", title: "Gagal", description: "Nama pengguna sudah ada. Silakan gunakan nama lain." });
                    return;
                }
                
                await addStaff(data);
                toast({ variant: "success", title: "Sukses", description: "Pengguna baru berhasil ditambahkan." });
                setIsAddOpen(false);
            }
        } catch(e: any) {
            console.error("Failed to save staff:", e);
            const message = e.code === 'auth/email-already-in-use' 
                ? "Email sudah digunakan oleh akun lain."
                : `Gagal menyimpan data pengguna: ${e.message}`;
            toast({ variant: "destructive", title: "Error", description: message });
        }
    }

    const handleDeleteStaff = async (id: string) => {
        try {
            await deleteStaff(id);
            toast({ variant: "success", title: "Sukses", description: "Data pengguna berhasil dihapus dari aplikasi." });
        } catch(e: any) {
            toast({ variant: "destructive", title: "Error", description: `Gagal menghapus pengguna. ${e.message}` });
        }
    }

    const getCounterName = (counterId: number) => {
        return counters.find(c => c.id === counterId)?.name || `Loket ${counterId}`;
    }

    return (
        <>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manajemen Pengguna</CardTitle>
                    <CardDescription>Tambah, edit, atau hapus data pengguna dan akun login mereka.</CardDescription>
                </div>
                 <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingStaff(null)}><PlusCircle className="mr-2"/> Tambah Pengguna</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
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
                            <TableHead>Email</TableHead>
                            <TableHead>Peran</TableHead>
                            <TableHead>Loket yang Dilayani</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {combinedUserData.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell>{s.email}</TableCell>
                                <TableCell className="capitalize">{s.role}</TableCell>
                                <TableCell>{s.role === 'staff' ? s.counters?.map(getCounterName).join(', ') || '-' : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                     <Dialog open={editingStaff?.id === s.id} onOpenChange={(isOpen) => !isOpen && setEditingStaff(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingStaff(s as (Staff & User))}><Edit className="h-4 w-4"/></Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Pengguna</DialogTitle>
                                            </DialogHeader>
                                            <StaffForm staff={s as (Staff & User)} onSave={handleSaveStaff} closeDialog={() => setEditingStaff(null)} />
                                        </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive" disabled={s.uid === currentUser?.uid}><Trash2 className="h-4 w-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tindakan ini hanya akan menghapus data pengguna dari aplikasi ini. Akun login pengguna di Firebase Authentication **TIDAK AKAN DIHAPUS**. Anda perlu menghapusnya secara manual melalui Firebase Console.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteStaff(s.id)}>Hapus dari Aplikasi</AlertDialogAction>
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

        </>
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
                toast({ variant: "success", title: "Sukses", description: "Data loket berhasil diperbarui." });
            } else {
                const isDuplicate = counters.some(c => c.name.toLowerCase() === data.name.toLowerCase());
                if (isDuplicate) {
                    toast({ variant: "destructive", title: "Error", description: "Nama loket sudah ada." });
                    return;
                }
                await addCounter(data);
                toast({ variant: "success", title: "Sukses", description: "Loket baru berhasil ditambahkan." });
            }
            setIsAddOpen(false);
            setEditingCounter(null);
        } catch(e) {
            toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan data loket." });
        }
    }

    const handleDeleteCounter = async (docId: string) => {
        try {
            await deleteCounter(docId);
            toast({ variant: "success", title: "Sukses", description: "Loket berhasil dihapus." });
        } catch(e) {
            toast({ variant: "destructive", title: "Error", description: "Gagal menghapus loket." });
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
                            <TableHead>ID Loket</TableHead>
                            <TableHead>Nama Loket</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {counters.map(c => (
                            <TableRow key={c.docId}>
                                <TableCell className="font-medium">{c.id}</TableCell>
                                <TableCell>{c.name}</TableCell>
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

const getIcon = (iconName: string): React.ComponentType<LucideIcons.LucideProps> => {
    // @ts-ignore
    return LucideIcons[iconName] || LucideIcons['Ticket'];
}

const ServiceForm = ({ service, onSave, closeDialog }: { service?: Service | null, onSave: (data: Service) => void, closeDialog: () => void }) => {
    const { state: { counters } } = useQueue();
    const [id, setId] = React.useState(service?.id || '');
    const [name, setName] = React.useState(service?.name || '');
    const [assignedCounters, setAssignedCounters] = React.useState<number[]>(service?.servingCounters || []);
    const [icon, setIcon] = React.useState(service?.icon || 'Ticket');
    const [isIconPickerOpen, setIconPickerOpen] = React.useState(false);
    
    const iconList = Object.keys(LucideIcons).filter(key => typeof LucideIcons[key as keyof typeof LucideIcons] === 'object');
    const SelectedIcon = getIcon(icon);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id, name, servingCounters: assignedCounters, icon });
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="service-id">ID Layanan (1 Huruf)</Label>
                <Input id="service-id" value={id} onChange={(e) => setId(e.target.value.toUpperCase())} required disabled={!!service} maxLength={1} />
                 { !service && <p className="text-xs text-muted-foreground">ID Layanan adalah satu huruf unik (misal: A, B, C).</p> }
            </div>
            <div className="space-y-2">
                <Label htmlFor="service-name">Nama Layanan</Label>
                <Input id="service-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
                <Label>Ikon</Label>
                <div className="flex items-center gap-2">
                    <SelectedIcon className="h-8 w-8 p-1.5 border rounded-md" />
                     <Popover open={isIconPickerOpen} onOpenChange={setIconPickerOpen}>
                        <PopoverTrigger asChild>
                             <Button type="button" variant="outline">Pilih Ikon</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                             <ScrollArea className="h-72">
                                <div className="grid grid-cols-6 gap-2">
                                {iconList.map(iconName => {
                                    const IconComponent = getIcon(iconName);
                                    return (
                                        <Button
                                            key={iconName}
                                            variant="ghost"
                                            size="icon"
                                            className={cn("h-10 w-10", icon === iconName && "bg-accent text-accent-foreground")}
                                            onClick={() => {
                                                setIcon(iconName);
                                                setIconPickerOpen(false);
                                            }}
                                        >
                                            <IconComponent className="h-5 w-5" />
                                        </Button>
                                    )
                                })}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Dapat Dilayani di Loket</Label>
                <div className="grid grid-cols-3 gap-2">
                    {counters && Array.isArray(counters) && counters.map(counter => (
                        <div key={counter.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`service-counter-${counter.id}`}
                                checked={assignedCounters.includes(counter.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setAssignedCounters([...assignedCounters, counter.id]);
                                    } else {
                                        setAssignedCounters(assignedCounters.filter(id => id !== counter.id));
                                    }
                                }}
                            />
                            <Label htmlFor={`service-counter-${counter.id}`}>{counter.name}</Label>
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


const ServiceTab = () => {
    const { state: { services, counters }, addService, updateService, deleteService } = useQueue();
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [editingService, setEditingService] = React.useState<Service | null>(null);
    const { toast } = useToast();

    const handleSaveService = async (data: Service) => {
        try {
             if (editingService) {
                await updateService(data);
                toast({ variant: "success", title: "Sukses", description: "Layanan berhasil diperbarui." });
            } else {
                await addService(data);
                toast({ variant: "success", title: "Sukses", description: "Layanan baru berhasil ditambahkan." });
            }
            setEditingService(null);
            setIsAddOpen(false); // Close dialog on success
        } catch(e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan layanan. Pastikan ID unik." });
        }
    }

    const handleDeleteService = async (id: string) => {
        try {
            await deleteService(id);
            // Toast is handled inside context now
        } catch(e) {
             toast({ variant: "destructive", title: "Error", description: "Gagal menghapus layanan." });
        }
    }

    const getCounterName = (counterId: number) => {
        return counters.find(c => c.id === counterId)?.name || `Loket ${counterId}`;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manajemen Layanan</CardTitle>
                    <CardDescription>Atur layanan dan loket mana yang dapat melayaninya.</CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={(isOpen) => {
                    if (!isOpen) setEditingService(null);
                    setIsAddOpen(isOpen);
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => {
                            setEditingService(null);
                            setIsAddOpen(true);
                        }}><PlusCircle className="mr-2"/> Tambah Layanan</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}</DialogTitle></DialogHeader>
                        <ServiceForm service={editingService} onSave={handleSaveService as any} closeDialog={() => { setIsAddOpen(false); setEditingService(null); }} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Ikon</TableHead>
                            <TableHead>Nama Layanan</TableHead>
                            <TableHead>Loket</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services && services.map(s => {
                             const Icon = getIcon(s.icon);
                             return (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.id}</TableCell>
                                    <TableCell><Icon className="h-5 w-5" /></TableCell>
                                    <TableCell>{s.name}</TableCell>
                                    <TableCell>{s.servingCounters?.map(getCounterName).join(', ') || 'Belum diatur'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            setEditingService(s);
                                            setIsAddOpen(true);
                                        }}><Edit className="h-4 w-4"/></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                                    <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Ini akan menghapus layanan dan data counter hariannya secara permanen.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteService(s.id)}>Hapus</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const colorSchemes = {
    "default": "Skema Biru (Default)",
    "forest": "Skema Hijau Hutan",
    "sunset": "Skema Oranye Senja",
    "modern": "Skema Modern (Hitam Putih)",
};
const soundOptions = [
    { value: 'chime.mp3', label: 'Chime (Default)' },
    { value: 'ding.mp3', label: 'Ding' },
    { value: 'bell.mp3', label: 'Bell' },
    { value: 'pengumuman.mp3', label: 'Pengumuman (Suara Rekaman)' },
];

const DisplayTab = () => {
    const { state, updateDisplaySettings } = useQueue();
    const [settings, setSettings] = React.useState<DisplaySettings>({
        videoUrl: '',
        footerText: '',
        colorScheme: 'default',
        soundUrl: 'chime.mp3'
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        if (state.displaySettings) {
            setSettings(state.displaySettings);
        }
    }, [state.displaySettings]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateDisplaySettings(settings);
            toast({ variant: "success", title: "Sukses", description: "Pengaturan tampilan berhasil diperbarui." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Gagal memperbarui pengaturan." });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSoundPlay = (soundFile: string) => {
        const audio = new Audio(`https://firebasestorage.googleapis.com/v0/b/bkpm-q.appspot.com/o/${soundFile}?alt=media`);
        audio.play();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pengaturan Tampilan Monitor</CardTitle>
                <CardDescription>
                    Atur tampilan visual, video, teks, dan suara pada halaman monitor antrian.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Palette/> Skema Warna</Label>
                    <RadioGroup 
                        value={settings.colorScheme} 
                        onValueChange={(value) => setSettings(prev => ({...prev, colorScheme: value}))}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {Object.entries(colorSchemes).map(([key, label]) => (
                             <Label key={key} htmlFor={`color-${key}`} className={cn(
                                 "border rounded-lg p-4 cursor-pointer transition-all",
                                 settings.colorScheme === key ? "ring-2 ring-primary" : "ring-1 ring-border"
                             )}>
                                <RadioGroupItem value={key} id={`color-${key}`} className="sr-only"/>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-5 h-5 rounded-full scheme-bg-${key}`}></div>
                                    <span className="font-semibold">{label}</span>
                                </div>
                                <div className={`h-8 w-full rounded-md scheme-bg-${key} flex items-center justify-center`}>
                                    <p className={`text-xs font-bold scheme-text-${key}`}>A-001</p>
                                </div>
                             </Label>
                        ))}
                    </RadioGroup>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="video-url" className="flex items-center gap-2"><Film /> URL Playlist YouTube</Label>
                    <Input 
                        id="video-url" 
                        value={settings.videoUrl} 
                        onChange={(e) => setSettings(prev => ({...prev, videoUrl: e.target.value }))}
                        placeholder="https://www.youtube.com/embed/videoseries?list=..."
                    />
                    <p className="text-sm text-muted-foreground">
                        Pastikan Anda menggunakan URL "embed" dari YouTube. Contoh: <strong>https://www.youtube.com/embed/videoseries?list=PL2_3w_50q_p_4i_t_aA-i1l_n5s-ZqGcB</strong>
                    </p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="footer-text" className="flex items-center gap-2"><Text /> Teks Berjalan (Footer)</Label>
                    <Textarea 
                        id="footer-text"
                        value={settings.footerText}
                        onChange={(e) => setSettings(prev => ({...prev, footerText: e.target.value }))}
                        placeholder="Selamat datang di layanan kami. Kepuasan anda adalah prioritas kami."
                        rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                        Gunakan tanda `---` (tiga tanda hubung) untuk memisahkan beberapa pesan.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sound-url" className="flex items-center gap-2"><Volume2 /> Suara Panggilan</Label>
                     <div className="flex items-center gap-2">
                        <Select 
                            value={settings.soundUrl}
                            onValueChange={(value) => setSettings(prev => ({...prev, soundUrl: value }))}
                        >
                            <SelectTrigger id="sound-url" className="flex-grow">
                                <SelectValue placeholder="Pilih suara" />
                            </SelectTrigger>
                            <SelectContent>
                                {soundOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => handleSoundPlay(settings.soundUrl)}>
                            <Volume2/>
                        </Button>
                    </div>
                     <p className="text-sm text-muted-foreground">Pilih suara notifikasi yang akan diputar saat nomor antrian dipanggil.</p>
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
            </CardContent>
            {/* Style for color scheme previews */}
            <style jsx>{`
                .scheme-bg-default { background-color: #003049; }
                .scheme-text-default { color: #E6EEF2; }
                .scheme-bg-forest { background-color: #2F4F4F; }
                .scheme-text-forest { color: #F0FFF0; }
                .scheme-bg-sunset { background-color: #E67E22; }
                .scheme-text-sunset { color: #FFF8E1; }
                .scheme-bg-modern { background-color: #111827; }
                .scheme-text-modern { color: #F9FAFB; }
            `}</style>
        </Card>
    );
};



const ReportTab = () => {
    const { getReportData } = useQueue();
    const { toast } = useToast();
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
    });
    const [reportData, setReportData] = React.useState<ReportTicket[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [summary, setSummary] = React.useState<{ total: number, avgWait: number, avgServe: number } | null>(null);

    const handleGenerateReport = async () => {
        if (!date?.from || !date?.to) {
            toast({ variant: 'warning', title: 'Perhatian', description: 'Silakan pilih rentang tanggal terlebih dahulu.' });
            return;
        }
        setIsLoading(true);
        setReportData([]);
        setSummary(null);
        try {
            const data = await getReportData(date.from, date.to);
            setReportData(data);
            if(data.length > 0) {
                calculateSummary(data);
                toast({ variant: 'success', title: 'Sukses', description: `Laporan berhasil dibuat dengan ${data.length} data.` });
            } else {
                toast({ variant: 'warning', title: 'Info', description: 'Tidak ada data yang ditemukan untuk rentang tanggal yang dipilih.' });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal membuat laporan.' });
        } finally {
            setIsLoading(false);
        }
    };

    const calculateSummary = (data: ReportTicket[]) => {
        const servedTickets = data.filter(t => t.status === 'done' && t.calledAt && t.completedAt);
        const totalWaitTime = servedTickets.reduce((acc, t) => acc + (t.calledAt!.getTime() - t.timestamp.getTime()), 0);
        const totalServeTime = servedTickets.reduce((acc, t) => acc + (t.completedAt!.getTime() - t.calledAt!.getTime()), 0);

        setSummary({
            total: data.length,
            avgWait: servedTickets.length > 0 ? (totalWaitTime / servedTickets.length) / (1000 * 60) : 0,
            avgServe: servedTickets.length > 0 ? (totalServeTime / servedTickets.length) / (1000 * 60) : 0,
        });
    };

    const formatDuration = (start?: Date, end?: Date) => {
        if (!start || !end) return '-';
        return formatDistanceStrict(end, start, { locale: localeID });
    };

    const handleDownload = () => {
        const dataToExport = reportData.map(ticket => ({
            "Nomor Tiket": ticket.number,
            "Layanan": ticket.serviceName,
            "Status": ticket.status,
            "Waktu Ambil": ticket.timestamp ? format(ticket.timestamp, 'dd/MM/yyyy HH:mm:ss') : '-',
            "Waktu Panggil": ticket.calledAt ? format(ticket.calledAt, 'dd/MM/yyyy HH:mm:ss') : '-',
            "Waktu Selesai": ticket.completedAt ? format(ticket.completedAt, 'dd/MM/yyyy HH:mm:ss') : '-',
            "Waktu Tunggu (menit)": ticket.calledAt ? differenceInMinutes(ticket.calledAt, ticket.timestamp) : 0,
            "Durasi Layanan (menit)": ticket.calledAt && ticket.completedAt ? differenceInMinutes(ticket.completedAt, ticket.calledAt) : 0,
            "Dilayani oleh": ticket.servedBy,
            "Loket": ticket.counter,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Antrian');
        XLSX.writeFile(workbook, `Laporan_Antrian_${format(date?.from || new Date(), 'yyyy-MM-dd')}_${format(date?.to || new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Laporan Sistem Antrian</CardTitle>
                    <CardDescription>Pilih rentang tanggal untuk melihat riwayat dan statistik antrian.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, "LLL dd, y")} -{" "}
                                {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pilih tanggal</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleGenerateReport} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isLoading ? 'Membuat Laporan...' : 'Buat Laporan'}
                    </Button>
                    {reportData.length > 0 && (
                         <Button variant="outline" onClick={handleDownload} className="ml-auto">
                            <Download className="mr-2 h-4 w-4"/>
                            Unduh Laporan (Excel)
                        </Button>
                    )}
                </CardContent>
            </Card>

            {summary && (
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tiket</CardTitle>
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata Waktu Tunggu</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.avgWait.toFixed(2)} menit</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata Waktu Pelayanan</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.avgServe.toFixed(2)} menit</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {reportData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Laporan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card">
                                <TableRow>
                                    <TableHead>No. Tiket</TableHead>
                                    <TableHead>Layanan</TableHead>
                                    <TableHead>Waktu Ambil</TableHead>
                                    <TableHead>Waktu Tunggu</TableHead>
                                    <TableHead>Durasi Layanan</TableHead>
                                    <TableHead>Petugas</TableHead>
                                    <TableHead>Loket</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map(ticket => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.number}</TableCell>
                                        <TableCell>{ticket.serviceName}</TableCell>
                                        <TableCell>{format(ticket.timestamp, 'HH:mm:ss')}</TableCell>
                                        <TableCell>{formatDuration(ticket.timestamp, ticket.calledAt)}</TableCell>
                                        <TableCell>{formatDuration(ticket.calledAt, ticket.completedAt)}</TableCell>
                                        <TableCell>{ticket.servedBy || '-'}</TableCell>
                                        <TableCell>{ticket.counter || '-'}</TableCell>
                                        <TableCell className="capitalize">{ticket.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};


const navItems = [
    { id: 'dashboard', label: 'Dasbor', icon: BarChart2, action: (setActiveTab: Function) => setActiveTab('dashboard') },
    { id: 'staff', label: 'Pengguna', icon: UserCog, action: (setActiveTab: Function) => setActiveTab('staff') },
    { id: 'counters', label: 'Loket', icon: Building, action: (setActiveTab: Function) => setActiveTab('counters') },
    { id: 'services', label: 'Layanan', icon: Settings, action: (setActiveTab: Function) => setActiveTab('services') },
    { id: 'display', label: 'Tampilan', icon: Palette, action: (setActiveTab: Function) => setActiveTab('display') },
    { id: 'monitor', label: 'Monitor', icon: Monitor, action: () => window.open('/monitor', '_blank') },
    { id: 'reports', label: 'Laporan', icon: FileText, action: (setActiveTab: Function) => setActiveTab('reports') },
]

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { logoutUser, state } = useQueue();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);


  React.useEffect(() => {
    if(state.authLoaded && !state.currentUser) {
        router.push('/login');
    }
     if(state.authLoaded && state.currentUser?.role !== 'admin') {
        toast({ variant: "destructive", title: "Akses Ditolak", description: "Hanya admin yang dapat mengakses halaman ini." });
        router.push('/login');
    }
  }, [state.currentUser, state.authLoaded, router, toast]);

  const handleLogout = async () => {
    try {
        await logoutUser();
        toast({ title: "Logout Berhasil", description: "Anda telah keluar dari sesi." });
        router.push('/login');
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Gagal melakukan logout." });
    }
  };

  const renderContent = () => {
    switch(activeTab) {
        case 'dashboard': return <DashboardTab />;
        case 'staff': return <StaffTab />;
        case 'counters': return <CounterTab />;
        case 'services': return <ServiceTab />;
        case 'display': return <DisplayTab />;
        case 'reports': return <ReportTab />;
        default: return <DashboardTab />;
    }
  }

  if (!state.authLoaded || !state.currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Memuat data...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card text-card-foreground border-r transition-all duration-300 ease-in-out",
        "flex-col hidden lg:flex",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex items-center justify-between h-20 border-b px-4">
             <Link href="/" className={cn("transition-opacity duration-300", !isSidebarOpen && "opacity-0 pointer-events-none")} title="Kembali ke Halaman Utama">
                <Image
                  src="/qnext-logo.svg"
                  alt="Qnext Logo"
                  width={140}
                  height={44}
                />
            </Link>
             <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="ml-auto">
                 {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </Button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
            {navItems.map(item => (
                <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'secondary' : 'ghost'}
                    className={cn(
                        "w-full justify-start",
                        !isSidebarOpen && "justify-center"
                    )}
                    onClick={() => item.action(setActiveTab)}
                >
                    <item.icon className="h-5 w-5"/>
                    <span className={cn(isSidebarOpen ? "ml-4" : "sr-only")}>{item.label}</span>
                </Button>
            ))}
        </nav>
        <div className="px-4 py-4 border-t">
            <Button variant="outline" onClick={handleLogout} className="w-full justify-center">
                <LogOut className="h-5 w-5"/>
                <span className={cn(isSidebarOpen ? "ml-4" : "sr-only")}>Logout</span>
            </Button>
             <div className={cn("mt-4 text-center text-xs text-muted-foreground", !isSidebarOpen && "sr-only")}>
                <p>Login sebagai</p>
                <p className="font-semibold truncate">{state.currentUser?.email}</p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
       <div className="flex-1 flex flex-col">
            <header className="bg-card shadow-sm sticky top-0 z-10 lg:hidden h-20 flex items-center px-4 justify-between">
                 <div className="flex items-center gap-4">
                    <Image
                      src="/qnext-logo.svg"
                      alt="Qnext Logo"
                      width={128}
                      height={40}
                    />
                </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <Menu/>
                </Button>
            </header>
            
            {/* Mobile Menu */}
             {isMobileMenuOpen && (
                <div className="lg:hidden bg-card border-b">
                    <nav className="flex flex-col p-4 space-y-1">
                         {navItems.map(item => (
                            <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                onClick={() => {
                                    item.action(setActiveTab);
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                <item.icon className="mr-2"/>
                                <span>{item.label}</span>
                            </Button>
                        ))}
                         <Button variant="outline" onClick={handleLogout} className="w-full justify-start">
                             <LogOut className="mr-2"/>
                            <span>Logout</span>
                        </Button>
                    </nav>
                </div>
            )}

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
               {renderContent()}
            </main>
        </div>
    </div>
  );
}
