import { useEffect, useState } from 'react';
import yfmLogo from '../assets/yfm-logo.jpg';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(false), 2000);
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
      className="fixed inset-0 z-[9999] login-screen flex flex-col items-center justify-center"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      <div className="login-grid absolute inset-0 pointer-events-none" aria-hidden />

      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.96)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        }}
      >
        <img
          src={yfmLogo}
          alt="YFM"
          className="w-64 h-64 sm:w-72 sm:h-72 object-contain logo-glow"
        />
        <p className="text-gray-500 text-xs tracking-[0.25em] uppercase font-medium mt-4">
          Field Sales Platform
        </p>
      </div>

      <div className="absolute bottom-16 w-48 splash-bar">
        <div className="splash-bar-fill" />
      </div>
    </div>
  );
}
