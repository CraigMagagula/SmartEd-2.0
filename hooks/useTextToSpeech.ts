
import { useState, useEffect, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const speak = useCallback((text: string) => {
    if (!synth) {
        console.warn('Speech Synthesis API is not supported in this browser.');
        return;
    }
    if (isSpeaking) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setIsSpeaking(false);
    };
    synth.speak(utterance);
    setIsSpeaking(true);
  }, [synth, isSpeaking]);

  const stop = useCallback(() => {
    if (synth) {
      synth.cancel();
      setIsSpeaking(false);
    }
  }, [synth]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (synth && isSpeaking) {
        synth.cancel();
      }
    };
  }, [synth, isSpeaking]);

  return { isSpeaking, speak, stop };
};
