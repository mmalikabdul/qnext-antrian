'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useQueue } from '@/context/queue-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';
import { Volume2, Ticket as TicketIcon, Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Ticket, DisplaySettings } from '@/context/queue-context';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

const useSpeech = () => {
  const speak = useCallback((text: string) => {
    const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!isSpeechSupported) {
      console.warn("Speech synthesis not supported.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    const setVoiceAndSpeak = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Find the best Indonesian female voice
      // Priority: Google's voice, then Microsoft's "Andika" (female), then any other Indonesian voice.
      const googleFemaleVoice = allVoices.find(voice => voice.lang === 'id-ID' && voice.name.includes('Google'));
      const microsoftFemaleVoice = allVoices.find(voice => voice.lang === 'id-ID' && voice.name.includes('Andika'));
      const genericIndonesianVoice = allVoices.find(voice => voice.lang === 'id-ID');
      
      utterance.voice = googleFemaleVoice || microsoftFemaleVoice || genericIndonesianVoice || null;

      window.speechSynthesis.cancel(); // Cancel any previous speech
      window.speechSynthesis.speak(utterance);
    }

    // The voices might be loaded already. If so, speak immediately.
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      // Otherwise, wait for the voices to be loaded.
      window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    }
  }, []);

  // The isReady flag is now just for indicating API support, not voice readiness.
  const [isApiReady, setIsApiReady] = React.useState(false);
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsApiReady(true);
    }
  }, []);

  return { speak, isReady: isApiReady };
};

const getIcon = (iconName: string): React.ComponentType<LucideIcons.LucideProps> => {
    // @ts-ignore
    return LucideIcons[iconName] || LucideIcons['Ticket'];
}


export default function MonitorPage() {
  const { state } = useQueue();
  const { nowServingTickets, tickets, displaySettings, recallInfo } = state;
  const { speak } = useSpeech();
  const lastCalledTicketIdRef = useRef<string | null>(null);
  const lastRecallTimestampRef = useRef<number | null>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [isRecalling, setIsRecalling] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const latestServing = React.useMemo(() => {
    if (!nowServingTickets || nowServingTickets.length === 0) {
      return null;
    }
    // Sort by calledAt descending to get the most recent call
    const sortedServing = [...nowServingTickets].sort((a, b) => {
        const timeA = a.ticket.calledAt?.getTime() || 0;
        const timeB = b.ticket.calledAt?.getTime() || 0;
        return timeB - timeA;
    });
    return sortedServing[0];
  }, [nowServingTickets]);

  const otherServingTickets = React.useMemo(() => {
    if (!nowServingTickets || !latestServing) {
        return [];
    }
    return nowServingTickets.filter(info => info.ticket.id !== latestServing.ticket.id)
      .sort((a, b) => (a.ticket.calledAt?.getTime() || 0) - (b.ticket.calledAt?.getTime() || 0));
  }, [nowServingTickets, latestServing]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long',  year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Effect for new calls
  useEffect(() => {
    if (!latestServing || latestServing.ticket.id === lastCalledTicketIdRef.current) {
        return;
    }
    
    const { ticket, counter } = latestServing;
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
  }, [latestServing, speak]);

  // Effect for recalls
  useEffect(() => {
    if (!recallInfo || !nowServingTickets || nowServingTickets.length === 0) {
        return;
    }
    
    // Check if this recall has already been processed to avoid re-triggering on re-renders
    if(recallInfo.timestamp === lastRecallTimestampRef.current) return;
    
    const recalledTicketInfo = nowServingTickets.find(info => info.ticket.id === recallInfo.ticketId);
    if (!recalledTicketInfo) return;

    lastRecallTimestampRef.current = recallInfo.timestamp;

    const { ticket, counter } = recalledTicketInfo;
    
    setIsRecalling(true);
    const timer = setTimeout(() => setIsRecalling(false), 2000); // Visual cue for 2s

    const audio = audioRef.current;
    if (audio) {
        const handleAudioEnd = () => {
            const textToSpeak = `Panggilan ulang untuk, nomor antrian, ${ticket.number.split('').join(' ')}, silahkan menuju, ke loket, ${counter}`;
            speak(textToSpeak);
            audio.removeEventListener('ended', handleAudioEnd);
        };
        audio.addEventListener('ended', handleAudioEnd);
        audio.play().catch(e => {
            console.error("Recall audio play failed, falling back to speech only.", e);
            handleAudioEnd(); // Play speech even if audio fails
        });
    }

    return () => clearTimeout(timer);
  }, [recallInfo, nowServingTickets, speak]);


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
      <header className="px-8 py-2 flex justify-between items-center bg-monitor-header shadow-lg text-monitor-header-foreground">
        <Image
          src="/qnext-logo.svg"
          alt="Qnext Logo"
          width={200}
          height={62}
          priority
        />
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
            {latestServing ? (
                <>
                    <p className={cn(
                      "text-[9rem] font-extrabold leading-none tracking-tight text-monitor-primary transition-all duration-300",
                      isRecalling ? 'scale-110' : ''
                    )}>
                        {latestServing.ticket.number}
                    </p>
                    <div className="mt-6 text-center w-full">
                        <p className="text-4xl font-medium text-monitor-muted-foreground">MENUJU</p>
                        <p className="text-8xl font-bold text-monitor-primary mt-2 bg-monitor-primary/10 py-2 rounded-lg">
                            LOKET {latestServing.counter}
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-monitor-muted-foreground">
                    <TicketIcon className="w-32 h-32 opacity-20"/>
                    <p className="mt-4 text-2xl font-medium">Menunggu Panggilan</p>
                </div>
            )}
          </CardContent>
          {otherServingTickets.length > 0 && (
            <div className="mt-auto p-4 border-t-2 border-monitor-primary/10">
                <h3 className="text-center text-xl font-bold text-monitor-muted-foreground mb-3">SEDANG DILAYANI</h3>
                <ScrollArea className="h-40">
                    <div className="space-y-2 pr-4">
                        {otherServingTickets.map(({ ticket, counter }) => (
                            <div key={ticket.id} className="flex justify-between items-center bg-monitor-background/20 p-2 rounded-lg text-lg">
                                <span className="font-bold">{ticket.number}</span>
                                <span className="font-semibold text-monitor-primary">LOKET {counter}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
          )}
        </Card>
        
        <div className="col-span-8 row-span-2 bg-[--monitor-card-80] rounded-lg p-4 shadow-xl flex flex-col text-monitor-card-foreground">
            <h2 className="text-2xl font-bold mb-3 px-2">ANTRIAN BERIKUTNYA</h2>
            <div className="grid grid-cols-5 gap-4 flex-1">
                {nextInQueue.length > 0 ? (
                    nextInQueue.map(ticket => {
                      const Icon = getIcon(ticket.service.icon);
                      return (
                        <div key={ticket.number} className="bg-[--monitor-background-20] rounded-lg flex flex-col items-center justify-center p-3 text-center">
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
                    <div key={`placeholder-${i}`} className="bg-[--monitor-background-10] rounded-lg flex items-center justify-center p-3 text-2xl font-bold opacity-30">
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

  /* Softer Color Schemes */
  .theme-default {
      --monitor-background: hsl(203 33% 95%);
      --monitor-background-10: hsl(203 33% 95% / 0.1);
      --monitor-background-20: hsl(203 33% 95% / 0.2);
      --monitor-header: hsl(203 60% 90% / 0.8); /* soft pastel blue */
      --monitor-header-foreground: hsl(203 40% 20%);
      --monitor-card: hsl(203 33% 100%);
      --monitor-card-80: hsl(203 33% 100% / 0.8);
      --monitor-card-foreground: hsl(203 100% 9%);
      --monitor-primary: hsl(203 100% 25%);
      --monitor-primary-foreground: hsl(0 0% 98%);
      --monitor-accent: hsl(0 68% 50%);
      --monitor-muted-foreground: hsl(203 33% 40%);
  }
  .theme-forest {
      --monitor-background: hsl(120 20% 95%);
      --monitor-background-10: hsl(120 20% 95% / 0.1);
      --monitor-background-20: hsl(120 20% 95% / 0.2);
      --monitor-header: hsl(120 40% 88% / 0.8); /* soft pastel green */
      --monitor-header-foreground: hsl(120 40% 20%);
      --monitor-card: hsl(120 5% 100%);
      --monitor-card-80: hsl(120 5% 100% / 0.8);
      --monitor-card-foreground: hsl(120 60% 15%);
      --monitor-primary: hsl(120 60% 30%);
      --monitor-primary-foreground: hsl(0 0% 98%);
      --monitor-accent: hsl(100 50% 45%);
      --monitor-muted-foreground: hsl(120 20% 30%);
  }
  .theme-sunset {
      --monitor-background: hsl(30 100% 97%);
      --monitor-background-10: hsl(30 100% 97% / 0.1);
      --monitor-background-20: hsl(30 100% 97% / 0.2);
      --monitor-header: hsl(30 90% 88% / 0.8); /* soft warm orange */
      --monitor-header-foreground: hsl(25 60% 20%);
      --monitor-card: hsl(30 20% 100%);
      --monitor-card-80: hsl(30 20% 100% / 0.8);
      --monitor-card-foreground: hsl(20 80% 25%);
      --monitor-primary: hsl(25 85% 40%);
      --monitor-primary-foreground: hsl(0 0% 98%);
      --monitor-accent: hsl(0 90% 60%);
      --monitor-muted-foreground: hsl(30 30% 40%);
  }
  .theme-modern {
      --monitor-background: hsl(220 13% 18%);
      --monitor-background-10: hsl(220 13% 18% / 0.1);
      --monitor-background-20: hsl(220 13% 18% / 0.2);
      --monitor-header: hsl(220 15% 30% / 0.8); /* softer dark grey */
      --monitor-header-foreground: hsl(210 40% 95%);
      --monitor-card: hsl(220 13% 22%);
      --monitor-card-80: hsl(220 13% 22% / 0.8);
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
