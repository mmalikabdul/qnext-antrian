import React, { useEffect, useRef, useState } from 'react';
import { useMonitorQueue } from '../hooks/useMonitorQueue';
import { useSpeech } from '../hooks/useSpeech';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function MonitorDashboard() {
  const { servingTickets, settings, lastCalledTicket, lastRecallTicket } = useMonitorQueue();
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
    
    return `Nomor antrian, ${readableNumber}. Silahkan menuju loket, ${ticket.counter?.name}`;
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
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans bg-zinc-900 text-white relative select-none">
      
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

      <audio ref={audioRef} src={`/sounds/${settings.soundUrl || 'chime.mp3'}`} preload="auto"></audio>
      
      {/* --- HEADER --- */}
      <header className="h-24 bg-white text-zinc-900 flex items-center justify-between px-8 relative z-20 shadow-md">
        {/* Decorative Curve (Optional, simplified as border for now) */}
        <div className="flex items-center gap-6">
            <div className="relative h-16 w-16">
                 {/* Logo Placeholder */}
                 <Image src="/qnext-logo.svg" alt="Logo" fill className="object-contain" priority />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase leading-none">
                    {"QNext Antrian"}
                </h1>
                <p className="text-zinc-500 font-semibold text-sm mt-1">Sistem Antrian Terpadu</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-xl font-medium text-zinc-500">{currentDate}</p>
            <p className="text-5xl font-bold text-zinc-800 tabular-nums leading-none tracking-tight">{currentTime}</p>
        </div>
      </header>

      {/* --- MAIN CONTENT (SPLIT) --- */}
        <div className="flex-1 p-6 flex gap-6 bg-zinc-800/50">
        

        {/* LEFT: BIG CALL CARD */}
          <div className="w-[45%] flex flex-col">

            {/* The "Paper" Effect Container */}
           <div className="flex-1 bg-white rounded-3xl shadow-2xl flex flex-col justify-center px-10">
                
                {/* Red Header Tag */}
                <div className="bg-[#e11d48] text-white p-6 relative overflow-hidden">
                     {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Volume2 size={100} />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-wider text-center drop-shadow-md">
                        {latestServing ? "MEMANGGIL ANTRIAN" : "MENUNGGU ANTRIAN"}
                    </h2>
                </div>

                {/* White Body */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                    {latestServing ? (
                        <>
                           <div className="flex flex-row items-center justify-center w-full gap-8">
                                {/* Nomor Antrian */}
                                <div className="flex flex-col items-center">
                                    <span className="text-8xl font-black text-zinc-800 tracking-tighter">
                                        {latestServing.number}
                                    </span>
                                    <span className="text-zinc-400 font-bold uppercase tracking-widest mt-2">Nomer Antrian</span>
                                </div>

                                {/* Arrow */}
                                <div className="text-[#e11d48] animate-pulse">
                                    <ArrowRight size={80} strokeWidth={4} />
                                </div>

                                {/* Loket */}
                                <div className="flex flex-col items-center">
                                    <span className="text-8xl font-black text-zinc-800 tracking-tighter">
                                        {latestServing.counter?.name}
                                    </span>
                                    <span className="text-zinc-400 font-bold uppercase tracking-widest mt-2">Loket</span>
                                </div>
                           </div>
                        </>
                    ) : (
                        <div className="opacity-20 flex flex-col items-center animate-pulse">
                            <span className="text-6xl font-bold text-zinc-400">ISTIRAHAT</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* RIGHT: VIDEO */}
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-[#22c55e] h-full w-full">
              <iframe
                src={getFullVideoUrl()}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
      </div>

      {/* --- BOTTOM: COUNTER LIST --- */}
      <div className="h-64 bg-zinc-900 p-6 pt-0 z-10">
         <div className="grid grid-cols-5 gap-4 h-full">
            {/* Render 5 slots, fill with servingTickets or empty placeholders */}
            {Array.from({ length: 5 }).map((_, i) => {
                const ticket = servingTickets[i];
                return (
                    <div key={i} className="flex flex-col rounded-xl overflow-hidden shadow-lg border-2 border-zinc-700/50 bg-[#166534]">
                        {/* Upper Part (Number) */}
                        <div className="flex-1 flex items-center justify-center bg-[#22c55e] relative">
                             {ticket ? (
                                <span className="text-6xl font-black text-white tracking-tighter drop-shadow-md">{ticket.number}</span>
                             ) : (
                                <span className="text-4xl font-bold text-green-800/30">--</span>
                             )}
                        </div>
                        {/* Lower Part (Label) */}
                        <div className="h-14 bg-[#14532d] flex items-center justify-center">
                            <span className="text-2xl font-bold text-green-100 uppercase tracking-widest">
                                {ticket ? `LOKET ${ticket.counter?.name}` : `LOKET ${i + 1}`}
                            </span>
                        </div>
                    </div>
                );
            })}
         </div>
      </div>

      {/* --- FOOTER MARQUEE --- */}
      <footer className="h-12 bg-white text-zinc-900 flex items-center overflow-hidden border-t-4 border-[#e11d48]">
        <div className="animate-marquee whitespace-nowrap text-xl font-bold uppercase tracking-wide px-4 w-full">
            {settings.footerText || "Selamat Datang di Pelayanan Terpadu - Budayakan Antri Untuk Kenyamanan Bersama - Terima Kasih Atas Kunjungan Anda"}
        </div>
      </footer>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 30s linear infinite; }
      `}</style>
    </div>
  );
}