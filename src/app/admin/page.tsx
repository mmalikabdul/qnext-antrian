'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import { Users, Briefcase, Ticket, Clock, LogOut, BarChart2, Settings, UserCog, Building, FileText, PlusCircle, Edit, Trash2, Film, ChevronLeft, ChevronRight, Menu, Icon as IconType } from 'lucide-react';

import QNextLogo from '@/components/icons/q-next-logo';
import { useQueue } from '@/context/queue-context';
import type { Staff, Counter, Service, User } from '@/context/queue-context';
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

const StaffForm = ({ staff, onSave, closeDialog }: { staff?: (Staff & User) | null, onSave: (data: any) => Promise<void>, closeDialog: () => void }) => {
    const { state: { counters } } = useQueue();
    const [name, setName] = React.useState(staff?.name || '');
    const [email, setEmail] = React.useState(staff?.email || '');
    const [password, setPassword] = React.useState('');
    const [assignedCounters, setAssignedCounters] = React.useState<number[]>(staff?.counters || []);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const staffData: any = { name, counters: assignedCounters };
        if (staff?.uid) { // Editing existing staff
            staffData.uid = staff.uid;
        } else { // Adding new staff
            if (!email || !password) {
                alert("Email dan password harus diisi untuk petugas baru.");
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
                <Label htmlFor="staff-name">Nama Petugas</Label>
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
                </>
            )}
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
    const router = useRouter();
    const auth = getAuth(app);
    
    const combinedStaffData = staff.map(s => {
        const userData = users.find(u => u.uid === s.id);
        return { ...s, ...userData };
    });

    const handleSaveStaff = async (data: any) => {
        try {
            if (data.uid) { // Editing
                const staffData = { id: data.uid, name: data.name, counters: data.counters };
                await updateStaff(staffData);
                toast({ title: "Sukses", description: "Data petugas berhasil diperbarui." });
                setEditingStaff(null);
            } else { // Adding
                if (!currentUser) throw new Error("Admin user not found.");
                
                await addStaff(data);
                
                toast({ 
                    title: "Sukses", 
                    description: "Petugas baru berhasil ditambahkan. Anda akan logout. Silakan login kembali." 
                });
                setIsAddOpen(false);

                // Due to Firebase SDK limitations, admin will be logged out. 
                // We manually sign them out from the app state and redirect to login.
                await auth.signOut();
                logoutUser();
                router.push('/login');
            }
        } catch(e: any) {
            console.error("Failed to save staff:", e);
            const message = e.code === 'auth/email-already-in-use' 
                ? "Email sudah digunakan oleh akun lain."
                : `Gagal menyimpan data petugas: ${e.message}`;
            toast({ title: "Error", description: message, variant: "destructive" });
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
                    <CardDescription>Tambah, edit, atau hapus data petugas dan akun login mereka.</CardDescription>
                </div>
                 <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingStaff(null)}><PlusCircle className="mr-2"/> Tambah Petugas</Button>
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
                            <TableHead>Email</TableHead>
                            <TableHead>Loket yang Dilayani</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {combinedStaffData.filter(s => s.role === 'staff').map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                 <TableCell>{s.email}</TableCell>
                                <TableCell>{s.counters.map(getCounterName).join(', ')}</TableCell>
                                <TableCell className="text-right">
                                     <Dialog open={editingStaff?.id === s.id} onOpenChange={(isOpen) => !isOpen && setEditingStaff(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingStaff(s as (Staff & User))}><Edit className="h-4 w-4"/></Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Petugas</DialogTitle>
                                            </DialogHeader>
                                            <StaffForm staff={s as (Staff & User)} onSave={handleSaveStaff} closeDialog={() => setEditingStaff(null)} />
                                        </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                                <AlertDialogDescription>Tindakan ini akan menghapus akun login dan data petugas secara permanen.</AlertDialogDescription>
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
                    {counters && counters.map(counter => (
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
                toast({ title: "Sukses", description: "Layanan berhasil diperbarui." });
            } else {
                await addService(data);
                toast({ title: "Sukses", description: "Layanan baru berhasil ditambahkan." });
            }
            setEditingService(null);
            setIsAddOpen(false); // Close dialog on success
        } catch(e) {
            console.error(e);
            toast({ title: "Error", description: "Gagal menyimpan layanan. Pastikan ID unik.", variant: "destructive" });
        }
    }

    const handleDeleteService = async (id: string) => {
        try {
            await deleteService(id);
            // Toast is handled inside context now
        } catch(e) {
             toast({ title: "Error", description: "Gagal menghapus layanan.", variant: "destructive" });
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
                        {services.map(s => {
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

const VideoTab = () => {
    const { state: { videoUrl }, updateVideoUrl } = useQueue();
    const [url, setUrl] = React.useState(videoUrl);
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        setUrl(videoUrl);
    }, [videoUrl]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateVideoUrl(url);
            toast({ title: "Sukses", description: "URL Video berhasil diperbarui." });
        } catch (error) {
            toast({ title: "Error", description: "Gagal memperbarui URL video.", variant: "destructive" });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manajemen Video Monitor</CardTitle>
                <CardDescription>
                    Atur video atau playlist YouTube yang akan ditampilkan di layar monitor antrian.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="video-url">URL Playlist YouTube</Label>
                    <Input 
                        id="video-url" 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/embed/videoseries?list=..."
                    />
                    <p className="text-sm text-muted-foreground">
                        Pastikan Anda menggunakan URL "embed" dari YouTube. Contoh: <strong>https://www.youtube.com/embed/videoseries?list=PL2_3w_50q_p_4i_t_aA-i1l_n5s-ZqGcB</strong>
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
            </CardContent>
        </Card>
    );
};


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

const navItems = [
    { id: 'dashboard', label: 'Dasbor', icon: BarChart2 },
    { id: 'staff', label: 'Petugas', icon: UserCog },
    { id: 'counters', label: 'Loket', icon: Building },
    { id: 'services', label: 'Layanan', icon: Settings },
    { id: 'video', label: 'Video', icon: Film },
    { id: 'reports', label: 'Laporan', icon: FileText },
]

export default function AdminPage() {
  const router = useRouter();
  const auth = getAuth(app);
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
        toast({ title: "Akses Ditolak", description: "Hanya admin yang dapat mengakses halaman ini.", variant: "destructive" });
        router.push('/login');
    }
  }, [state.currentUser, state.authLoaded, router, toast]);

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

  const renderContent = () => {
    switch(activeTab) {
        case 'dashboard': return <DashboardTab />;
        case 'staff': return <StaffTab />;
        case 'counters': return <CounterTab />;
        case 'services': return <ServiceTab />;
        case 'video': return <VideoTab />;
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
             <div className={cn("flex items-center gap-2 transition-opacity duration-300", isSidebarOpen ? 'opacity-100' : 'opacity-0')}>
                <QNextLogo className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-primary tracking-tight whitespace-nowrap">
                    Dasbor Admin
                </h1>
            </div>
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
                    onClick={() => setActiveTab(item.id)}
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
                 <div className="flex items-center gap-2">
                    <QNextLogo className="h-8 w-8 text-primary" />
                    <h1 className="text-xl font-bold text-primary">Dasbor Admin</h1>
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
                                    setActiveTab(item.id);
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
