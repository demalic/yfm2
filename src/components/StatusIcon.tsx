import React from 'react';

export type IconKey =
  | 'skull'
  | 'house'
  | 'money-bag'
  | 'dots'
  | 'phone'
  | 'hourglass'
  | 'check'
  | 'exclamation'
  | 'door'
  | 'chat'
  | 'star'
  | 'x-mark'
  | 'arrow-right'
  | 'arrow-up'
  | 'question';

interface StatusIconProps {
  iconKey: IconKey;
  className?: string;
}

export function StatusIconSvg({ iconKey, className = 'w-4 h-4' }: StatusIconProps) {
  switch (iconKey) {
    case 'skull':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-2.5 10c-.83 0-1.5-.67-1.5-1.5S8.67 9 9.5 9s1.5.67 1.5 1.5S10.33 12 9.5 12zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 9 14.5 9s1.5.67 1.5 1.5S15.33 12 14.5 12zM10 19h4v1H10v-1z" />
        </svg>
      );
    case 'house':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      );
    case 'money-bag':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9.79 2 8 3.79 8 6c0 .73.21 1.4.56 1.97L6.5 10H17.5l-2.06-2.03C15.79 7.4 16 6.73 16 6c0-2.21-1.79-4-4-4zm-5 9c-1.66 0-3 1.34-3 3 0 2.97 2.12 5.44 5 5.91V22h6v-2.09c2.88-.47 5-2.94 5-5.91 0-1.66-1.34-3-3-3H7zm5 7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
          <path d="M11 14h2v1h1v-1h.5c.55 0 1-.45 1-1s-.45-1-1-1h-2v-1h2v-1h-1V9h-2v1h-.5c-.55 0-1 .45-1 1s.45 1 1 1h2v1h-2v1h-1v1h1v1z" />
        </svg>
      );
    case 'dots':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      );
    case 'phone':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
      );
    case 'hourglass':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2v6l2.5 2.5L6 13v3h-.01L6 22h12l-.01-6H18v-3l-2.5-2.5L18 8V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z" />
        </svg>
      );
    case 'check':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'exclamation':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      );
    case 'door':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-6-6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
        </svg>
      );
    case 'star':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    case 'x-mark':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case 'arrow-up':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      );
    case 'question':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
}

// Render a status icon as a colored circle badge (for map markers and list items)
interface StatusIconBadgeProps {
  iconKey: IconKey;
  color: string;
  size?: number;
}

export function StatusIconBadge({ iconKey, color, size = 28 }: StatusIconBadgeProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <StatusIconSvg
        iconKey={iconKey}
        className="w-4 h-4 text-white"
      />
    </div>
  );
}

// Returns an SVG HTML string for use inside Leaflet divIcon HTML
export function getIconSvgHtml(iconKey: string, color = 'white', size = 14): string {
  const s = size;
  switch (iconKey) {
    case 'skull':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-2.5 10c-.83 0-1.5-.67-1.5-1.5S8.67 9 9.5 9s1.5.67 1.5 1.5S10.33 12 9.5 12zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 9 14.5 9s1.5.67 1.5 1.5S15.33 12 14.5 12zM10 19h4v1H10v-1z"/></svg>`;
    case 'house':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
    case 'money-bag':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M11.5 2C9.57 2 8 3.57 8 5.5c0 .65.19 1.26.51 1.77L6.5 9H17.5l-2.01-1.73c.32-.51.51-1.12.51-1.77C16 3.57 14.43 2 12.5 2h-1zM7 10c-1.66 0-3 1.34-3 3 0 2.97 2.12 5.44 5 5.91V21h6v-2.09c2.88-.47 5-2.94 5-5.91 0-1.66-1.34-3-3-3H7zm5 8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm.5-4h-1v-1H10v-1h1.5v-1H10V10h2v1h1.5v1H12v1h1.5v1H12v1z"/></svg>`;
    case 'dots':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`;
    case 'phone':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`;
    case 'hourglass':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M6 2v6l2.5 2.5L6 13v3h-.01L6 22h12l-.01-6H18v-3l-2.5-2.5L18 8V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z"/></svg>`;
    case 'check':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    case 'exclamation':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
    case 'door':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-6-6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`;
    case 'chat':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>`;
    case 'star':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
    case 'x-mark':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    case 'arrow-right':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    case 'arrow-up':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
    case 'question':
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>`;
    default:
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}"><circle cx="12" cy="12" r="5"/></svg>`;
  }
}

export const ICON_OPTIONS: { key: IconKey; label: string }[] = [
  { key: 'skull', label: 'Skull' },
  { key: 'house', label: 'House' },
  { key: 'money-bag', label: 'Money' },
  { key: 'dots', label: 'Dots' },
  { key: 'phone', label: 'Phone' },
  { key: 'hourglass', label: 'Hourglass' },
  { key: 'check', label: 'Check' },
  { key: 'exclamation', label: 'Alert' },
  { key: 'door', label: 'Door' },
  { key: 'chat', label: 'Chat' },
  { key: 'star', label: 'Star' },
  { key: 'x-mark', label: 'X' },
  { key: 'arrow-right', label: 'Arrow' },
  { key: 'arrow-up', label: 'Up' },
  { key: 'question', label: 'Question' },
];
