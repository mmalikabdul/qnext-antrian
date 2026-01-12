'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Monitor, LogIn, Ticket, ArrowRight, ShieldCheck, Display } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <Image
                src="/qnext-logo.svg"
                alt="Qnext Logo"
                width={160}
                height={50}
                priority
              />
            </div>
            <div className="hidden md:flex gap-6 items-center">
               <span className="text-sm font-medium text-slate-500">Sistem Antrian Cerdas v2.0</span>
               <div className="h-4 w-[1px] bg-slate-200"></div>
               <Link href="/login" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                  Login Petugas
               </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-white border-b overflow-hidden relative">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            
            <div className="container mx-auto px-4 py-16 md:py-24 text-center relative z-10">
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
                    Solusi Antrian <span className="text-primary">Modern & Efisien</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Tingkatkan pengalaman pelanggan dan produktivitas petugas dengan sistem antrian berbasis cloud yang real-time dan mudah digunakan.
                </p>
            </div>
        </section>

        {/* Portal Options */}
        <section className="container mx-auto px-4 -mt-12 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Kiosk Mode */}
            <Link href="/kiosk" className="group">
              <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 h-full flex flex-col overflow-hidden bg-white group-hover:ring-2 group-hover:ring-primary/20">
                <div className="h-2 bg-primary group-hover:h-3 transition-all duration-500"></div>
                <CardHeader className="p-10 pb-6 text-center">
                  <div className="mx-auto text-primary bg-primary/10 p-5 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 mb-4">
                    <Ticket className="h-12 w-12" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">Ambil Antrian</CardTitle>
                  <CardDescription className="text-slate-500 text-base">
                    Gunakan perangkat ini sebagai Mesin Kiosk untuk mencetak nomor antrian baru bagi pelanggan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 mt-auto flex justify-center">
                    <div className="flex items-center text-primary font-bold gap-2 group-hover:gap-4 transition-all">
                        Buka Kiosk <ArrowRight size={18} />
                    </div>
                </CardContent>
              </Card>
            </Link>

            {/* Monitor Mode */}
            <Link href="/monitor" className="group">
              <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 h-full flex flex-col overflow-hidden bg-white group-hover:ring-2 group-hover:ring-primary/20">
                <div className="h-2 bg-blue-600 group-hover:h-3 transition-all duration-500"></div>
                <CardHeader className="p-10 pb-6 text-center">
                  <div className="mx-auto text-blue-600 bg-blue-50 p-5 rounded-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 mb-4">
                    <Monitor className="h-12 w-12" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">Display Antrian</CardTitle>
                  <CardDescription className="text-slate-500 text-base">
                    Gunakan layar ini sebagai Monitor Publik untuk menampilkan panggilan antrian dan video informasi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 mt-auto flex justify-center">
                    <div className="flex items-center text-blue-600 font-bold gap-2 group-hover:gap-4 transition-all">
                        Buka Monitor <ArrowRight size={18} />
                    </div>
                </CardContent>
              </Card>
            </Link>

            {/* Staff / Login */}
            <Link href="/login" className="group">
              <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 h-full flex flex-col overflow-hidden bg-white group-hover:ring-2 group-hover:ring-primary/20">
                <div className="h-2 bg-slate-800 group-hover:h-3 transition-all duration-500"></div>
                <CardHeader className="p-10 pb-6 text-center">
                  <div className="mx-auto text-slate-800 bg-slate-100 p-5 rounded-2xl group-hover:scale-110 transition-transform duration-500 mb-4">
                    <ShieldCheck className="h-12 w-12" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">Panel Petugas</CardTitle>
                  <CardDescription className="text-slate-500 text-base">
                    Masuk sebagai Admin atau Petugas Loket untuk mengelola layanan dan memanggil antrian.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 mt-auto flex justify-center">
                    <div className="flex items-center text-slate-800 font-bold gap-2 group-hover:gap-4 transition-all">
                        Login Sekarang <ArrowRight size={18} />
                    </div>
                </CardContent>
              </Card>
            </Link>

          </div>
        </section>
      </main>

      <footer className="bg-white border-t py-10">
        <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center gap-8 mb-6">
                <div className="flex flex-col items-center">
                    <div className="font-bold text-slate-900">Real-time</div>
                    <div className="text-xs text-slate-400">WebSocket Sync</div>
                </div>
                <div className="h-8 w-[1px] bg-slate-200"></div>
                <div className="flex flex-col items-center">
                    <div className="font-bold text-slate-900">Responsive</div>
                    <div className="text-xs text-slate-400">Multi-device Support</div>
                </div>
                <div className="h-8 w-[1px] bg-slate-200"></div>
                <div className="flex flex-col items-center">
                    <div className="font-bold text-slate-900">Secure</div>
                    <div className="text-xs text-slate-400">JWT Authentication</div>
                </div>
            </div>
            <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} Q-NEXT. Developed for BKPM Front Office.
            </p>
        </div>
      </footer>
    </div>
  );
}