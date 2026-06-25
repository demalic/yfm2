import { useEffect, useState } from 'react';
import { OpeningBackdrop } from './OpeningBackdrop';
import { YfmLogoSplash } from './YfmLogo';

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
      className="fixed inset-0 z-[9999] auth-screen splash-screen flex items-center justify-center"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      <OpeningBackdrop />

      <div
        className="splash-logo-wrap relative z-10 flex items-center justify-center px-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.96)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        }}
      >
        <YfmLogoSplash />
      </div>
    </div>
  );
}
