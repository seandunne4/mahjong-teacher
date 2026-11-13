import { useEffect, useState } from 'react';

/** Mandarin text-to-speech using the browser's built-in voices (v1; recorded clips in Phase 4). */
function pickVoice(): SpeechSynthesisVoice | undefined {
  if (typeof speechSynthesis === 'undefined') return undefined;
  const voices = speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'zh-CN') ??
    voices.find((v) => v.lang.startsWith('zh-')) ??
    voices.find((v) => v.lang.startsWith('zh'))
  );
}

export function speak(text: string): void {
  const voice = pickVoice();
  if (!voice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[/／]/g, ' '));
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.8;
  speechSynthesis.speak(u);
}

export function useHasChineseVoice(): boolean {
  const [has, setHas] = useState(() => !!pickVoice());
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return;
    const update = () => setHas(!!pickVoice());
    speechSynthesis.addEventListener('voiceschanged', update);
    update();
    return () => speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return has;
}

export function SpeakButton({ text, label }: { text: string; label?: string }) {
  const has = useHasChineseVoice();
  if (!has) return null;
  return (
    <button
      type="button"
      className="speak"
      aria-label={`Hear ${label ?? text} pronounced`}
      title="Hear it"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      🔊
    </button>
  );
}
