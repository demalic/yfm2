import { Moon, Sun, Satellite } from 'lucide-react';
import { NavBar, type TubelightNavItem } from './tubelight-navbar';
import { useSettings } from '../../hooks/useSettings';
import type { MapTheme } from '../../lib/mapTiles';

const THEME_ITEMS: TubelightNavItem[] = [
  { name: 'Dark', icon: Moon },
  { name: 'Light', icon: Sun },
  { name: 'Satellite', icon: Satellite },
];

interface MapThemeSwitcherProps {
  className?: string;
}

export function MapThemeSwitcher({ className }: MapThemeSwitcherProps) {
  const { settings, updateSettings } = useSettings();
  const mapTheme = (settings?.mapTheme as MapTheme) || 'dark';
  const activeName = mapTheme.charAt(0).toUpperCase() + mapTheme.slice(1);

  return (
    <NavBar
      items={THEME_ITEMS}
      className={className}
      size="lg"
      activeTab={activeName}
      onTabChange={(name) => {
        void updateSettings({ mapTheme: name.toLowerCase() as MapTheme });
      }}
    />
  );
}
