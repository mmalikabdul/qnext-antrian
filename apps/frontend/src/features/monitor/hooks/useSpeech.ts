import { useState, useEffect, useCallback } from 'react';

export const useSpeech = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        
        if (voices.length === 0) {
            setDebugInfo("No voices found yet (loading...)");
            return;
        }

        // 1. Cari Bahasa Indonesia (Google Bahasa Indonesia / Microsoft Andika / dll)
        let selectedVoice = voices.find(v => v.lang === 'id-ID' || v.name.includes('Indonesia'));
        
        // 2. Fallback: Malay
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang === 'ms-MY');

        // 3. Fallback: English (Google US English) - Biar minimal ada suara
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang === 'en-US');

        if (selectedVoice) {
            setVoice(selectedVoice);
            setDebugInfo(`Voice active: ${selectedVoice.name} (${selectedVoice.lang})`);
        } else {
            setDebugInfo(`No suitable voice found. Total voices: ${voices.length}`);
        }
      };

      loadVoices();
      
      // Chrome kadang butuh event ini karena voice di-load async
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
        setDebugInfo("Web Speech API not supported in this browser.");
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported) {
        console.warn("Speech not supported");
        return;
    }

    window.speechSynthesis.cancel(); // Reset antrian

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.volume = 1;

    // Jika voice ditemukan, pakai. Jika tidak, browser akan pakai default system voice.
    if (voice) {
      utterance.voice = voice;
      // Paksa lang sesuai voice agar aksennya benar
      utterance.lang = voice.lang; 
    } else {
        // Default fallback
        utterance.lang = 'id-ID'; 
    }

    utterance.onstart = () => console.log("▶️ Speech started:", text);
    utterance.onend = () => console.log("✅ Speech ended");
    utterance.onerror = (e) => console.error("❌ Speech error:", e);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voice]);

  return { speak, isSupported, debugInfo };
};
