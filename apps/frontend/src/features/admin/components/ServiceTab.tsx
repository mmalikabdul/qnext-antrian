import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { serviceService } from '../services/service.service';
import { Service } from '@/types/queue';

const ServiceForm = ({ service, onSave, closeDialog }: { service?: Service | null, onSave: (data: any) => Promise<void>, closeDialog: () => void }) => {
    const [name, setName] = useState(service?.name || '');
    const [code, setCode] = useState(service?.code || '');
    const [description, setDescription] = useState(service?.description || '');
    const [quota, setQuota] = useState(service?.quota?.toString() || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Convert quota to number or null/undefined
        const quotaValue = quota ? parseInt(quota) : null;
        await onSave({ name, code, description, quota: quotaValue });
        setIsLoading(false);
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Kode (Huruf A-Z)</Label>
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={1} required disabled={!!service} placeholder="A" />
            </div>
            <div className="space-y-2">
                <Label>Nama Layanan</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Customer Service" />
            </div>
            <div className="space-y-2">
                <Label>Kuota Harian (Opsional)</Label>
                <Input type="number" value={quota} onChange={e => setQuota(e.target.value)} placeholder="0 = Tidak terbatas" />
                <p className="text-xs text-muted-foreground">Batasi jumlah tiket per hari. Kosongkan jika tidak terbatas.</p>
            </div>
            <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Opsional" />
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
        </form>
    );
};

export const ServiceTab = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const { toast } = useToast();

    const fetchServices = () => serviceService.getAll().then(setServices);

    useEffect(() => {
        fetchServices();
    }, []);

    const handleSave = async (data: any) => {
        try {
            if (editingService) {
                await serviceService.update(editingService.id, data);
                toast({ variant: 'success', title: 'Sukses', description: 'Layanan diperbarui' });
            } else {
                await serviceService.create(data);
                toast({ variant: 'success', title: 'Sukses', description: 'Layanan baru ditambahkan' });
            }
            setIsAddOpen(false);
            setEditingService(null);
            fetchServices();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Gagal', description: error.message });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin hapus layanan ini?")) return;
        try {
            await serviceService.delete(id);
            toast({ variant: 'success', title: 'Terhapus' });
            fetchServices();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Gagal', description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between">
                <div>
                    <CardTitle>Manajemen Layanan</CardTitle>
                    <CardDescription>Daftar jenis layanan antrian</CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingService(null)}><PlusCircle className="mr-2"/> Tambah</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Layanan Baru</DialogTitle></DialogHeader>
                        <ServiceForm onSave={handleSave} closeDialog={() => setIsAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kode</TableHead>
                            <TableHead>Nama Layanan</TableHead>
                            <TableHead>Kuota</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-bold">{s.code}</TableCell>
                                <TableCell>{s.name}</TableCell>
                                <TableCell>
                                    {s.quota ? (
                                        <div className="flex flex-col">
                                            <span>{s.usedQuota} / {s.quota}</span>
                                            <div className="w-24 h-1 bg-secondary mt-1 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${((s.usedQuota || 0) / s.quota) >= 1 ? 'bg-destructive' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(100, ((s.usedQuota || 0) / s.quota) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col text-muted-foreground italic">
                                            <span>{s.usedQuota} / ∞</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>{s.description || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Dialog open={editingService?.id === s.id} onOpenChange={(open) => !open && setEditingService(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingService(s)}><Edit className="w-4 h-4"/></Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Edit Layanan</DialogTitle></DialogHeader>
                                            <ServiceForm service={s} onSave={handleSave} closeDialog={() => setEditingService(null)} />
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
