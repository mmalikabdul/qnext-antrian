'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Loader2, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Service } from "@/types/queue";
import { kioskService } from "@/features/kiosk/services/kiosk.service";
import { bookingService } from "@/features/booking/services/booking.service";
import { apiClient } from "@/lib/api-client";

// OSS SSO Types
interface OSSUserData {
  id_profile: number;
  username: string;
  kode_instansi: string | null;
  jenis_identitas: string;
  nomor_identitas: string;
  nama: string;
  email: string;
  alamat: string;
  telp: string;
  status: string;
  role: string;
  flag_umk: string;
  foto: string | null;
  nama_kota: string | null;
  jenis_perseroan: string;
  flag_migrasi: string;
  kantor: string | null;
  jenis_kelamin: string;
  unit_kerja: string | null;
  npwp_perseroan: string;
  jenis_pelaku_usaha: string;
  kewenangan_izin: any[];
  data_nib: string[];
  data_perusahaan: {
    alamat_perusahaan: string;
    perusahaan_daerah_id: string;
    oss_id: string;
  };
  id_kawasan: string | null;
  two_factor_auth_status: boolean;
  data_menu: {
    nama_akun: string;
    jenis_pelaku_usaha: string;
  };
}

interface OSSApiResponse {
  status: number;
  message: string;
  data: OSSUserData;
}

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    
    // Authentication States
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [userData, setUserData] = useState<OSSUserData | null>(null);
    
    // Booking States
    const [step, setStep] = useState(1);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [isChecking, setIsChecking] = useState(false);
    const [availability, setAvailability] = useState<{ available: boolean; remaining: number } | null>(null);
    const [bookingCode, setBookingCode] = useState<string | null>(null);

    const [issueDescription, setIssueDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Validate SSO Token on Mount
    useEffect(() => {
        const validateToken = async () => {
            try {
                // Extract token from URL params (e.g., /booking/xxxxx)
                const token = params?.token as string | undefined;
                
                if (!token) {
                    // No token, redirect to OSS login
                    window.location.href = 'https://ui-login.oss.go.id/login';
                    return;
                }

                // Call SSO API to validate token and get user info
                const response = await fetch('https://api-stg.oss.go.id/stg/v1/sso/users/userinfo-token', {
                    method: 'GET',
                    headers: {
                        'Accept': '*/*',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'user_key': process.env.USER_KEY_SSO_OSS_STG || 'f9c53f291ab3b47251ef5b001b4f6dcc',
                    },
                });

                if (!response.ok) {
                    throw new Error('Token validation failed');
                }

                const result: OSSApiResponse = await response.json();
                
                if (result.status === 200 && result.data) {
                    setUserData(result.data);
                    setIsAuthenticating(false);
                } else {
                    throw new Error(result.message || 'Authentication failed');
                }
            } catch (error: any) {
                console.error('SSO Authentication Error:', error);
                toast({
                    variant: "destructive",
                    title: "Autentikasi Gagal",
                    description: error.message || "Token tidak valid atau sudah kadaluarsa",
                });
                // Redirect to login after showing error
                setTimeout(() => {
                    window.location.href = 'https://ui-login.oss.go.id/login';
                }, 2000);
            }
        };

        validateToken();
    }, [params, toast]);

    // Load Services (only after authenticated)
    useEffect(() => {
        if (userData) {
            kioskService.getServices().then(setServices);
        }
    }, [userData]);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast({
                    variant: "destructive",
                    title: "Ukuran File Terlalu Besar",
                    description: "Maksimal ukuran file adalah 5MB",
                });
                return;
            }
            setFile(selectedFile);
        }
    };

    const submitBooking = async () => {
        if (!selectedService || !date) return;
        
        setIsUploading(true);
        try {
            let fileUrl = "";

            if (file) {
                // Upload to Backend (Self-hosted)
                const formData = new FormData();
                formData.append('file', file);
                
                // Assuming apiClient handles FormData correctly (removes Content-Type header to let browser set boundary)
                const uploadRes = await apiClient.post('/upload', formData);
                fileUrl = uploadRes.url;
            }

            const dateStr = format(date, "yyyy-MM-dd");
            
            // Prepare User Details from OSS Data
            const userDetails = {
                email: userData?.email,
                nib: userData?.data_nib?.[0], // Ambil NIB pertama
                namaPerusahaan: userData?.data_menu?.nama_akun,
                idProfileOss: userData?.id_profile
            };

            // Pass issueDescription, fileUrl and userDetails to createBooking
            const res = await bookingService.createBooking(
                selectedService.id, 
                dateStr, 
                issueDescription, 
                fileUrl,
                userDetails
            );
            
            setBookingCode(res.code);
            setStep(4);
        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Gagal Booking",
                description: error.message || "Terjadi kesalahan saat memproses booking."
            });
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setSelectedService(null);
        setDate(undefined);
        setBookingCode(null);
        setAvailability(null);
        setIssueDescription("");
        setFile(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            {/* Loading Screen During Authentication */}
            {isAuthenticating ? (
                <Card className="w-full max-w-md text-center">
                    <CardContent className="pt-6 pb-6">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Memverifikasi Autentikasi...</h2>
                        <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="max-w-3xl w-full">
                    {/* User Info Banner */}
                    {userData && (
                        <Card className="mb-6 bg-primary/5 border-primary/20">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Selamat Datang,</p>
                                        <p className="text-lg font-bold text-primary">{userData.nama}</p>
                                        <p className="text-xs text-muted-foreground">{userData.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">NIB:</p>
                                        <p className="text-sm font-mono font-semibold">{userData.data_nib?.[0] || '-'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                                    onClick={() => setStep(3)} 
                                    disabled={!date || isChecking || !availability?.available}
                                >
                                    Selanjutnya
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {step === 3 && (
                        <Card className="w-full max-w-md mx-auto">
                            <CardHeader>
                                <CardTitle>Detail Kendala (Opsional)</CardTitle>
                                <CardDescription>Jelaskan kendala atau pertanyaan Anda</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Kendala atau Pertanyaan</label>
                                    <textarea 
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Silakan tulis pertanyaan atau kendala Anda"
                                        value={issueDescription}
                                        onChange={(e) => setIssueDescription(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium">Unggah Gambar Terkait Kendala</label>
                                        <span className="text-xs text-muted-foreground">(Optional)</span>
                                    </div>
                                    <div className="border-2 border-dashed rounded-lg p-6 hover:bg-slate-50 transition-colors relative text-center">
                                        <input 
                                            type="file" 
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {file ? (
                                            <div className="flex items-center justify-center gap-2 text-primary">
                                                <CheckCircle2 size={24} />
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="absolute top-2 right-2 h-6 w-6" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault(); 
                                                        setFile(null); 
                                                        // Reset input value manually if needed, but react key approach is cleaner usually.
                                                        // For now this clears state.
                                                    }}
                                                >
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <div className="p-3 bg-blue-50 rounded-full text-blue-500">
                                                    <UploadCloud size={24} /> 
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-primary">Pilih atau geser ke sini</p>
                                                    <p className="text-xs">JPG/PNG/PDF (maks: 5mb)</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Contoh: Screenshot OSS atau surat terkait kendala</p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(2)} disabled={isUploading}>Kembali</Button>
                                <Button onClick={submitBooking} disabled={isUploading}>
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        "Proses Booking"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {step === 4 && bookingCode && selectedService && date && (
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
            )}
        </div>
    );
}
