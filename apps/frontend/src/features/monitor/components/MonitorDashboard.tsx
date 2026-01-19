import React, { useEffect, useRef, useState } from 'react';
import { useMonitorQueue } from '../hooks/useMonitorQueue';
import { useSpeech } from '../hooks/useSpeech';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function MonitorDashboard() {
  const { servingTickets, allTodayTickets, settings, lastCalledTicket, lastRecallTicket } = useMonitorQueue();
  // Config Suara agar lebih natural
  const { speak, debugInfo } = useSpeech({
    rate: 0.85, 
    pitch: 1.1, 
    preferredVoice: 'Google Bahasa Indonesia'
  });
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    // Timer untuk tanggal dan jam
    const updateTime = () => {
        const now = new Date();
        setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
        setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper untuk format teks antrian
  const formatTicketText = (ticket: typeof lastCalledTicket) => {
    if (!ticket) return '';
    const readableNumber = ticket.number.split('').map(char => {
        if (!isNaN(Number(char))) return char === '0' ? 'Kosong' : char;
        return char;
    }).join(' ');
    
    return `Nomor antrian, ${readableNumber}. Silahkan menuju, ${ticket.counter?.name}`;
  };

  // Handle Voice Announcement
  useEffect(() => {
    if (!lastCalledTicket || !audioEnabled) return;

    const announce = () => {
        const audio = audioRef.current;
        const textToSpeak = formatTicketText(lastCalledTicket);

        if (audio && settings?.soundUrl) {
            const onChimeEnd = () => {
                speak(textToSpeak);
                audio.removeEventListener('ended', onChimeEnd);
            };
            audio.addEventListener('ended', onChimeEnd);
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Audio play error:", e));
        } else {
            speak(textToSpeak);
        }
    };

    announce();
  }, [lastCalledTicket, speak, settings, audioEnabled]);

  // Handle Recall
  useEffect(() => {
    if (!lastRecallTicket || !audioEnabled) return;

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

  if (!settings) return <div className="h-screen flex items-center justify-center bg-black text-white">Inisialisasi Monitor...</div>;

  // Ticket yang sedang dipanggil (paling baru atau serving pertama)
  const latestServing = servingTickets[0];
  
  // Waiting tickets untuk ditampilkan di bagian Antrian Berikutnya
  const waitingTickets = allTodayTickets.filter(t => t.status === 'WAITING').slice(0, 5); 

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
    <div className={cn("flex flex-col h-screen overflow-hidden font-sans", `theme-${settings.colorScheme || 'default'}`)}>
       <audio ref={audioRef} src={`/sounds/${settings.soundUrl || 'chime.mp3'}`} preload="auto"></audio>
      
      {/* --- AUDIO ENABLE OVERLAY --- */}
      {!audioEnabled && (
        <div className="absolute inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <VolumeX className="w-20 h-20 mb-6 opacity-50" />
            <h1 className="text-3xl font-bold mb-4">Klik Layar untuk Mengaktifkan Suara</h1>
            <Button size="lg" className="text-xl px-10 py-8 bg-green-600 hover:bg-green-700 rounded-2xl" onClick={() => {
                setAudioEnabled(true);
                if(audioRef.current) {
                    audioRef.current.play().catch(() => {});
                    audioRef.current.pause();
                }
            }}>
                <Volume2 className="mr-3 w-8 h-8" /> MULAI DISPLAY
            </Button>
        </div>
      )}

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

      <main className="flex-1 flex flex-col gap-6 p-6 bg-monitor-background">
        {/* TOP ROW - Video (left) & Sedang Dipanggil (right) */}
        <div className="flex-1 flex gap-6">
          {/* Video Section - 2/3 width */}
          <div className="flex-[2] rounded-lg overflow-hidden shadow-2xl bg-black flex items-center justify-center">
            {settings?.videoUrl ? (
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

          {/* Sedang Dipanggil Card - 1/3 width */}
          <div className={cn(
            "flex-1 rounded-lg flex flex-col shadow-2xl transition-all duration-300",
            "bg-monitor-card text-monitor-card-foreground"
          )}>
            <div className="text-center py-4 bg-monitor-primary text-monitor-primary-foreground">
              <h2 className="text-4xl font-bold tracking-wider flex items-center justify-center gap-3">
                <Volume2 className="animate-swing"/> SEDANG DIPANGGIL
              </h2>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center w-full p-4">
              {latestServing ? (
                  <>
                      <p className="text-8xl font-extrabold leading-none tracking-tight text-monitor-primary transition-all duration-300">
                          {latestServing.number}
                      </p>
                      <div className="mt-6 text-center w-full">
                          <p className="text-3xl font-medium text-monitor-muted-foreground">MENUJU</p>
                          <p className="text-3xl font-bold text-monitor-primary mt-2 bg-monitor-primary/10 py-2 rounded-lg">
                              {latestServing.counter?.name}
                          </p>
                      </div>
                  </>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-monitor-muted-foreground">
                      <Volume2 className="w-32 h-32 opacity-20"/>
                      <p className="mt-4 text-2xl font-medium">Menunggu Panggilan</p>
                  </div>
              )}
            </div>
            {servingTickets.length > 1 && (
              <div className="mt-auto p-4 border-t-2 border-monitor-primary/10">
                  <h3 className="text-center text-xl font-bold text-monitor-muted-foreground mb-3">SEDANG DILAYANI</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {servingTickets.slice(1).map((ticket) => (
                          <div key={ticket.id} className="flex justify-between items-center bg-monitor-background/20 p-2 rounded-lg text-lg">
                              <span className="font-bold">{ticket.number}</span>
                              <span className="font-semibold text-monitor-primary">{ticket.counter?.name}</span>
                          </div>
                      ))}
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ROW - Antrian Berikutnya (Full width horizontal bar) */}
        <div className="h-52 rounded-lg p-6 shadow-xl flex flex-col bg-[var(--monitor-card)] text-monitor-card-foreground border-2 border-monitor-primary/20">
          <h2 className="text-3xl font-bold mb-4 px-2 text-monitor-primary uppercase tracking-wide">Antrian Berikutnya</h2>
          <div className="flex gap-6 flex-1">
              {waitingTickets.map((ticket, idx) => (
                  <div key={ticket.id || idx} className="flex-1 bg-gradient-to-br from-monitor-primary/5 to-monitor-primary/10 border-2 border-monitor-primary/30 rounded-xl flex flex-col items-center justify-center p-4 text-center transition-all duration-300 hover:border-monitor-primary/50 hover:shadow-lg">
                     <p className="text-5xl font-black tracking-tight text-monitor-primary mb-2">{ticket.number}</p>
                     <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">
                      {ticket.service.name}
                     </p>
                  </div>
              ))}
               {Array.from({ length: Math.max(0, 5 - waitingTickets.length) }).map((_, i) => (
                  <div key={`placeholder-${i}`} className="flex-1 bg-[var(--monitor-background-10)] border-2 border-dashed border-monitor-primary/10 rounded-xl flex items-center justify-center p-4 text-3xl font-bold opacity-20">
                      -
                  </div>
              ))}
          </div>
        </div>

      </main>

      <footer className="bg-monitor-header text-monitor-header-foreground p-2 shadow-inner-top">
        <div className="overflow-hidden">
            <p className="text-lg font-medium whitespace-nowrap animate-marquee">
                {settings.footerText || 'Selamat datang di layanan Front Office kami. Kepuasan anda adalah prioritas kami.'}
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
      --monitor-header: hsl(203 60% 90% / 0.8);
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
      --monitor-header: hsl(120 40% 88% / 0.8);
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
      --monitor-header: hsl(30 90% 88% / 0.8);
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
      --monitor-header: hsl(220 15% 30% / 0.8);
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