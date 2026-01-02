'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, LogIn, Ticket } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="bg-card shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div>
              <Image
                src="/qnext-logo.svg"
                alt="Qnext Logo"
                width={256}
                height={80}
                priority
              />
              
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
              Selamat Datang di Sistem Antrian Q-NEXT
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              Pilih salah satu modul di bawah ini untuk memulai.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Link href="/kiosk">
              <Card className="text-center transform hover:-translate-y-2 transition-transform duration-300 ease-in-out cursor-pointer shadow-lg hover:shadow-primary/20 hover:shadow-2xl h-full flex flex-col">
                <CardHeader className="p-8">
                  <div className="mx-auto text-primary bg-primary/10 p-4 rounded-full">
                    <Ticket className="h-12 w-12" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <CardTitle className="text-2xl font-bold text-primary">
                    Mesin Kiosk
                  </CardTitle>
                  <p className="mt-2 text-muted-foreground">
                    Klik di sini untuk mengambil nomor antrian.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/monitor">
              <Card className="text-center transform hover:-translate-y-2 transition-transform duration-300 ease-in-out cursor-pointer shadow-lg hover:shadow-primary/20 hover:shadow-2xl h-full flex flex-col">
                <CardHeader className="p-8">
                  <div className="mx-auto text-primary bg-primary/10 p-4 rounded-full">
                    <Monitor className="h-12 w-12" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <CardTitle className="text-2xl font-bold text-primary">
                    Layar Monitor
                  </CardTitle>
                  <p className="mt-2 text-muted-foreground">
                    Menampilkan panggilan antrian secara real-time.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/login">
              <Card className="text-center transform hover:-translate-y-2 transition-transform duration-300 ease-in-out cursor-pointer shadow-lg hover:shadow-primary/20 hover:shadow-2xl h-full flex flex-col">
                <CardHeader className="p-8">
                  <div className="mx-auto text-primary bg-primary/10 p-4 rounded-full">
                    <LogIn className="h-12 w-12" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <CardTitle className="text-2xl font-bold text-primary">
                    Login Petugas
                  </CardTitle>
                  <p className="mt-2 text-muted-foreground">
                    Akses panel untuk admin dan petugas loket.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Q-NEXT. All rights reserved.
      </footer>
    </div>
  );
}
