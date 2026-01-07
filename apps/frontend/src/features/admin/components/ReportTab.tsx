import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Download, Loader2, Ticket, Clock, Briefcase } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import { useToast } from '@/hooks/use-toast';
import { adminService } from '../services/admin.service';
import { Ticket as TicketType } from '@/types/queue';
import { cn } from '@/lib/utils';

export const ReportTab = () => {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });
    const [reportData, setReportData] = useState<TicketType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerateReport = async () => {
        if (!date?.from || !date?.to) {
            toast({ variant: 'warning', title: 'Pilih Tanggal', description: 'Silakan pilih rentang tanggal' });
            return;
        }
        
        setIsLoading(true);
        setReportData([]);

        try {
            const startDate = format(date.from, 'yyyy-MM-dd');
            const endDate = format(date.to, 'yyyy-MM-dd');
            
            const data = await adminService.getReport(startDate, endDate);
            setReportData(data);
            
            if (data.length === 0) toast({ variant: 'warning', title: 'Info', description: 'Tidak ada data' });

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal ambil data laporan' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Laporan Antrian</CardTitle>
                    <CardDescription>Pilih tanggal laporan</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
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
                        {isLoading ? <Loader2 className="animate-spin mr-2"/> : null}
                        Tampilkan
                    </Button>
                </CardContent>
            </Card>

            {reportData.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Hasil Laporan ({reportData.length} Tiket)</CardTitle></CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Tiket</TableHead>
                                        <TableHead>Layanan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Waktu Masuk</TableHead>
                                        <TableHead>Terakhir Update</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-bold">{t.number}</TableCell>
                                            <TableCell>{t.service?.name}</TableCell>
                                            <TableCell>{t.status}</TableCell>
                                            <TableCell>{format(new Date(t.createdAt), 'dd/MM HH:mm')}</TableCell>
                                            <TableCell>{format(new Date(t.updatedAt), 'dd/MM HH:mm')}</TableCell>
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
