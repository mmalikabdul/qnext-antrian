import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { counterService } from '../services/counter.service';
import { Counter } from '@/types/queue';

const CounterForm = ({ counter, onSave, closeDialog }: { counter?: Counter | null, onSave: (data: any) => Promise<void>, closeDialog: () => void }) => {
    const [name, setName] = useState(counter?.name || '');
    const [label, setLabel] = useState(counter?.label || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onSave({ name, label });
        setIsLoading(false);
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Nama Loket</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Contoh: Loket 1" />
            </div>
            <div className="space-y-2">
                <Label>Label Display (Opsional)</Label>
                <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Contoh: L1" />
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
        </form>
    );
};

export const CounterTab = () => {
    const [counters, setCounters] = useState<Counter[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
    const { toast } = useToast();

    const fetchCounters = () => counterService.getAll().then(setCounters);

    useEffect(() => {
        fetchCounters();
    }, []);

    const handleSave = async (data: any) => {
        try {
            if (editingCounter) {
                await counterService.update(editingCounter.id, data);
                toast({ variant: 'success', title: 'Sukses', description: 'Data loket diperbarui' });
            } else {
                await counterService.create(data);
                toast({ variant: 'success', title: 'Sukses', description: 'Loket baru ditambahkan' });
            }
            setIsAddOpen(false);
            setEditingCounter(null);
            fetchCounters();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Gagal', description: error.message });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin hapus loket ini?")) return;
        try {
            await counterService.delete(id);
            toast({ variant: 'success', title: 'Terhapus' });
            fetchCounters();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Gagal', description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between">
                <div>
                    <CardTitle>Manajemen Loket</CardTitle>
                    <CardDescription>Daftar loket pelayanan</CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingCounter(null)}><PlusCircle className="mr-2"/> Tambah</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Loket Baru</DialogTitle></DialogHeader>
                        <CounterForm onSave={handleSave} closeDialog={() => setIsAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {counters.map(c => (
                            <TableRow key={c.id}>
                                <TableCell>{c.name}</TableCell>
                                <TableCell>{c.label || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Dialog open={editingCounter?.id === c.id} onOpenChange={(open) => !open && setEditingCounter(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingCounter(c)}><Edit className="w-4 h-4"/></Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Edit Loket</DialogTitle></DialogHeader>
                                            <CounterForm counter={c} onSave={handleSave} closeDialog={() => setEditingCounter(null)} />
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
