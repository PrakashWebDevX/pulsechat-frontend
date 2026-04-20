"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  onSend: (audioDataUrl: string, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(20).fill(4));

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => stopAll();
  }, []);

  const stopAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Waveform visualizer
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const animateWave = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const newBars = Array.from({ length: 20 }, (_, i) => {
          const val = data[Math.floor(i * data.length / 20)] || 0;
          return Math.max(4, Math.round((val / 255) * 32));
        });
        setBars(newBars);
        animRef.current = requestAnimationFrame(animateWave);
      };
      animateWave();

      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => setAudioUrl(reader.result as string);
        reader.readAsDataURL(blob);
      };

      mr.start();
      setRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s >= 119) { stopRecording(); return s; }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      setDuration(seconds);
      mediaRef.current.stop();
    }
    stopAll();
    setRecording(false);
  };

  const handleSend = () => {
    if (audioUrl) onSend(audioUrl, duration || seconds);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface-card border-t border-surface-border animate-slide-up">
      {/* Cancel */}
      <button onClick={() => { stopAll(); onCancel(); }}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Waveform */}
      <div className="flex-1 flex items-center gap-1 h-10 overflow-hidden">
        {recording ? (
          <>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <div className="flex items-end gap-0.5 flex-1 h-8">
              {bars.map((h, i) => (
                <div key={i} className="waveform-bar flex-1 text-brand-500"
                  style={{ height: h, animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
          </>
        ) : audioUrl ? (
          <div className="flex items-center gap-2 flex-1">
            <svg className="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm-1 13V8l6 4-6 4z" />
            </svg>
            <div className="flex-1 h-1 bg-surface-border rounded-full">
              <div className="h-1 bg-brand-500 rounded-full w-full" />
            </div>
          </div>
        ) : null}
      </div>

      {/* Timer */}
      <span className="text-sm font-mono text-gray-400 flex-shrink-0 min-w-[40px] text-right">
        {formatTime(seconds)}
      </span>

      {/* Stop / Send */}
      {recording ? (
        <button onClick={stopRecording}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      ) : (
        <button onClick={handleSend} disabled={!audioUrl}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors flex-shrink-0 disabled:opacity-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      )}
    </div>
  );
}
