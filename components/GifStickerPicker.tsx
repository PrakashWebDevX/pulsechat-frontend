"use client";

import { useState, useEffect, useRef } from "react";

const GIPHY_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65"; // Public beta key

const STICKER_PACKS = [
  { name: "Happy", stickers: ["😊","😄","😁","🥳","🎉","✨","💫","🌟","🎊","👏","🙌","💪","🤩","😍","🥰"] },
  { name: "Sad",   stickers: ["😢","😭","😔","😞","💔","😿","🥺","😩","😫","😟","🙁","☹️","😣","😖","💧"] },
  { name: "Funny", stickers: ["😂","🤣","😆","😝","🤪","😜","🤭","😏","🙃","😋","😛","🤡","💀","☠️","🤦"] },
  { name: "Love",  stickers: ["❤️","💕","💖","💗","💓","💞","💝","💘","💟","🥰","😘","😍","💑","👫","💏"] },
  { name: "Cool",  stickers: ["😎","🤙","👍","🔥","💯","⚡","🌊","🎯","💥","🚀","🛸","⭐","🌈","🎸","🏆"] },
];

interface Props {
  onSelectGif: (url: string) => void;
  onSelectSticker: (emoji: string) => void;
  onClose: () => void;
}

export default function GifStickerPicker({ onSelectGif, onSelectSticker, onClose }: Props) {
  const [tab, setTab] = useState<"gifs" | "stickers">("stickers");
  const [stickerTab, setStickerTab] = useState(0);
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    if (tab !== "gifs") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGifs(search || "trending"), 400);
  }, [search, tab]);

  const fetchGifs = async (query: string) => {
    setLoading(true);
    try {
      const endpoint = query === "trending"
        ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=20&rating=g`
        : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref}
      className="absolute bottom-14 left-0 z-50 w-80 bg-surface-card border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
      {/* Tabs */}
      <div className="flex border-b border-surface-border">
        {(["stickers", "gifs"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${tab === t ? "text-brand-500 border-b-2 border-brand-500" : "text-gray-500 hover:text-gray-300"}`}>
            {t === "gifs" ? "🎬 GIFs" : "✨ Stickers"}
          </button>
        ))}
      </div>

      {tab === "stickers" ? (
        <>
          {/* Sticker category tabs */}
          <div className="flex gap-1 px-2 py-2 overflow-x-auto border-b border-surface-border">
            {STICKER_PACKS.map((pack, i) => (
              <button key={pack.name} onClick={() => setStickerTab(i)}
                className={`px-2 py-1 rounded-lg text-xs flex-shrink-0 transition-colors ${stickerTab === i ? "bg-brand-500/20 text-brand-500" : "text-gray-500 hover:text-gray-300"}`}>
                {pack.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 p-3 max-h-52 overflow-y-auto">
            {STICKER_PACKS[stickerTab].stickers.map((emoji) => (
              <button key={emoji} onClick={() => { onSelectSticker(emoji); onClose(); }}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-surface-raised rounded-xl transition-all hover:scale-125">
                {emoji}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* GIF search */}
          <div className="p-2 border-b border-surface-border">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search GIFs…"
              className="w-full bg-surface-raised border border-surface-border rounded-xl px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-1 p-2 max-h-52 overflow-y-auto">
            {loading ? (
              <div className="col-span-2 flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : gifs.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-600 text-sm">No GIFs found</div>
            ) : gifs.map((gif) => (
              <button key={gif.id}
                onClick={() => { onSelectGif(gif.images.fixed_height_small.url); onClose(); }}
                className="rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gif.images.fixed_height_small.url} alt={gif.title}
                  className="w-full h-20 object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-700 pb-1">Powered by GIPHY</p>
        </>
      )}
    </div>
  );
}
