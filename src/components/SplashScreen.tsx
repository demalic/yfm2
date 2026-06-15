import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) {
      const doneTimer = setTimeout(onDone, 600);
      return () => clearTimeout(doneTimer);
    }
  }, [visible, onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.96)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        }}
      >
        <img
          src="/yfm-logo.jpg"
          alt="YFM"
          className="h-32 w-auto object-contain"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = 'none';
            const fallback = el.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div
          className="hidden flex-col items-center justify-center"
        >
          <span className="text-white font-black text-8xl tracking-tight">YFM</span>
          <span className="text-gray-500 text-sm tracking-widest uppercase mt-2">Field Sales Platform</span>
        </div>
      </div>
    </div>
  );
}
