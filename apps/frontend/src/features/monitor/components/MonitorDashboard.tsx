import React, { useEffect, useRef, useState } from 'react';
import { useMonitorQueue } from '../hooks/useMonitorQueue';
import { useSpeech } from '../hooks/useSpeech';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Ticket as TicketIcon, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function MonitorDashboard() {
  const { servingTickets, allTodayTickets, settings, lastCalledTicket, lastRecallTicket } = useMonitorQueue();
  const { speak, debugInfo } = useSpeech();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [isRecalling, setIsRecalling] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper untuk format teks antrian
  const formatTicketText = (ticket: typeof lastCalledTicket) => {
    if (!ticket) return '';
    // Pisahkan huruf dan angka agar dibaca jelas. Contoh: A001 -> A, Kosong Kosong Satu
    const readableNumber = ticket.number.split('').map(char => {
        if (!isNaN(Number(char))) return char === '0' ? 'Kosong' : char;
        return char;
    }).join(' ');
    
    return `Nomor antrian, ${readableNumber}. Silahkan menuju loket, ${ticket.counter?.name}`;
  };

  // Handle Voice Announcement for New Call
  useEffect(() => {
    if (!lastCalledTicket || !audioEnabled) return;

    const announce = () => {
        const audio = audioRef.current;
        const textToSpeak = formatTicketText(lastCalledTicket);

        if (audio && settings?.soundUrl) {
            // Mainkan Chime dulu
            const onChimeEnd = () => {
                speak(textToSpeak); // Bicara setelah chime selesai
                audio.removeEventListener('ended', onChimeEnd);
            };
            audio.addEventListener('ended', onChimeEnd);
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Audio play error:", e));
        } else {
            // Langsung bicara jika tidak ada chime
            speak(textToSpeak);
        }
    };

    announce();
  }, [lastCalledTicket, speak, settings, audioEnabled]);

  // Handle Recall
  useEffect(() => {
    if (!lastRecallTicket || !audioEnabled) return;

    setIsRecalling(true);
    setTimeout(() => setIsRecalling(false), 2000);

    const announce = () => {
        const audio = audioRef.current;
        const textToSpeak = `Panggilan ulang. ${formatTicketText(lastRecallTicket)}`;

        if (audio && settings?.soundUrl) {
            const onChimeEnd = () => {
                speak(textToSpeak);
                audio.removeEventListener('ended', onChimeEnd);
            };
            audio.addEventListener('ended', onChimeEnd);
            audio.currentTime = 0;
            audio.play().catch(console.error);
        } else {
            speak(textToSpeak);
        }
    };
    announce();
  }, [lastRecallTicket, speak, settings, audioEnabled]);

  if (!settings) return <div className="h-screen flex items-center justify-center">Inisialisasi Monitor...</div>;

  const latestServing = servingTickets[0];
  const otherServing = servingTickets.slice(1);
  const nextInQueue = allTodayTickets.filter(t => t.status === 'WAITING').slice(0, 5);

  const getFullVideoUrl = () => {
    if (!settings.videoUrl) return '';
    try {
      const urlString = settings.videoUrl.includes('embed') ? settings.videoUrl : settings.videoUrl.replace('watch?v=', 'embed/');
      const url = new URL(urlString);
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('mute', '1');
      url.searchParams.set('loop', '1');
      url.searchParams.set('controls', '0');
      return url.toString();
    } catch { return settings.videoUrl; }
  }

  return (
    <div className={cn("flex flex-col h-screen overflow-hidden font-sans relative", `theme-${settings.colorScheme}`)}>
      {/* Overlay Enable Audio (Wajib untuk Autoplay Policy) */}
      {!audioEnabled && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <VolumeX className="w-24 h-24 mb-6 opacity-50" />
            <h1 className="text-3xl font-bold mb-4">Klik untuk Mengaktifkan Suara</h1>
            <p className="text-gray-300 mb-8 max-w-md text-center">Browser memblokir suara otomatis. Silakan klik tombol di bawah untuk memulai monitor antrian.</p>
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90" onClick={() => {
                setAudioEnabled(true);
                // Pancing play audio kosong untuk unlock
                if(audioRef.current) {
                    audioRef.current.play().catch(() => {});
                    audioRef.current.pause();
                }
            }}>
                <Volume2 className="mr-2" /> Mulai Monitor
            </Button>
        </div>
      )}

      <audio ref={audioRef} src={`/sounds/${settings.soundUrl || 'chime.mp3'}`} preload="auto"></audio>
      
      <header className="px-8 py-2 flex justify-between items-center bg-monitor-header shadow-lg text-monitor-header-foreground">
        <Image src="/qnext-logo.svg" alt="Logo" width={200} height={62} priority />
        <div className="text-right">
            <p className="text-3xl font-semibold">{currentDate}</p>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 grid-rows-6 gap-6 p-6 bg-monitor-background">
         <div className="col-span-8 row-span-4 rounded-lg overflow-hidden shadow-2xl bg-black">
            <iframe className="w-full h-full" src={getFullVideoUrl()} frameBorder="0" allow="autoplay"></iframe>
        </div>

        <Card className={cn("col-span-4 row-span-6 flex flex-col shadow-2xl bg-monitor-card border-none transition-all duration-500", isRecalling && "ring-8 ring-red-500")}>
          <CardHeader className="text-center py-4 bg-monitor-primary text-monitor-primary-foreground">
            <CardTitle className="text-4xl font-bold flex items-center justify-center gap-3">
              <Bell className={cn(latestServing && "animate-bounce")} /> SEDANG DIPANGGIL
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center p-4">
            {latestServing ? (
                <>
                    <p className="text-[9rem] font-extrabold text-monitor-primary leading-none tracking-tighter">{latestServing.number}</p>
                    <div className="mt-6 text-center w-full">
                        <p className="text-4xl font-medium text-monitor-muted-foreground">MENUJU</p>
                        <p className="text-8xl font-bold text-monitor-primary mt-2 bg-monitor-primary/5 py-4 rounded-xl">LOKET {latestServing.counter?.name}</p>
                    </div>
                </>
            ) : (
                <div className="text-center opacity-20">
                    <TicketIcon size={120} className="mx-auto mb-4" />
                    <p className="text-2xl font-medium italic">Menunggu Antrian</p>
                </div>
            )}
          </CardContent>
          {otherServing.length > 0 && (
            <div className="mt-auto p-4 border-t border-gray-100 bg-gray-50/50">
                <h3 className="text-center text-xl font-bold text-monitor-muted-foreground mb-3 uppercase tracking-widest text-xs">Antrian Lainnya</h3>
                <div className="space-y-2">
                    {otherServing.slice(0, 3).map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                            <span className="font-bold text-2xl">{t.number}</span>
                            <span className="font-semibold text-monitor-primary">LOKET {t.counter?.name}</span>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </Card>
        
        <div className="col-span-8 row-span-2 bg-white rounded-xl p-6 shadow-xl flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-monitor-muted-foreground flex items-center gap-2">
                <TicketIcon className="text-primary" /> ANTRIAN BERIKUTNYA
            </h2>
            <div className="grid grid-cols-5 gap-4 flex-1">
                {nextInQueue.map(t => (
                    <div key={t.id} className="bg-slate-50 border rounded-xl flex flex-col items-center justify-center p-4 text-center shadow-inner">
                        <p className="text-4xl font-black text-slate-800 tracking-tighter">{t.number}</p>
                        <p className="text-xs font-medium text-slate-500 uppercase mt-1 truncate w-full">{t.service?.name}</p>
                    </div>
                ))}
                {nextInQueue.length === 0 && <div className="col-span-5 flex items-center justify-center italic text-slate-400">Tidak ada antrian menunggu</div>}
            </div>
        </div>
      </main>

      <footer className="bg-monitor-header text-monitor-header-foreground p-4 border-t shadow-inner-top overflow-hidden relative">
        <div className="animate-marquee whitespace-nowrap text-2xl font-bold uppercase tracking-tight">
            {settings.footerText}
        </div>
        <div className="absolute bottom-1 left-1 text-[10px] opacity-50 font-mono text-black pointer-events-none">
            TTS: {debugInfo}
        </div>
      </footer>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-150%); } }
        .animate-marquee { display: inline-block; animation: marquee 40s linear infinite; }
        .theme-default {
            --monitor-background: #f8fafc;
            --monitor-header: #ffffff;
            --monitor-header-foreground: #0f172a;
            --monitor-card: #ffffff;
            --monitor-primary: #1e40af;
            --monitor-primary-foreground: #ffffff;
            --monitor-muted-foreground: #64748b;
        }
        .theme-forest {
            --monitor-background: #f0fdf4;
            --monitor-header: #ffffff;
            --monitor-header-foreground: #14532d;
            --monitor-card: #ffffff;
            --monitor-primary: #15803d;
            --monitor-primary-foreground: #ffffff;
            --monitor-muted-foreground: #166534;
        }
        .theme-sunset {
            --monitor-background: #fffaf0;
            --monitor-header: #ffffff;
            --monitor-header-foreground: #7c2d12;
            --monitor-card: #ffffff;
            --monitor-primary: #c2410c;
            --monitor-primary-foreground: #ffffff;
            --monitor-muted-foreground: #9a3412;
        }
        .theme-modern {
            --monitor-background: #0f172a;
            --monitor-header: #1e293b;
            --monitor-header-foreground: #f8fafc;
            --monitor-card: #1e293b;
            --monitor-primary: #f8fafc;
            --monitor-primary-foreground: #0f172a;
            --monitor-muted-foreground: #94a3b8;
        }
      `}</style>
    </div>
  );
}