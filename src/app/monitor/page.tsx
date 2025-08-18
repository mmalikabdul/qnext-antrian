'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useQueue } from '@/context/queue-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import QNextLogo from '@/components/icons/q-next-logo';
import * as LucideIcons from 'lucide-react';
import { Volume2, Ticket as TicketIcon, Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Ticket, DisplaySettings } from '@/context/queue-context';
import { cn } from '@/lib/utils';

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

const getIcon = (iconName: string): React.ComponentType<LucideIcons.LucideProps> => {
    // @ts-ignore
    return LucideIcons[iconName] || LucideIcons['Ticket'];
}


export default function MonitorPage() {
  const { state, recallTicket } = useQueue();
  const { nowServing, tickets, displaySettings } = state;
  const { speak } = useSpeech();
  const lastCalledTicketIdRef = useRef<string | null>(null);
  const lastRecallTimestampRef = useRef<number | null>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [isRecalling, setIsRecalling] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long',  year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Effect for new calls
  useEffect(() => {
    if (!nowServing || nowServing.ticket.id === lastCalledTicketIdRef.current) {
        return;
    }
    
    const { ticket, counter } = nowServing;
    lastCalledTicketIdRef.current = ticket.id;

    const audio = audioRef.current;
    if (audio) {
        const handleAudioEnd = () => {
            const textToSpeak = `Nomor antrian, ${ticket.number.split('').join(' ')}, silahkan menuju, ke loket, ${counter}`;
            speak(textToSpeak);
            audio.removeEventListener('ended', handleAudioEnd);
        };
        audio.addEventListener('ended', handleAudioEnd);
        audio.play().catch(e => {
            console.error("Audio play failed, falling back to speech only.", e);
            handleAudioEnd(); // Play speech even if audio fails
        });
    }
  }, [nowServing, speak]);

  // Effect for recalls
  useEffect(() => {
    const recallInfo = state.recallInfo;
    if (!recallInfo || !nowServing || recallInfo.ticketId !== nowServing.ticket.id) {
        return;
    }
    
    // Check if this recall has already been processed to avoid re-triggering on re-renders
    if(recallInfo.timestamp === lastRecallTimestampRef.current) return;
    
    lastRecallTimestampRef.current = recallInfo.timestamp;

    const { ticket, counter } = nowServing;
    
    setIsRecalling(true);
    const timer = setTimeout(() => setIsRecalling(false), 2000); // Visual cue for 2s

    const textToSpeak = `Panggilan ulang untuk, nomor antrian, ${ticket.number.split('').join(' ')}, silahkan menuju, ke loket, ${counter}`;
    speak(textToSpeak);

    return () => clearTimeout(timer);
  }, [state.recallInfo, nowServing, speak]);


  const waitingTickets = tickets.filter(t => t.status === 'waiting');
  const nextInQueue: Ticket[] = waitingTickets.slice(0, 5);

  const getFullVideoUrl = () => {
    if (!displaySettings?.videoUrl) return '';
    try {
      const url = new URL(displaySettings.videoUrl);
      const params = new URLSearchParams(url.search);
      params.set('autoplay', '1');
      params.set('mute', '1');
      params.set('loop', '1');
      params.set('controls', '0');
      
      // If it's a playlist, the URL structure is different.
      if (params.has('list')) {
        url.pathname = '/embed/videoseries';
      } else if (url.pathname.includes('/watch')) {
        // Handle standard /watch?v=... URLs
        const videoId = params.get('v');
        if (videoId) {
           url.pathname = `/embed/${videoId}`;
           params.delete('v');
           params.set('playlist', videoId); // Loop requires playlist param
        }
      } else if (url.pathname.includes('/embed/')) {
        // Handle existing /embed/... URLs, ensure playlist is set for looping
        const videoId = url.pathname.split('/embed/')[1];
        if (!params.has('playlist')) {
            params.set('playlist', videoId);
        }
      }
      
      url.search = params.toString();
      return url.toString();

    } catch (e) {
      console.error("Invalid YouTube URL:", e);
      return "";
    }
  }

  const audioUrl = `https://firebasestorage.googleapis.com/v0/b/bkpm-q.appspot.com/o/${displaySettings.soundUrl || 'chime.mp3'}?alt=media`;

  return (
    <div className={cn("flex flex-col h-screen overflow-hidden font-sans", `theme-${displaySettings.colorScheme}`)}>
       <audio ref={audioRef} src={audioUrl} preload="auto"></audio>
      <header className="px-8 py-3 flex justify-between items-center bg-monitor-header shadow-lg text-monitor-header-foreground">
        <Link href="/" className="flex items-center gap-4">
          <QNextLogo className="h-12 w-12" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Q-NEXT</h1>
            <p className="text-lg text-monitor-header-foreground/80">Sistem Antrian Pelayanan Publik</p>
          </div>
        </Link>
        <div className="text-right">
            <p className="text-3xl font-semibold">{currentDate || 'Memuat tanggal...'}</p>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 grid-rows-6 gap-6 p-6 bg-monitor-background">
         <div className="col-span-8 row-span-4 rounded-lg overflow-hidden shadow-2xl bg-black flex items-center justify-center">
            {displaySettings?.videoUrl ? (
                <iframe
                    className="w-full h-full"
                    src={getFullVideoUrl()}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen>
                </iframe>
            ) : (
                <p className="text-primary-foreground">Video tidak tersedia.</p>
            )}
        </div>

        <Card className={cn(
          "col-span-4 row-span-6 flex flex-col shadow-2xl transition-all duration-300",
          "bg-monitor-card text-monitor-card-foreground",
           isRecalling ? 'ring-4 ring-monitor-accent' : ''
        )}>
          <CardHeader className="text-center py-4 bg-monitor-primary text-monitor-primary-foreground">
            <CardTitle className="text-4xl font-bold tracking-wider flex items-center justify-center gap-3">
              <Bell className="animate-swing"/> SEDANG DIPANGGIL
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center w-full p-4">
            {nowServing ? (
                <>
                    <p className={cn(
                      "text-[9rem] font-extrabold leading-none tracking-tight text-monitor-primary transition-all duration-300",
                      isRecalling ? 'scale-110' : ''
                    )}>
                        {nowServing.ticket.number}
                    </p>
                    <div className="mt-6 text-center w-full">
                        <p className="text-4xl font-medium text-monitor-muted-foreground">MENUJU</p>
                        <p className="text-8xl font-bold text-monitor-primary mt-2 bg-monitor-primary/10 py-2 rounded-lg">
                            LOKET {nowServing.counter}
                        </p>
                    </div>
                     <Button onClick={() => nowServing && recallTicket(nowServing.ticket.id)} variant="secondary" size="lg" className="mt-auto w-full text-lg py-6" disabled={!nowServing}>
                        <Volume2 className="mr-2 h-6 w-6"/> Panggil Ulang
                     </Button>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-monitor-muted-foreground">
                    <TicketIcon className="w-32 h-32 opacity-20"/>
                    <p className="mt-4 text-2xl font-medium">Menunggu Panggilan</p>
                </div>
            )}
          </CardContent>
        </Card>
        
        <div className="col-span-8 row-span-2 bg-monitor-card/80 rounded-lg p-4 shadow-xl flex flex-col text-monitor-card-foreground">
            <h2 className="text-2xl font-bold mb-3 px-2">ANTRIAN BERIKUTNYA</h2>
            <div className="grid grid-cols-5 gap-4 flex-1">
                {nextInQueue.length > 0 ? (
                    nextInQueue.map(ticket => {
                      const Icon = getIcon(ticket.service.icon);
                      return (
                        <div key={ticket.number} className="bg-monitor-background/20 rounded-lg flex flex-col items-center justify-center p-3 text-center">
                           <p className="text-4xl font-bold tracking-wider">{ticket.number}</p>
                           <p className="text-sm opacity-80 mt-1 flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            {ticket.service.name}
                           </p>
                        </div>
                      )
                    })
                ) : (
                    <div className="col-span-5 flex items-center justify-center text-monitor-muted-foreground text-xl">
                        <p>Tidak ada antrian berikutnya.</p>
                    </div>
                )}
                 {Array.from({ length: Math.max(0, 5 - nextInQueue.length) }).map((_, i) => (
                    <div key={`placeholder-${i}`} className="bg-monitor-background/10 rounded-lg flex items-center justify-center p-3 text-2xl font-bold opacity-30">
                        -
                    </div>
                ))}
            </div>
        </div>

      </main>

      <footer className="bg-monitor-header text-monitor-header-foreground p-2 shadow-inner-top">
        <div className="overflow-hidden">
            <p className="text-lg font-medium whitespace-nowrap animate-marquee">
                {displaySettings.footerText || 'Selamat datang di layanan Front Office kami. Kepuasan anda adalah prioritas kami.'}
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
        @keyframes swing {
          0%, 100% { transform: rotate(0); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
        .animate-swing {
            animation: swing 1.5s ease-in-out;
        }

        /* Color Schemes */
        .theme-default {
            --monitor-background: hsl(203 33% 95%);
            --monitor-header: hsl(0 0% 0% / 0.2);
            --monitor-header-foreground: hsl(203 33% 95%);
            --monitor-card: hsl(203 33% 100%);
            --monitor-card-foreground: hsl(203 100% 9%);
            --monitor-primary: hsl(203 100% 14%);
            --monitor-primary-foreground: hsl(0 0% 98%);
            --monitor-accent: hsl(0 68% 50%);
            --monitor-muted-foreground: hsl(203 33% 40%);
        }
        .theme-forest {
            --monitor-background: hsl(120 20% 95%);
            --monitor-header: hsl(120 60% 15% / 0.8);
            --monitor-header-foreground: hsl(120 20% 98%);
            --monitor-card: hsl(120 5% 100%);
            --monitor-card-foreground: hsl(120 60% 15%);
            --monitor-primary: hsl(120 60% 25%);
            --monitor-primary-foreground: hsl(0 0% 98%);
            --monitor-accent: hsl(100 50% 45%);
            --monitor-muted-foreground: hsl(120 20% 30%);
        }
        .theme-sunset {
            --monitor-background: hsl(30 100% 97%);
            --monitor-header: hsl(25 80% 35% / 0.8);
            --monitor-header-foreground: hsl(30 100% 98%);
            --monitor-card: hsl(30 20% 100%);
            --monitor-card-foreground: hsl(20 80% 25%);
            --monitor-primary: hsl(25 85% 40%);
            --monitor-primary-foreground: hsl(0 0% 98%);
            --monitor-accent: hsl(0 90% 60%);
            --monitor-muted-foreground: hsl(30 30% 40%);
        }
        .theme-modern {
            --monitor-background: hsl(220 13% 18%);
            --monitor-header: hsl(220 13% 12%);
            --monitor-header-foreground: hsl(210 40% 98%);
            --monitor-card: hsl(220 13% 22%);
            --monitor-card-foreground: hsl(210 40% 98%);
            --monitor-primary: hsl(210 40% 98%);
            --monitor-primary-foreground: hsl(220 13% 12%);
            --monitor-accent: hsl(173 80% 40%);
            --monitor-muted-foreground: hsl(215 20% 65%);
        }

      `}</style>
    </div>
  );
}
