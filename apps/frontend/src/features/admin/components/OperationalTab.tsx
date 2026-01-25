import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, PlusCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { holidayService, Holiday } from '../services/holiday.service';
import { serviceService } from '../services/service.service';
import { Service } from '@/types/queue';

const HolidayForm = ({ holiday, onSave, closeDialog }: { holiday?: Holiday | null, onSave: (data: any) => Promise<void>, closeDialog: () => void }) => {
    const [date, setDate] = useState(holiday?.date ? new Date(holiday.date).toISOString().split('T')[0] : '');
    const [description, setDescription] = useState(holiday?.description || '');
    const [isActive, setIsActive] = useState(holiday?.isActive ?? true);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onSave({ date, description, isActive });
        setIsLoading(false);
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} required placeholder="Contoh: Hari Raya Idul Fitri" />
            </div>
            <div className="flex items-center space-x-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Status Aktif</Label>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
        </form>
    );
};

const WorkingHoursForm = ({ service, onSave, closeDialog }: { service: Service, onSave: (id: number, data: any) => Promise<void>, closeDialog: () => void }) => {
    const [startTime, setStartTime] = useState(service.startTime || '08:00');
    const [endTime, setEndTime] = useState(service.endTime || '15:00');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onSave(service.id, { startTime, endTime });
        setIsLoading(false);
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Jam Buka</Label>
                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label>Jam Tutup</Label>
                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
        </form>
    );
};

export const OperationalTab = () => {
    const { toast } = useToast();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    
    // States for Dialogs
    const [isHolidayOpen, setIsHolidayOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const fetchHolidays = () => holidayService.getAll().then(setHolidays);
    const fetchServices = () => serviceService.getAll().then(setServices);

    useEffect(() => {
        fetchHolidays();
        fetchServices();
    }, []);

    // Holiday Actions
    const handleSaveHoliday = async (data: any) => {
        try {
            if (editingHoliday) {
                await holidayService.update(editingHoliday.id, data);
                toast({ variant: 'success', title: 'Sukses', description: 'Hari libur diperbarui' });
            } else {
                await holidayService.create(data);
                toast({ variant: 'success', title: 'Sukses', description: 'Hari libur ditambahkan' });
            }
            fetchHolidays();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Gagal', description: error.message });
        }
    };

    const handleDeleteHoliday = async (id: number) => {
        if (!confirm("Hapus hari libur ini?")) return;
        try {
            await holidayService.delete(id);
            fetchHolidays();
            toast({ variant: 'success', title: 'Terhapus' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Gagal', description: error.message });
        }
    };

    // Service Hours Actions
    const handleSaveServiceHours = async (id: number, data: any) => {
        try {
            await serviceService.update(id, data);
            toast({ variant: 'success', title: 'Sukses', description: 'Jam kerja diperbarui' });
            fetchServices();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Gagal', description: error.message });
        }
    };

    return (
        <Tabs defaultValue="holidays" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="holidays">Hari Libur</TabsTrigger>
                <TabsTrigger value="hours">Jam Kerja Layanan</TabsTrigger>
            </TabsList>
            
            {/* Tab Hari Libur */}
            <TabsContent value="holidays">
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle>Hari Libur</CardTitle>
                            <CardDescription>Kelola tanggal merah atau libur operasional</CardDescription>
                        </div>
                        <Dialog open={isHolidayOpen} onOpenChange={setIsHolidayOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setEditingHoliday(null)}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Tambah
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingHoliday ? 'Edit Hari Libur' : 'Tambah Hari Libur'}</DialogTitle>
                                </DialogHeader>
                                <HolidayForm holiday={editingHoliday} onSave={handleSaveHoliday} closeDialog={() => setIsHolidayOpen(false)} />
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Hari</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {holidays.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">Belum ada data.</TableCell>
                                        </TableRow>
                                    ) : holidays.map(h => {
                                        const dateObj = new Date(h.date);
                                        return (
                                            <TableRow key={h.id}>
                                                <TableCell>
                                                    {dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell>
                                                    {dateObj.toLocaleDateString('id-ID', { weekday: 'long' })}
                                                </TableCell>
                                                <TableCell>{h.description}</TableCell>
                                                <TableCell>
                                                    <Badge variant={h.isActive ? 'default' : 'secondary'}>
                                                        {h.isActive ? 'Aktif' : 'Tidak Aktif'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        setEditingHoliday(h);
                                                        setIsHolidayOpen(true);
                                                    }}>
                                                        <Edit className="h-4 w-4"/>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteHoliday(h.id)}>
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Tab Jam Kerja */}
            <TabsContent value="hours">
                <Card>
                    <CardHeader>
                        <CardTitle>Jam Kerja Layanan</CardTitle>
                        <CardDescription>Atur jam operasional untuk setiap layanan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Layanan</TableHead>
                                        <TableHead>Jam Buka</TableHead>
                                        <TableHead>Jam Tutup</TableHead>
                                        <TableHead>Status Saat Ini</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.name}</TableCell>
                                            <TableCell>{s.startTime}</TableCell>
                                            <TableCell>{s.endTime}</TableCell>
                                            <TableCell>
                                                <Badge variant={s.isOpen ? 'default' : 'destructive'}>
                                                    {s.statusMessage || (s.isOpen ? 'Buka' : 'Tutup')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog open={editingService?.id === s.id} onOpenChange={(open) => !open && setEditingService(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" onClick={() => setEditingService(s)}>
                                                            <Clock className="mr-2 h-4 w-4"/> Atur Jam
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Atur Jam Kerja - {s.name}</DialogTitle>
                                                        </DialogHeader>
                                                        <WorkingHoursForm service={s} onSave={handleSaveServiceHours} closeDialog={() => setEditingService(null)} />
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};
