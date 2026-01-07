import { useCallback } from 'react';

export const useSpeech = () => {
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    
    const voices = window.speechSynthesis.getVoices();
    // Cari suara Indonesia terbaik
    const idVoice = voices.find(v => v.lang === 'id-ID' && v.name.includes('Google')) || 
                    voices.find(v => v.lang === 'id-ID');
                    
    if (idVoice) utterance.voice = idVoice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak };
};
