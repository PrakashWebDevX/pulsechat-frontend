"use client";

import { useState, useRef } from "react";

interface Props {
  src: string;
  duration?: number;
  isMine: boolean;
}

export default function AudioMessage({ src, duration, isMine }: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <audio ref={audioRef} src={src}
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          const p = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
          setProgress(p);
          setCurrentTime(audioRef.current.currentTime);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
      />

      {/* Play/Pause */}
      <button onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
          ${isMine ? "bg-white/20 hover:bg-white/30" : "bg-brand-500/20 hover:bg-brand-500/30"}`}
      >
        {playing ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* Waveform progress bar */}
        <div className="relative h-6 flex items-center">
          <div className="flex items-end gap-px w-full h-full">
            {Array.from({ length: 24 }, (_, i) => {
              const h = [3,5,8,12,7,10,14,9,6,11,13,8,5,10,12,7,9,11,6,8,13,10,5,7][i];
              const filled = (i / 24) * 100 <= progress;
              return (
                <div key={i} className="flex-1 rounded-full transition-colors"
                  style={{
                    height: h,
                    backgroundColor: filled
                      ? (isMine ? "rgba(255,255,255,0.9)" : "#22c55e")
                      : (isMine ? "rgba(255,255,255,0.3)" : "rgba(34,197,94,0.3)"),
                  }}
                />
              );
            })}
          </div>
          {/* Scrub */}
          <input type="range" min={0} max={100} value={progress}
            onChange={(e) => {
              if (!audioRef.current) return;
              const t = (Number(e.target.value) / 100) * (audioRef.current.duration || 0);
              audioRef.current.currentTime = t;
              setProgress(Number(e.target.value));
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Time */}
        <span className={`text-[10px] ${isMine ? "text-white/60" : "text-gray-500"}`}>
          {formatTime(currentTime)} / {formatTime(duration || 0)}
        </span>
      </div>
    </div>
  );
}
