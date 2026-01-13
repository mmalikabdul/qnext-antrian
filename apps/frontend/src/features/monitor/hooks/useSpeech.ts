import { useState, useEffect, useCallback } from 'react';

interface UseSpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  preferredVoice?: string;
}

export const useSpeech = (options: UseSpeechOptions = {}) => {
  const { 
    rate = 0.9, 
    pitch = 1, 
    lang = 'id-ID',
    preferredVoice = 'Google Bahasa Indonesia'
  } = options;

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

        // 1. Prioritas Utama: Cari yang sesuai preferredVoice (misal: 'Google Bahasa Indonesia')
        let selectedVoice = voices.find(v => v.name === preferredVoice);

        // 2. Prioritas Kedua: Cari voice dengan lang 'id-ID' apa saja
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang === 'id-ID' || v.name.includes('Indonesia'));
        }
        
        // 3. Fallback: Malay
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang === 'ms-MY');

        // 4. Fallback: English
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang === 'en-US');

        if (selectedVoice) {
            setVoice(selectedVoice);
            setDebugInfo(`Voice active: ${selectedVoice.name} (${selectedVoice.lang})`);
        } else {
            setDebugInfo(`No suitable voice found. Total voices: ${voices.length}`);
        }
      };

      loadVoices();
      
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
        setDebugInfo("Web Speech API not supported in this browser.");
    }
  }, [preferredVoice]);

  const speak = useCallback((text: string) => {
    if (!isSupported) {
        console.warn("Speech not supported");
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang; 
    } else {
        utterance.lang = lang; 
    }

    utterance.onstart = () => console.log("▶️ Speech started:", text);
    utterance.onend = () => console.log("✅ Speech ended");
    utterance.onerror = (e) => console.error("❌ Speech error:", e);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voice, rate, pitch, lang]);

  return { speak, isSupported, debugInfo };
};
