'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useQueue } from '@/context/queue-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BkpmLogo from '@/components/icons/bkpm-logo';
import { Volume2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const useSpeech = () => {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    setIsReady(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!isReady) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }, [isReady]);

  return { speak, isReady };
};


export default function MonitorPage() {
  const { state, recallTicket } = useQueue();
  const { nowServing, servingHistory } = state;
  const { speak, isReady } = useSpeech();
  const lastSpokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (nowServing && nowServing.ticket.number !== lastSpokenRef.current) {
      const textToSpeak = `Nomor antrian, ${nowServing.ticket.number.split('-').join(' ')}, silahkan menuju, ke loket, ${nowServing.counter}`;
      speak(textToSpeak);
      lastSpokenRef.current = nowServing.ticket.number;
    }
  }, [nowServing, speak]);

  const handleRecall = () => {
      if(nowServing) {
        recallTicket(); // This action is for re-triggering effects if needed.
        const textToSpeak = `Panggilan ulang untuk nomor antrian, ${nowServing.ticket.number.split('-').join(' ')}, silahkan menuju, ke loket, ${nowServing.counter}`;
        speak(textToSpeak);
      }
  }


  return (
    <div className="flex flex-col h-screen bg-primary text-primary-foreground overflow-hidden">
      <header className="px-8 py-4 flex justify-between items-center bg-black/10">
        <Link href="/" className="flex items-center gap-4">
          <BkpmLogo className="h-10 w-10" />
          <h1 className="text-3xl font-bold tracking-tight">BKPM Q</h1>
        </Link>
        <div className="text-right">
            <p className="text-2xl font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-3 grid-rows-3 gap-6 p-6">
        <Card className="col-span-2 row-span-3 bg-background text-foreground flex flex-col justify-center items-center shadow-2xl animate-fade-in">
          <CardHeader>
            <CardTitle className="text-5xl font-medium text-muted-foreground">
              NOMOR ANTRIAN
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center w-full">
            <p className="text-[14rem] font-extrabold leading-none tracking-tighter text-primary animate-pulse">
              {nowServing ? nowServing.ticket.number : '----'}
            </p>
            <div className="mt-8 text-center">
                <p className="text-5xl font-medium text-muted-foreground">MENUJU LOKET</p>
                <p className="text-9xl font-bold text-primary mt-2">
                    {nowServing ? nowServing.counter : '-'}
                </p>
            </div>
            {nowServing && (
                 <Button onClick={handleRecall} variant="secondary" size="lg" className="mt-8">
                    <Volume2 className="mr-2"/> Panggil Ulang
                 </Button>
            )}
          </CardContent>
        </Card>

        <div className="col-span-1 row-span-3 flex flex-col gap-4">
          {servingHistory.slice(1, 6).map((item, index) => (
            <Card key={item.ticket.number} className="bg-primary/80 flex-1 flex items-center justify-between p-6 transition-all duration-500 ease-in-out">
                <p className="text-5xl font-bold">{item.ticket.number}</p>
                <div className="text-right">
                    <p className="text-xl">LOKET</p>
                    <p className="text-4xl font-bold">{item.counter}</p>
                </div>
            </Card>
          ))}
        </div>

      </main>

      <footer className="bg-black/10 p-2">
        <div className="overflow-hidden">
            <p className="text-lg font-medium whitespace-nowrap animate-marquee">
                Selamat datang di layanan Front Office BKPM. Kepuasan anda adalah prioritas kami. --- Mohon siapkan dokumen yang diperlukan sebelum menuju ke loket. ---
            </p>
        </div>
      </footer>
       <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
          padding-left: 100%;
        }
        @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
