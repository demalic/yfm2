import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { TableBackdrop } from './TableBackdrop';
import { MapThemeSwitcher } from './ui/map-theme-switcher';
import { ButtonCta } from './ui/button-shiny';
import { GlobeAnalytics } from './ui/cobe-globe-analytics';
import { SpaceBackground } from './ui/space-background';
import { useSettings } from '../hooks/useSettings';
import type { MapTheme } from '../lib/mapTiles';

interface MapSelectionScreenProps {
  onContinue: () => void;
}

const PARTICLE_COLORS: Record<MapTheme, string> = {
  dark: 'rgba(248,148,6,0.85)',
  light: 'rgba(248,148,6,0.85)',
  satellite: 'rgba(96,165,250,0.9)',
};

const RING_GLOW_RGB: Record<MapTheme, string> = {
  dark: '248,148,6',
  light: '248,148,6',
  satellite: '96,165,250',
};

export function MapSelectionScreen({ onContinue }: MapSelectionScreenProps) {
  const { settings } = useSettings();
  const mapTheme = (settings?.mapTheme as MapTheme) || 'dark';
  const particleColor = PARTICLE_COLORS[mapTheme] ?? PARTICLE_COLORS.dark;
  const glowRgb = RING_GLOW_RGB[mapTheme] ?? RING_GLOW_RGB.dark;
  const globeRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-full auth-screen relative overflow-hidden">
      <TableBackdrop showHorizon={false} showFloor={false} />

      <SpaceBackground
        className="absolute inset-0 z-[5]"
        particleColor={particleColor}
        particleCount={520}
        ringRatio={0.85}
        trailAlpha={0.4}
        centerRef={globeRef}
      />

      {/* Smooth vignette so particles fade in as they drift toward the globe */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[6]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.38) 44%, rgba(0,0,0,0.8) 68%, #000 90%)',
        }}
      />

      <div className="relative h-full flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8">
        <header className="relative z-10 w-full max-w-lg text-center shrink-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Map<span className="text-brand-orange">Theme</span>.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-400 font-medium">
            Preferences are saved to settings.
          </p>
        </header>

        <div className="relative z-10 mt-5 sm:mt-6 shrink-0">
          <MapThemeSwitcher />
        </div>

        <div className="flex-1 w-full max-w-lg min-h-0 flex items-center justify-center py-4">
          <div ref={globeRef} className="relative z-[1] aspect-square w-full max-w-md">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-[28%] rounded-full"
              style={{
                background: `radial-gradient(circle, transparent 58%, rgba(${glowRgb},0.26) 67%, rgba(${glowRgb},0.17) 74%, rgba(${glowRgb},0.10) 81%, rgba(${glowRgb},0.055) 88%, rgba(${glowRgb},0.022) 95%, transparent 100%)`,
                filter: 'blur(16px)',
              }}
            />
            <GlobeAnalytics className="relative w-full" mapTheme={mapTheme} />
          </div>
        </div>

        <div className="relative z-10 shrink-0 pb-2">
          <ButtonCta label="Open Map" onClick={onContinue} className="w-fit px-8">
            <ArrowRight className="w-4 h-4 text-[#f89406]" />
          </ButtonCta>
        </div>
      </div>
    </div>
  );
}

export type MapSubView = 'select' | 'map';
