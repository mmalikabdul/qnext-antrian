'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { 
    Search, FileText, ChevronLeft, ChevronRight, Loader2, Download, LogOut, PlusCircle, Calendar as CalendarIcon 
} from 'lucide-react';
import Image from 'next/image';
import { cn } from "@/lib/utils";

import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { guestService, Booking } from '@/features/admin/services/guest.service';
import { serviceService } from '@/features/admin/services/service.service';
import { holidayService } from '@/features/admin/services/holiday.service';
import { Service } from '@/types/queue';

export default function GreeterPage() {
    const router = useRouter();
    const { user, logout, isLoading: authLoading } = useAuth();
    const { toast } = useToast();

    // -- State Table & Filter --
    const [data, setData] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // State Input Filter
    const [search, setSearch] = useState("");
    const [inputDate, setInputDate] = useState<Date | undefined>(undefined);
    const [inputStatus, setInputStatus] = useState("ALL");

    // State Active Filter
    const [activeSearch, setActiveSearch] = useState("");
    const [activeDate, setActiveDate] = useState(""); // Tetap string untuk query API
    const [activeStatus, setActiveStatus] = useState("ALL");

    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [holidays, setHolidays] = useState<Date[]>([]);
    const [isTodayHoliday, setIsTodayHoliday] = useState(false);

    // -- State Form Tambah Tamu --
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [submitting, setSubmitting] = useState(false);
    
    // Form Fields
    const [formData, setFormData] = useState({
        namaPerusahaan: '',
        nama: '',
        nib: '',
        email: '',
        issueDescription: '',
        serviceId: ''
    });

    // Proteksi Halaman
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user && user.role !== 'GREETER') {
            toast({ variant: "destructive", title: "Akses Ditolak", description: "Hanya Greeter yang dapat mengakses halaman ini." });
            router.push('/'); 
        }
    }, [user, authLoading, router, toast]);

    // Fetch Services & Holidays
    useEffect(() => {
        serviceService.getAll().then(setServices).catch(console.error);
        holidayService.getActiveHolidays().then((dates) => {
            setHolidays(dates);
            // Cek Hari Ini
            const now = new Date();
            const todayHoliday = dates.some(h => 
                h.getFullYear() === now.getFullYear() &&
                h.getMonth() === now.getMonth() &&
                h.getDate() === now.getDate()
            );
            setIsTodayHoliday(todayHoliday);
        }).catch(console.error);
    }, []);

    // Fetch Data Tamu
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await guestService.getAll(page, 10, activeSearch, activeStatus, activeDate);
            setData(res.data);
            setTotalPages(res.meta.totalPages);
        } catch (error) {
            console.error("Gagal mengambil data tamu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [page, activeSearch, activeStatus, activeDate, user]);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setPage(1);
        setActiveSearch(search);
        setActiveStatus(inputStatus);
        // Format Date object ke string YYYY-MM-DD
        if (inputDate) {
            const year = inputDate.getFullYear();
            const month = String(inputDate.getMonth() + 1).padStart(2, '0');
            const day = String(inputDate.getDate()).padStart(2, '0');
            setActiveDate(`${year}-${month}-${day}`);
        } else {
            setActiveDate("");
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await guestService.downloadExcel(activeSearch, activeStatus, activeDate);
        } catch (error) {
            console.error("Gagal download excel:", error);
            toast({ variant: "destructive", title: "Gagal", description: "Gagal mengunduh file Excel." });
        } finally {
            setDownloading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    // Handle Submit Form Tambah Tamu
    const handleSubmitGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.serviceId) {
            toast({ variant: "destructive", title: "Validasi", description: "Pilih layanan terlebih dahulu." });
            return;
        }

        setSubmitting(true);
        try {
            // Format Date ke YYYY-MM-DD (Hari ini)
            // Menggunakan waktu lokal Jakarta
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            await guestService.create({
                namaPerusahaan: formData.namaPerusahaan,
                nama: formData.nama,
                nib: formData.nib,
                email: formData.email,
                issueDescription: formData.issueDescription,
                serviceId: Number(formData.serviceId),
                date: dateStr,
                jenisBooking: 'OFFLINE'
            });

            toast({ variant: "success", title: "Berhasil", description: "Tamu berhasil ditambahkan." });
            setIsAddOpen(false);
            
            // Reset Form
            setFormData({
                namaPerusahaan: '',
                nama: '',
                nib: '',
                email: '',
                issueDescription: '',
                serviceId: ''
            });

            // Refresh Table
            fetchData();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Gagal", description: error.message || "Gagal menambahkan tamu." });
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || !user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b h-16 px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Image src="/qnext-logo.svg" alt="Qnext" width={120} height={40} />
                    <div className="h-6 w-px bg-gray-200 mx-2"></div>
                    <span className="font-semibold text-gray-700">Greeter Dashboard</span>
                </div>
                <div className="flex items-center gap-4">
                     <span className="text-sm text-gray-500">Halo, {user.name}</span>
                     <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="w-4 h-4 mr-2" />
                        Keluar
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
                
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>Daftar Tamu</CardTitle>
                                <CardDescription>Kelola kedatangan dan data tamu manual</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleDownload} disabled={downloading}>
                                    {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                    Excel
                                </Button>
                                
                                {/* Tombol Tambah Tamu */}
                                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                    <DialogTrigger asChild>
                                        <Button disabled={isTodayHoliday}>
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            {isTodayHoliday ? "Libur" : "Tambah Tamu"}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle>Tambah Tamu Baru</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleSubmitGuest} className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Nama Tamu</Label>
                                                <Input 
                                                    required
                                                    value={formData.nama}
                                                    onChange={e => setFormData({...formData, nama: e.target.value})}
                                                    placeholder="Nama Lengkap Tamu"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Nama Perusahaan / Penanggung Jawab</Label>
                                                <Input 
                                                    required
                                                    value={formData.namaPerusahaan}
                                                    onChange={e => setFormData({...formData, namaPerusahaan: e.target.value})}
                                                    placeholder="Contoh: PT. Maju Jaya / Budi"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Nomor NIB</Label>
                                                    <Input 
                                                        value={formData.nib}
                                                        onChange={e => setFormData({...formData, nib: e.target.value})}
                                                        placeholder="Nomor Induk Berusaha"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Email</Label>
                                                    <Input 
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                                        placeholder="email@example.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Layanan</Label>
                                                <Select 
                                                    value={formData.serviceId} 
                                                    onValueChange={val => setFormData({...formData, serviceId: val})}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Layanan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {services.map(s => (
                                                            <SelectItem key={s.id} value={String(s.id)}>
                                                                {s.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Kendala / Keperluan</Label>
                                                <Textarea 
                                                    required
                                                    value={formData.issueDescription}
                                                    onChange={e => setFormData({...formData, issueDescription: e.target.value})}
                                                    placeholder="Jelaskan keperluan tamu..."
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={submitting}>
                                                    {submitting ? 'Menyimpan...' : 'Simpan Booking'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Filter Section */}
                        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between border-t pt-4">
                            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row w-full gap-4 items-end sm:items-center justify-between">
                                <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
                                                                    <div className="grid gap-1.5">
                                                                        <span className="text-xs font-medium text-muted-foreground">Tgl Pendaftaran</span>
                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <Button
                                                                                    variant={"outline"}
                                                                                    className={cn(
                                                                                        "w-[160px] justify-start text-left font-normal text-xs h-9",
                                                                                        !inputDate && "text-muted-foreground"
                                                                                    )}
                                                                                >
                                                                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                                                                    {inputDate ? format(inputDate, "dd/MM/yyyy") : <span>Pilih Tanggal</span>}
                                                                                </Button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                                                                            <Calendar
                                                                                                                                mode="single"
                                                                                                                                selected={inputDate}
                                                                                                                                onSelect={setInputDate}
                                                                                                                                initialFocus
                                                                                                                            />
                                                                                
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                    </div>
                                    
                                    <div className="grid gap-1.5">
                                        <span className="text-xs font-medium text-muted-foreground">Status</span>
                                        <Select value={inputStatus} onValueChange={(val) => setInputStatus(val)}>
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Semua</SelectItem>
                                                <SelectItem value="PENDING">Pending</SelectItem>
                                                <SelectItem value="USED">Selesai</SelectItem>
                                                <SelectItem value="EXPIRED">Expired</SelectItem>
                                                <SelectItem value="CANCELLED">Batal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari tamu..."
                                            className="pl-8"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit">Cari</Button>
                                </div>
                            </form>
                        </div>
                    </CardHeader>

                    {/* Table Content */}
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap px-2">ID Booking</TableHead>
                                        <TableHead className="px-2">No. Tiket</TableHead>
                                        <TableHead className="px-2">Tgl Pendaftaran</TableHead>
                                        <TableHead className="px-2">Nama</TableHead>
                                        <TableHead className="px-2">Nama Perusahaan</TableHead>
                                        <TableHead className="px-2">Email</TableHead>
                                        <TableHead className="px-2">NIB</TableHead>
                                        <TableHead className="px-2">Deskripsi Kendala</TableHead>
                                        <TableHead className="px-2">Layanan</TableHead>
                                        <TableHead className="px-2">Status</TableHead>
                                        <TableHead className="text-right px-2">Dokumen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="h-24 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat data...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="h-24 text-center text-sm">
                                                Tidak ada data tamu ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium whitespace-nowrap px-2">{item.code}</TableCell>
                                                <TableCell className="px-2">
                                                    {item.ticket ? (
                                                        <Badge variant="outline" className="font-mono text-[10px] px-1 h-5">
                                                            {item.ticket.number}
                                                        </Badge>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground px-2 whitespace-nowrap">
                                                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="px-2">{item.nama || "-"}</TableCell>
                                                <TableCell className="px-2">{item.namaPerusahaan || "-"}</TableCell>
                                                <TableCell className="px-2">{item.email || "-"}</TableCell>
                                                <TableCell className="px-2">{item.nib || "-"}</TableCell>
                                                <TableCell className="max-w-[150px] truncate px-2" title={item.issueDescription || ""}>
                                                    {item.issueDescription || "-"}
                                                </TableCell>
                                                <TableCell className="px-2">{item.service?.name}</TableCell>
                                                <TableCell className="px-2">
                                                    <Badge variant={
                                                        item.status === 'USED' ? 'default' : 
                                                        item.status === 'PENDING' ? 'outline' : 'secondary'
                                                    } className="text-[10px] px-1 h-5">
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right px-2">
                                                    {item.fileUrl ? (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="text-blue-600 hover:text-blue-800 h-7 text-[10px] px-2"
                                                            onClick={() => setSelectedDoc(item.fileUrl || "")}
                                                        >
                                                            <FileText className="h-3 w-3 mr-1" />
                                                            Lihat
                                                        </Button>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[10px]">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-end space-x-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <div className="text-sm font-medium">
                                Halaman {page} dari {totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Document Preview Modal */}
                <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
                    <DialogContent className="max-w-4xl h-[80vh]">
                        <DialogHeader>
                            <DialogTitle>Dokumen Kendala</DialogTitle>
                        </DialogHeader>
                        {selectedDoc && (
                            <div className="flex-1 w-full h-full border rounded-md overflow-hidden bg-gray-100">
                                <iframe 
                                    src={selectedDoc} 
                                    className="w-full h-full" 
                                    title="Dokumen Preview"
                                />
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
