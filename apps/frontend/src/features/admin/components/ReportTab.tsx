import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, Clock, Download } from 'lucide-react';
import { reportService } from '../services/report.service';
import { serviceService } from '../services/service.service';
import { counterService } from '../services/counter.service';
import { Ticket, Service, Counter } from '@/types/queue';
import { useToast } from '@/hooks/use-toast';

export const ReportTab = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [counters, setCounters] = useState<Counter[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [downloading, setDownloading] = useState(false);
    const { toast } = useToast();
    
    // Filter States
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [serviceId, setServiceId] = useState("ALL");
    const [counterId, setCounterId] = useState("ALL");

    // Active Filters
    const [activeFilters, setActiveFilters] = useState({
        start: "", end: "", service: "ALL", counter: "ALL"
    });

    useEffect(() => {
        // Load filter options
        serviceService.getAll().then(setServices).catch(console.error);
        counterService.getAll().then(setCounters).catch(console.error);
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await reportService.getAll(
                page, 10, 
                activeFilters.start, 
                activeFilters.end, 
                activeFilters.service, 
                activeFilters.counter
            );
            setTickets(res.data);
            setTotalPages(res.meta.totalPages);
        } catch (error) {
            console.error("Gagal mengambil laporan:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [page, activeFilters]);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setActiveFilters({
            start: startDate,
            end: endDate,
            service: serviceId,
            counter: counterId
        });
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await reportService.downloadExcel(
                activeFilters.start, 
                activeFilters.end, 
                activeFilters.service, 
                activeFilters.counter
            );
        } catch (error) {
            console.error("Gagal download excel:", error);
            toast({ variant: "destructive", title: "Gagal", description: "Gagal mengunduh file Excel." });
        } finally {
            setDownloading(false);
        }
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const calculateDuration = (start?: string, end?: string) => {
        if (!start || !end) return "-";
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diffMs = endTime - startTime;
        
        if (diffMs < 0) return "0m 0s";

        const diffMins = Math.floor(diffMs / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        
        return `${diffMins}m ${diffSecs}s`;
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-col gap-4 space-y-0 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Laporan Antrian</CardTitle>
                            <CardDescription>Riwayat dan durasi pelayanan tiket</CardDescription>
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
                    
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3 border-t pt-4">
                        <div className="grid gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Dari Tanggal</span>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[140px]" />
                        </div>
                        <div className="grid gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Sampai Tanggal</span>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[140px]" />
                        </div>
                        <div className="grid gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Layanan</span>
                            <Select value={serviceId} onValueChange={setServiceId}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Semua Layanan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Layanan</SelectItem>
                                    {services.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Loket</span>
                            <Select value={counterId} onValueChange={setCounterId}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Semua Loket" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Loket</SelectItem>
                                    {counters.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit">Cari</Button>
                    </form>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>Nomor Tiket</TableHead>
                                    <TableHead>Kode Booking</TableHead>
                                    <TableHead>Jenis Booking</TableHead>
                                    <TableHead>Layanan</TableHead>
                                    <TableHead>Loket</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Durasi Layanan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Memuat data...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : tickets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            Tidak ada data laporan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tickets.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDateTime(t.createdAt)}
                                            </TableCell>
                                            <TableCell className="font-bold text-lg">
                                                {t.number}
                                            </TableCell>
                                            <TableCell>
                                                {t.booking ? (
                                                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{t.booking.code}</span>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {t.booking?.jenisBooking ? (
                                                    <Badge variant="outline">{t.booking.jenisBooking}</Badge>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell>{t.service?.name}</TableCell>
                                            <TableCell>{t.counter?.name || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    t.status === 'DONE' ? 'default' :
                                                    t.status === 'SERVING' ? 'secondary' :
                                                    t.status === 'WAITING' ? 'outline' : 'destructive'
                                                }>
                                                    {t.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {t.status === 'DONE' ? (
                                                    <div className="flex items-center justify-end gap-1 text-blue-600">
                                                        <Clock size={14} />
                                                        {calculateDuration(t.startedAt, t.finishedAt)}
                                                    </div>
                                                ) : "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

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
        </div>
    );
};
