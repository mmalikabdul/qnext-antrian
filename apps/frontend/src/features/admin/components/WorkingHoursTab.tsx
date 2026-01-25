import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { serviceService } from '../services/service.service';
import { Service } from '@/types/queue';

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

export const WorkingHoursTab = () => {
    const { toast } = useToast();
    const [services, setServices] = useState<Service[]>([]);
    
    const [editingService, setEditingService] = useState<Service | null>(null);

    const fetchServices = () => serviceService.getAll().then(setServices);

    useEffect(() => {
        fetchServices();
    }, []);

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
    );
};
