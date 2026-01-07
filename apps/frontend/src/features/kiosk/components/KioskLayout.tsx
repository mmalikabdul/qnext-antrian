import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export const KioskLayout = ({ children }: { children: React.ReactNode }) => {
  const [dateTime, setDateTime] = useState({ date: '', time: '' });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setDateTime({
        date: now.toLocaleDateString('id-ID', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }),
        time: now.toLocaleTimeString('id-ID', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background font-sans overflow-hidden select-none">
        <header className="bg-card shadow-sm flex-none">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-24">
              <div className="flex items-center">
                <Image
                  src="/qnext-logo.svg"
                  alt="Qnext Logo"
                  width={200}
                  height={62}
                  priority
                />
                <h1 className="text-xl font-bold text-primary ml-6 hidden md:block">LAYANAN SISTEM ANTRIAN PUBLIK</h1>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground tabular-nums">{dateTime.time}</p>
                <p className="text-sm text-muted-foreground">{dateTime.date}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
            {children}
        </main>

        <footer className="flex-none text-center py-4 text-sm text-muted-foreground bg-card/50">
          © {new Date().getFullYear()} Q-NEXT. Sistem Antrian Cerdas.
        </footer>
    </div>
  );
};
