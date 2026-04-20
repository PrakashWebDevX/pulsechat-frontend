"use client";

import { useEffect, useRef } from "react";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕"],
  },
  {
    name: "Gestures",
    emojis: ["👍","👎","👏","🙌","🤲","🤝","🙏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👋","🤚","🖐️","✋","🖖","💪","🦾","🖕","✍️","🤳","💅","🦵","🦶","👂","🦻","👃","👀","👁️","👅","👄"],
  },
  {
    name: "Hearts",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"],
  },
  {
    name: "Objects",
    emojis: ["🎉","🎊","🎈","🎁","🎀","🎗️","🎟️","🎫","🏆","🥇","🥈","🥉","🏅","🎖️","🔥","⚡","💥","🌈","☀️","🌙","⭐","🌟","💫","✨","🎵","🎶","🎤","🎧","🎸","🎹","🎺","🎻","🥁","🎮","🕹️","🃏","🎲","🧩","♟️","🎯","🎳","🎰","🎪"],
  },
  {
    name: "Food",
    emojis: ["🍕","🍔","🍟","🌭","🍿","🧂","🥓","🥚","🍳","🧇","🥞","🧈","🍞","🥐","🥖","🫓","🥨","🧀","🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥮","🍢","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜"],
  },
];

// Quick reactions shown on hover
export const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-0 z-50 w-80 bg-surface-card border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
    >
      <div className="h-64 overflow-y-auto p-2">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name} className="mb-3">
            <p className="text-xs text-gray-600 font-medium px-1 mb-1">{cat.name}</p>
            <div className="flex flex-wrap gap-0.5">
              {cat.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { onSelect(emoji); onClose(); }}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-surface-raised rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
