import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { staffService } from '../services/staff.service';
import { counterService } from '../services/counter.service';
import { User } from '@/types/auth';
import { Counter } from '@/types/queue';

const StaffForm = ({ staff, onSave, closeDialog }: { staff?: User | null, onSave: (data: any) => Promise<void>, closeDialog: () => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'STAFF' | 'GREETER'>('STAFF');
    const [counters, setCounters] = useState<Counter[]>([]);
    const [assignedCounters, setAssignedCounters] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Populate data saat 'staff' prop berubah
    useEffect(() => {
        if (staff) {
            // Mode Edit: Isi form dengan data user
            setName(staff.name || '');
            setEmail(staff.email || '');
            setRole((staff.role as any) || 'STAFF');
            setAssignedCounters(staff.counters || []);
            setPassword(''); // Password kosongkan (hanya diisi jika ingin ganti)
        } else {
            // Mode Tambah / Reset: Kosongkan form
            setName('');
            setEmail('');
            setRole('STAFF');
            setAssignedCounters([]);
            setPassword('');
        }
    }, [staff]);

    useEffect(() => {
        counterService.getAll().then(setCounters);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const data: any = { name, role };
        if (role === 'STAFF') data.counters = assignedCounters;
        
        if (!staff) {
             data.email = email;
             data.password = password;
        } else {
             if (password) data.password = password;
        }

        await onSave(data);
        setIsLoading(false);
        closeDialog();
        
        // Reset form manual (optional, karena useEffect di atas sudah handle reset saat staff=null)
        if (!staff) {
            setName('');
            setEmail('');
            setPassword('');
            setRole('STAFF');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {/* Pindah Posisi ke Atas */}
             <div className="space-y-2">
                <Label>Peran</Label>
                <RadioGroup value={role} onValueChange={(v: any) => setRole(v)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="STAFF" id="r1" />
                        <Label htmlFor="r1">Staff</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ADMIN" id="r2" />
                        <Label htmlFor="r2">Admin</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="GREETER" id="r3" />
                        <Label htmlFor="r3">Greeter</Label>
                    </div>
                </RadioGroup>
            </div>

             <div className="space-y-2">
                <Label>Nama</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            {!staff && (
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
            )}
             <div className="space-y-2">
                <Label>{staff ? 'Password Baru (Opsional)' : 'Password'}</Label>
                <div className="relative">
                    <Input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required={!staff}
                        className="pr-10" 
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">Toggle password visibility</span>
                    </Button>
                </div>
            </div>
            
            {role === 'STAFF' && (
                 <div className="space-y-2">
                    <Label>Loket</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {counters.map(c => (
                            <div key={c.id} className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={assignedCounters.includes(c.id)}
                                    onChange={e => {
                                        if(e.target.checked) setAssignedCounters([...assignedCounters, c.id]);
                                        else setAssignedCounters(assignedCounters.filter(id => id !== c.id));
                                    }}
                                />
                                <Label>{c.name}</Label>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
        </form>
    );
};

export const StaffTab = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<User | null>(null);
    const { toast } = useToast();

    // Filter States
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    
    // Active Filters (Triggered by Search Button)
    const [activeSearch, setActiveSearch] = useState("");
    const [activeRole, setActiveRole] = useState("ALL");

    const fetchUsers = () => staffService.getAll(activeSearch, activeRole).then(setUsers);

    useEffect(() => {
        fetchUsers();
    }, [activeSearch, activeRole]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveSearch(search);
        setActiveRole(roleFilter);
    };

    const handleEditClick = async (user: User) => {
        try {
            // Fetch fresh data before editing
            const freshUser = await staffService.getById(user.id);
            setEditingStaff(freshUser);
            setIsAddOpen(true);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal mengambil data user terbaru.' });
        }
    };

    const handleSave = async (data: any) => {
        try {
            if (editingStaff) {
                await staffService.update(editingStaff.id, data);
                toast({ variant: 'success', title: 'Sukses', description: 'Data user diupdate' });
            } else {
                await staffService.create(data);
                toast({ variant: 'success', title: 'Sukses', description: 'User baru dibuat' });
            }
            setIsAddOpen(false);
            setEditingStaff(null);
            fetchUsers();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Gagal', description: error.message });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin hapus user ini?")) return;
        try {
            await staffService.delete(id);
            toast({ variant: 'success', title: 'Terhapus' });
            fetchUsers();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Gagal', description: error.message });
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 pb-4">
                <div className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Manajemen User</CardTitle>
                        <CardDescription>Kelola Admin & Staff</CardDescription>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={(open) => {
                        setIsAddOpen(open);
                        if (!open) setEditingStaff(null); // Reset editingStaff saat dialog ditutup
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingStaff(null)}><PlusCircle className="mr-2"/> Tambah</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>{editingStaff ? 'Edit User' : 'User Baru'}</DialogTitle></DialogHeader>
                            <StaffForm staff={editingStaff} onSave={handleSave} closeDialog={() => setIsAddOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
                
                {/* Search & Filter Section */}
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                     <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
                        <div className="grid gap-1.5 w-full sm:w-auto">
                            <span className="text-xs font-medium text-muted-foreground">Cari (Nama/Email)</span>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari user..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Role</span>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="STAFF">Staff</SelectItem>
                                    <SelectItem value="GREETER">Greeter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <span className="text-xs font-medium text-transparent">Action</span>
                            <Button type="submit">Cari</Button>
                        </div>
                     </div>
                </form>

            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(u => (
                            <TableRow key={u.id}>
                                <TableCell>{u.name}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>{u.role}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(u)}><Edit className="w-4 h-4"/></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(u.id)}><Trash2 className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};