'use client';

import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Service } from "@/types/queue";
import { kioskService } from "@/features/kiosk/services/kiosk.service"; // Reuse service fetcher
import { bookingService } from "@/features/booking/services/booking.service";

export default function BookingPage() {
    const [step, setStep] = useState(1);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [isChecking, setIsChecking] = useState(false);
    const [availability, setAvailability] = useState<{ available: boolean; remaining: number } | null>(null);
    const [bookingCode, setBookingCode] = useState<string | null>(null);
    const { toast } = useToast();

    // Load Services
    useEffect(() => {
        kioskService.getServices().then(setServices);
    }, []);

    // Check Availability when date changes
    useEffect(() => {
        if (selectedService && date) {
            checkQuota(selectedService.id, date);
        }
    }, [date, selectedService]);

    const checkQuota = async (serviceId: number, selectedDate: Date) => {
        setIsChecking(true);
        setAvailability(null);
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const res = await bookingService.checkAvailability(serviceId, dateStr);
            setAvailability(res);
        } catch (error) {
            console.error(error);
        } finally {
            setIsChecking(false);
        }
    };

    const handleBooking = async () => {
        if (!selectedService || !date) return;
        
        try {
            const dateStr = format(date, "yyyy-MM-dd");
            const res = await bookingService.createBooking(selectedService.id, dateStr);
            setBookingCode(res.code);
            setStep(3);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Gagal Booking",
                description: error.message
            });
        }
    };

    const reset = () => {
        setStep(1);
        setSelectedService(null);
        setDate(undefined);
        setBookingCode(null);
        setAvailability(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary">Booking Antrian Online</h1>
                    <p className="text-muted-foreground">Reservasi kedatangan Anda agar lebih nyaman.</p>
                </div>

                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {services.map(s => (
                            <Card 
                                key={s.id} 
                                className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
                                onClick={() => { setSelectedService(s); setStep(2); }}
                            >
                                <CardHeader>
                                    <CardTitle>{s.name}</CardTitle>
                                    <CardDescription>{s.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}

                {step === 2 && selectedService && (
                    <Card className="w-full max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle>Pilih Tanggal Kedatangan</CardTitle>
                            <CardDescription>Layanan: {selectedService.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex justify-center">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                    initialFocus
                                    className="rounded-md border"
                                />
                            </div>

                            {date && (
                                <div className="p-4 bg-slate-100 rounded-lg text-center">
                                    <p className="text-sm text-muted-foreground mb-1">Tanggal Dipilih:</p>
                                    <p className="font-bold">{format(date, "d MMMM yyyy", { locale: idLocale })}</p>
                                    
                                    <div className="mt-4">
                                        {isChecking ? (
                                            <p className="text-sm animate-pulse">Mengecek ketersediaan...</p>
                                        ) : availability ? (
                                            availability.available ? (
                                                <div className="text-green-600 flex items-center justify-center gap-2">
                                                    <CheckCircle2 size={16}/>
                                                    <span className="font-medium">Tersedia ({availability.remaining} slot)</span>
                                                </div>
                                            ) : (
                                                <div className="text-destructive flex items-center justify-center gap-2">
                                                    <AlertCircle size={16}/>
                                                    <span className="font-medium">Kuota Penuh! Silakan pilih hari lain.</span>
                                                </div>
                                            )
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>Kembali</Button>
                            <Button 
                                onClick={handleBooking} 
                                disabled={!date || isChecking || !availability?.available}
                            >
                                Proses Booking
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {step === 3 && bookingCode && selectedService && date && (
                    <Card className="w-full max-w-md mx-auto text-center">
                        <CardHeader>
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl text-green-700">Booking Berhasil!</CardTitle>
                            <CardDescription>Simpan kode booking ini baik-baik.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl">
                                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Kode Booking Anda</p>
                                <p className="text-4xl font-mono font-black text-primary tracking-widest select-all">{bookingCode}</p>
                            </div>

                            <div className="space-y-2 text-left bg-white p-4 rounded-lg border shadow-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Layanan:</span>
                                    <span className="font-semibold">{selectedService.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tanggal:</span>
                                    <span className="font-semibold">{format(date, "d MMMM yyyy", { locale: idLocale })}</span>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded text-left border border-yellow-200">
                                <strong>PENTING:</strong> Tunjukkan atau masukkan kode ini di Mesin Kiosk saat Anda tiba di lokasi untuk mencetak tiket antrian.
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={reset}>Buat Booking Baru</Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
