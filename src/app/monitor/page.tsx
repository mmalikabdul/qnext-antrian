'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useQueue } from '@/context/queue-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BkpmLogo from '@/components/icons/bkpm-logo';
import { Volume2, Users, Briefcase, Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Ticket } from '@/context/queue-context';

const useSpeech = () => {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const checkSpeechSynthesis = () => {
      const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
      if (isSpeechSupported) {
        // A small trick to initialize voices on some browsers
        window.speechSynthesis.getVoices();
      }
      setIsReady(isSpeechSupported);
    };

    checkSpeechSynthesis();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = checkSpeechSynthesis;
    }

  }, []);

  const speak = useCallback((text: string) => {
    if (!isReady) {
      console.warn("Speech synthesis not ready or supported.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(voice => voice.lang === 'id-ID');
    if (indonesianVoice) {
        utterance.voice = indonesianVoice;
    }

    window.speechSynthesis.cancel(); // Cancel any previous speech
    window.speechSynthesis.speak(utterance);
  }, [isReady]);

  return { speak, isReady };
};

const serviceIcons: Record<string, React.ReactNode> = {
    A: <Users className="h-5 w-5" />,
    B: <Briefcase className="h-5 w-5" />,
    C: <TicketIcon className="h-5 w-5" />,
    DEFAULT: <TicketIcon className="h-5 w-5" />,
};

const getServiceIcon = (serviceId: string) => {
    const firstChar = serviceId.charAt(0).toUpperCase();
    return serviceIcons[firstChar] || serviceIcons.DEFAULT;
}


export default function MonitorPage() {
  const { state, recallTicket } = useQueue();
  const { nowServing, tickets, videoUrl } = state;
  const { speak } = useSpeech();
  const lastSpokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (nowServing && nowServing.ticket.number !== lastSpokenRef.current) {
      const textToSpeak = `Nomor antrian, ${nowServing.ticket.number.split('').join(' ')}, silahkan menuju, ke loket, ${nowServing.counter}`;
      speak(textToSpeak);
      lastSpokenRef.current = nowServing.ticket.number;
    }
  }, [nowServing, speak]);

  const handleRecall = () => {
      if(nowServing) {
        recallTicket(); // This action is for re-triggering effects if needed.
        const textToSpeak = `Panggilan ulang untuk nomor antrian, ${nowServing.ticket.number.split('').join(' ')}, silahkan menuju, ke loket, ${nowServing.counter}`;
        speak(textToSpeak);
      }
  }

  const waitingTickets = tickets.filter(t => t.status === 'waiting');
  const nextInQueue: Ticket[] = waitingTickets.slice(0, 5);

  const getFullVideoUrl = () => {
    if (!videoUrl) return '';
    const params = 'autoplay=1&mute=1&loop=1&controls=0';
    if (videoUrl.includes('?')) {
      return `${videoUrl}&${params}`;
    }
    return `${videoUrl}?${params}`;
  }


  return (
    <div className="flex flex-col h-screen bg-primary text-primary-foreground overflow-hidden font-sans">
      <header className="px-8 py-3 flex justify-between items-center bg-black/20 shadow-lg">
        <Link href="/" className="flex items-center gap-4">
          <BkpmLogo className="h-12 w-12" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight">BKPM Q</h1>
            <p className="text-lg text-primary-foreground/80">Sistem Antrian Pelayanan Publik</p>
          </div>
        </Link>
        <div className="text-right">
            <p className="text-3xl font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long',  year: 'numeric' })}</p>
            {/* <p className="text-5xl font-bold">10:30:45</p> */}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 grid-rows-6 gap-6 p-6">
        {/* Video Player */}
        <div className="col-span-8 row-span-4 rounded-lg overflow-hidden shadow-2xl">
           {videoUrl ? (
                <iframe
                    className="w-full h-full"
                    src={getFullVideoUrl()}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen>
                </iframe>
            ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                    <p className="text-primary-foreground">Video tidak tersedia.</p>
                </div>
            )}
        </div>

        {/* Now Serving */}
        <Card className="col-span-4 row-span-6 bg-background text-foreground flex flex-col shadow-2xl animate-fade-in">
          <CardHeader className="text-center bg-primary text-primary-foreground py-4">
            <CardTitle className="text-4xl font-bold tracking-wider">
              SEDANG DIPANGGIL
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center w-full p-4">
            {nowServing ? (
                <>
                    <p className="text-[9rem] font-extrabold leading-none tracking-tight text-primary animate-pulse">
                        {nowServing.ticket.number}
                    </p>
                    <div className="mt-6 text-center w-full">
                        <p className="text-4xl font-medium text-muted-foreground">MENUJU</p>
                        <p className="text-8xl font-bold text-primary mt-2 bg-primary/10 py-2 rounded-lg">
                            LOKET {nowServing.counter}
                        </p>
                    </div>
                     <Button onClick={handleRecall} variant="secondary" size="lg" className="mt-auto w-full text-lg py-6">
                        <Volume2 className="mr-2 h-6 w-6"/> Panggil Ulang
                     </Button>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <TicketIcon className="w-32 h-32 opacity-20"/>
                    <p className="mt-4 text-2xl font-medium">Menunggu Panggilan</p>
                </div>
            )}
          </CardContent>
        </Card>
        
        {/* Next In Queue */}
        <div className="col-span-8 row-span-2 bg-card/80 rounded-lg p-4 shadow-xl flex flex-col">
            <h2 className="text-2xl font-bold text-primary-foreground/90 mb-3 px-2">ANTRIAN BERIKUTNYA</h2>
            <div className="grid grid-cols-5 gap-4 flex-1">
                {nextInQueue.length > 0 ? (
                    nextInQueue.map(ticket => (
                        <div key={ticket.number} className="bg-background/20 rounded-lg flex flex-col items-center justify-center p-3 text-center">
                           <p className="text-4xl font-bold tracking-wider">{ticket.number}</p>
                           <p className="text-sm opacity-80 mt-1 flex items-center gap-2">
                            {getServiceIcon(ticket.service.id)}
                            {ticket.service.name}
                           </p>
                        </div>
                    ))
                ) : (
                    <div className="col-span-5 flex items-center justify-center text-primary-foreground/60 text-xl">
                        <p>Tidak ada antrian berikutnya.</p>
                    </div>
                )}
                 {Array.from({ length: 5 - nextInQueue.length }).map((_, i) => (
                    <div key={`placeholder-${i}`} className="bg-background/10 rounded-lg flex items-center justify-center p-3 text-2xl font-bold text-primary-foreground/30">
                        -
                    </div>
                ))}
            </div>
        </div>

      </main>

      <footer className="bg-black/20 p-2 shadow-inner-top">
        <div className="overflow-hidden">
            <p className="text-lg font-medium whitespace-nowrap animate-marquee">
                Selamat datang di layanan Front Office BKPM. Kepuasan anda adalah prioritas kami. --- Mohon siapkan dokumen yang diperlukan sebelum menuju ke loket. --- Pastikan Anda mendengar panggilan nomor antrian Anda.
            </p>
        </div>
      </footer>
       <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-150%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
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
