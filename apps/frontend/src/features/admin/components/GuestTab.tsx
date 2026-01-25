import React, { useEffect, useState } from 'react';
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { guestService, Booking } from '../services/guest.service';
import { Search, FileText, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';

import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

export function GuestTab() {
    const [data, setData] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // -- State untuk INPUT UI (Belum diapply) --
    const [search, setSearch] = useState("");
    const [inputDate, setInputDate] = useState("");
    const [inputStatus, setInputStatus] = useState("ALL");
    
    // -- State untuk FILTER AKTIF (Digunakan fetch data) --
    const [activeSearch, setActiveSearch] = useState(""); 
    const [activeDate, setActiveDate] = useState("");
    const [activeStatus, setActiveStatus] = useState("ALL");

    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

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
        fetchData();
    }, [page, activeSearch, activeStatus, activeDate]); // Reload hanya saat ACTIVE filter berubah

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setPage(1);
        // Apply nilai input ke filter aktif
        setActiveSearch(search);
        setActiveDate(inputDate);
        setActiveStatus(inputStatus);
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            // Download menggunakan filter yang SEDANG AKTIF (hasil pencarian terakhir)
            await guestService.downloadExcel(activeSearch, activeStatus, activeDate);
        } catch (error) {
            console.error("Gagal download excel:", error);
            alert("Gagal mengunduh file Excel.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-col gap-4 space-y-0 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Daftar Tamu</CardTitle>
                            <CardDescription>Kelola dan pantau data booking antrian online</CardDescription>
                        </div>
                        <Button variant="outline" onClick={handleDownload} disabled={downloading}>
                            {downloading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            Excel
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between border-t pt-4">
                         {/* Filter Group - Dibungkus form agar Enter key men-trigger handleSearch */}
                         <form onSubmit={handleSearch} className="flex flex-col sm:flex-row w-full gap-4 items-end sm:items-center justify-between">
                            
                             <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
                                {/* Filter Tanggal */}
                                <div className="grid gap-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">Tgl Pendaftaran</span>
                                    <Input 
                                        type="date" 
                                        className="w-[150px]"
                                        value={inputDate}
                                        onChange={(e) => setInputDate(e.target.value)}
                                    />
                                </div>

                                {/* Filter Status */}
                                <div className="grid gap-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">Status</span>
                                    <Select value={inputStatus} onValueChange={(val) => setInputStatus(val)}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Semua</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="USED">Selesai (Used)</SelectItem>
                                            <SelectItem value="EXPIRED">Expired</SelectItem>
                                            <SelectItem value="CANCELLED">Batal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>

                            {/* Search Group */}
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
                                    <TableHead className="px-2">Jenis Booking</TableHead>
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
                                            <TableCell className="px-2">
                                                <Badge variant="secondary" className="text-[10px] px-1 h-5">
                                                    {item.jenisBooking || 'ONLINE'}
                                                </Badge>
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
        </div>
    );
}
