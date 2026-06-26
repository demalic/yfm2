import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import type { Lead } from '../types';
import { Locate, Compass, MapPin, Filter, X, Trash2, Moon, Sun, Satellite } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatusIconSvg, getIconSvgHtml } from './StatusIcon';
import type { IconKey } from './StatusIcon';
import { StaggeredDropdown } from './ui/animated-staggered-dropdown';
import {
  applyMapTheme,
  createMapTileSets,
  mapThemeBackground,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  type MapTheme,
  type MapTileSet,
} from '../lib/mapTiles';

interface LeadMapProps {
  onPinClick?: (lead: Lead) => void;
  statusFilter?: Set<string>;
  onStatusFilterChange?: (filter: Set<string>) => void;
}

type LocationMode = 'off' | 'following' | 'heading';

type MapWithTiles = L.Map & { tileSets: MapTileSet };

const THEME_ITEMS: { id: MapTheme; label: string; icon: LucideIcon }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'satellite', label: 'Satellite', icon: Satellite },
];

export function LeadMap({ onPinClick, statusFilter, onStatusFilterChange }: LeadMapProps) {
  const { member } = useAuth();
  const { leadsWithLatLng, addLead, updateLead, deleteLead } = useLeads();
  const { getStatusById, statuses, settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const userAccuracyRef = useRef<L.Circle | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [locationMode, setLocationMode] = useState<LocationMode>('off');
  const [isDroppingPin, setIsDroppingPin] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [localStatusFilter, setLocalStatusFilter] = useState<Set<string>>(statusFilter || new Set());
  const [mapTheme, setMapTheme] = useState<MapTheme>('dark');

  const mapThemeRef = useRef<MapTheme>('dark');
  const locationModeRef = useRef<LocationMode>('off');
  const headingRef = useRef<number>(0);

  // Keep refs in sync
  useEffect(() => { mapThemeRef.current = mapTheme; }, [mapTheme]);
  useEffect(() => { locationModeRef.current = locationMode; }, [locationMode]);

  // Load map theme from settings
  useEffect(() => {
    if (settings?.mapTheme) {
      setMapTheme(settings.mapTheme as MapTheme);
    }
  }, [settings?.mapTheme]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
          minZoom: MAP_MIN_ZOOM,
          maxZoom: MAP_MAX_ZOOM,
        }).setView([37.5, -77.6], 11);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const tileSets = createMapTileSets();
        applyMapTheme(map, tileSets, mapThemeRef.current);
        (map as MapWithTiles).tileSets = tileSets;

        // Marker cluster
        const markers = L.markerClusterGroup({
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            let size = 'small';
            if (count > 100) size = 'large';
            else if (count > 10) size = 'medium';

            return L.divIcon({
              html: `<div><span>${count}</span></div>`,
              className: `marker-cluster marker-cluster-${size}`,
              iconSize: L.point(40, 40),
            });
          },
        });
        markers.addTo(map);
        markersLayerRef.current = markers;

        mapInstanceRef.current = map;
      });
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current as MapWithTiles;
    if (!map.tileSets) return;

    applyMapTheme(map, map.tileSets, mapTheme);

    if (mapRef.current) {
      const container = mapRef.current.querySelector('.leaflet-container') as HTMLElement;
      if (container) {
        container.style.background = mapThemeBackground(mapTheme);
      }
    }
  }, [mapTheme]);

  // Long press gesture
  useEffect(() => {
    if (!mapInstanceRef.current || !mapRef.current) return;

    let pressStartTime = 0;
    let pressStartPos = { x: 0, y: 0 };
    let isLongPress = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      pressStartTime = Date.now();
      pressStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isLongPress = false;

      longPressTimeoutRef.current = window.setTimeout(() => {
        isLongPress = true;

        const map = mapInstanceRef.current;
        if (!map || !mapRef.current) return;

        const rect = mapRef.current.getBoundingClientRect();
        const point = map.containerPointToLatLng([
          pressStartPos.x - rect.left,
          pressStartPos.y - rect.top
        ]);

        // Vibrate
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        // Ripple animation
        const ripple = document.createElement('div');
        ripple.className = 'pin-drop-ripple';
        ripple.style.left = `${pressStartPos.x - 20}px`;
        ripple.style.top = `${pressStartPos.y - 20}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        dropPinAt(point.lat, point.lng);
      }, 600);
    };

    const handleTouchEnd = () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!longPressTimeoutRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - pressStartPos.x;
      const dy = touch.clientY - pressStartPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 10) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    };

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isLongPress) return;
      if (isDroppingPin) {
        dropPinAt(e.latlng.lat, e.latlng.lng);
        setIsDroppingPin(false);
      }
    };

    mapRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
    mapRef.current.addEventListener('touchend', handleTouchEnd, { passive: true });
    mapRef.current.addEventListener('touchmove', handleTouchMove, { passive: true });

    mapInstanceRef.current.on('click', handleMapClick);

    return () => {
      mapRef.current?.removeEventListener('touchstart', handleTouchStart);
      mapRef.current?.removeEventListener('touchend', handleTouchEnd);
      mapRef.current?.removeEventListener('touchmove', handleTouchMove);
      mapInstanceRef.current?.off('click', handleMapClick);
    };
  }, [isDroppingPin]);

  // Update markers when leads change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markers = markersLayerRef.current;
    markers.clearLayers();

    const filterToUse = localStatusFilter.size > 0 ? localStatusFilter : statusFilter;
    const filteredLeads = filterToUse && filterToUse.size > 0
      ? leadsWithLatLng.filter(lead => filterToUse.has(lead.status))
      : leadsWithLatLng;

    filteredLeads.forEach((lead) => {
      if (lead.lat === null || lead.lng === null) return;

      const status = getStatusById(lead.status);

      const iconHtml = getIconSvgHtml(status?.icon || 'dots', 'white', 14);
      const marker = L.marker([lead.lat, lead.lng], {
        icon: L.divIcon({
          html: `<div class="lead-pin" style="background-color: ${status?.color || '#6b7280'}">${iconHtml}</div>`,
          className: 'custom-led-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -32],
        }),
      });

      marker.on('click', () => {
        mapInstanceRef.current?.panTo([lead.lat!, lead.lng!], { animate: true, duration: 0.3 });
        setTimeout(() => {
          setSelectedLead(lead);
          setEditNotes(lead.notes || '');
          setEditStatus(lead.status);
        }, 350);
      });

      markers.addLayer(marker);
    });
  }, [leadsWithLatLng, localStatusFilter, statusFilter, getStatusById]);

  // User location tracking
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (locationMode === 'off') {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userAccuracyRef.current) {
        userAccuracyRef.current.remove();
        userAccuracyRef.current = null;
      }
      return;
    }

    const handlePosition = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, heading } = pos.coords;
      const map = mapInstanceRef.current;
      if (!map) return;

      // Create or update user marker
      if (!userMarkerRef.current) {
        // Blue dot
        userMarkerRef.current = L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 3,
          opacity: 1,
        }).addTo(map);

        // Accuracy circle
        userAccuracyRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          color: '#3b82f6',
          weight: 0,
        }).addTo(map);

        // First time - center on user
        if (locationModeRef.current !== 'off') {
          map.panTo([latitude, longitude], { animate: true, duration: 0.5 });
        }
      } else {
        userMarkerRef.current.setLatLng([latitude, longitude]);
        if (userAccuracyRef.current) {
          userAccuracyRef.current.setLatLng([latitude, longitude]);
          userAccuracyRef.current.setRadius(accuracy);
        }
      }

      // Heading tracking
      if (locationMode === 'heading' && heading !== null && !isNaN(heading)) {
        headingRef.current = heading;
        map.setView([latitude, longitude], map.getZoom(), {
          animate: false,
        });
        // @ts-expect-disable - rotate is a plugin method
        if (map.setBearing) {
          // @ts-expect-disable
          map.setBearing(-heading);
        }
      } else if (locationMode === 'following') {
        map.panTo([latitude, longitude], { animate: true, duration: 0.3 });
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      console.error('Geolocation error:', err.message);
      showToast('Location access denied', 'error');
      setLocationMode('off');
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [locationMode, showToast]);

  // Drop pin function
  const dropPinAt = useCallback(async (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    // Remove any existing temp marker
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }

    // Show temp marker
    const pinIconHtml = getIconSvgHtml('dots', 'white', 14);
    tempMarkerRef.current = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div class="lead-pin loading" style="background-color: #f89406">${pinIconHtml}</div>`,
        className: 'custom-led-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    }).addTo(mapInstanceRef.current);

    mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.3 });

    // Reverse geocode
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'YFM-Sales-App' } }
      );
      const data = await res.json();

      const address = data.address || {};
      const street = address.house_number
        ? `${address.house_number} ${address.road || ''}`
        : address.road || 'Unknown Address';
      const city = address.city || address.town || address.village || 'Unknown City';
      const state = address.state || 'VA';
      const zip = address.postcode || '';

      await addLead({
        rep: member?.name || 'Unassigned',
        street,
        city,
        state,
        zip,
        lat,
        lng,
        status: 'new',
        notes: '',
        import_id: null,
      });

      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
        tempMarkerRef.current = null;
      }

      showToast(`Added: ${street}`, 'success');
    } catch (err) {
      console.error('Geocode error:', err);
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
        tempMarkerRef.current = null;
      }
      showToast('Failed to add pin', 'error');
    }
  }, [addLead, member?.name, showToast]);

  // Location button click handler
  const handleLocationClick = () => {
    if (locationMode === 'off') {
      setLocationMode('following');
    } else if (locationMode === 'following') {
      setLocationMode('heading');
    } else {
      setLocationMode('off');
      // Reset north-up orientation
      if (mapInstanceRef.current) {
        // @ts-expect-disable
        if (mapInstanceRef.current.setBearing) {
          // @ts-expect-disable
          mapInstanceRef.current.setBearing(0);
        }
      }
    }
  };

  // Compass click - reset to north-up
  const handleCompassClick = () => {
    if (mapInstanceRef.current) {
      // @ts-expect-disable
      if (mapInstanceRef.current.setBearing) {
        // @ts-expect-disable
        mapInstanceRef.current.setBearing(0);
      }
      if (locationMode === 'heading') {
        setLocationMode('following');
      }
    }
  };

  // Status filter toggle
  const toggleStatusFilter = (statusId: string) => {
    const newFilter = new Set(localStatusFilter);
    if (newFilter.has(statusId)) {
      newFilter.delete(statusId);
    } else {
      newFilter.add(statusId);
    }
    setLocalStatusFilter(newFilter);
    onStatusFilterChange?.(newFilter);
  };

  // Save lead changes
  const handleSaveLead = async () => {
    if (!selectedLead) return;

    try {
      await updateLead(selectedLead.id, {
        status: editStatus,
        notes: editNotes,
      });
      setSelectedLead(null);
      showToast('Lead updated', 'success');
    } catch (err) {
      showToast('Failed to update', 'error');
    }
  };

  // Delete lead
  const handleDeleteLead = async () => {
    if (!selectedLead) return;

    try {
      await deleteLead(selectedLead.id);
      setSelectedLead(null);
      showToast('Lead deleted', 'success');
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const changeTheme = (theme: MapTheme) => {
    setMapTheme(theme);
    updateSettings({ mapTheme: theme }).catch(console.error);
  };

  const activeTheme = THEME_ITEMS.find((t) => t.id === mapTheme) ?? THEME_ITEMS[0];

  return (
    <div className={`relative w-full h-full map-theme-${mapTheme}`}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full map-container"
        style={{ touchAction: 'auto' }}
      />

      {/* Top Left Controls */}
      <div className="absolute top-2 left-2 flex flex-col gap-2 z-[1000]">
        {/* Location Button */}
        <button
          onClick={handleLocationClick}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors
                    ${locationMode !== 'off'
                      ? 'bg-accent-cyan text-white'
                      : 'bg-dark-card/95 text-white hover:bg-dark-hover'
                    }`}
          title={locationMode === 'off' ? 'Show location' : locationMode === 'following' ? 'Follow heading' : 'Turn off'}
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Compass Button */}
        <button
          onClick={handleCompassClick}
          className="w-10 h-10 bg-dark-card/95 rounded-xl flex items-center justify-center shadow-lg
                   text-white hover:bg-dark-hover transition-colors"
          title="Reset to North"
        >
          <Compass className="w-5 h-5" />
        </button>

        {/* Drop Pin Button */}
        <button
          onClick={() => setIsDroppingPin(!isDroppingPin)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors
                    ${isDroppingPin
                      ? 'bg-accent-cyan text-white'
                      : 'bg-dark-card/95 text-white hover:bg-dark-hover'
                    }`}
          title="Drop a pin"
        >
          <MapPin className="w-5 h-5" />
        </button>

        {/* Status Filter Button */}
        <button
          onClick={() => setShowStatusFilter(!showStatusFilter)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors
                    ${localStatusFilter.size > 0
                      ? 'bg-accent-cyan text-white'
                      : 'bg-dark-card/95 text-white hover:bg-dark-hover'
                    }`}
          title="Filter by status"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Top Right Controls - Theme */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 z-[1000]">
        <StaggeredDropdown
          label={activeTheme.label}
          triggerIcon={activeTheme.icon}
          align="right"
          activeId={mapTheme}
          items={THEME_ITEMS.map((t) => ({
            id: t.id,
            label: t.label,
            icon: t.icon,
            onSelect: () => changeTheme(t.id),
          }))}
        />
      </div>

      {/* Drop Pin Mode Indicator */}
      {isDroppingPin && (
        <div className="absolute top-2 left-14 right-14 z-[1000]">
          <div className="bg-accent-cyan/90 text-white rounded-xl px-3 py-2 text-sm font-medium text-center backdrop-blur-sm">
            Tap on the map to drop a pin
          </div>
        </div>
      )}

      {/* Status Filter Panel */}
      {showStatusFilter && (
        <div className="absolute top-16 left-2 bg-dark-card/95 backdrop-blur-md rounded-xl border border-dark-border p-3 z-[1000] min-w-[180px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Filter by Status</span>
            <button onClick={() => setShowStatusFilter(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {statuses.map((status) => (
              <button
                key={status.id}
                onClick={() => toggleStatusFilter(status.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                          ${localStatusFilter.has(status.id)
                            ? 'bg-accent-cyan/20 text-white'
                            : 'text-gray-300 hover:bg-dark-hover'
                          }`}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: status.color }}>
                  <StatusIconSvg iconKey={status.icon as IconKey} className="w-3 h-3 text-white" />
                </div>
                <span>{status.name}</span>
              </button>
            ))}
            {localStatusFilter.size > 0 && (
              <button
                onClick={() => {
                  setLocalStatusFilter(new Set());
                  onStatusFilterChange?.(new Set());
                }}
                className="w-full text-center text-xs text-gray-400 hover:text-white py-1"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lead Detail Popup */}
      {selectedLead && (
        <div className="absolute bottom-0 left-0 right-0 bg-dark-card/98 backdrop-blur-md rounded-t-2xl border-t border-dark-border z-[1000] max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-dark-border">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="font-semibold text-white truncate">{selectedLead.street}</h3>
              <p className="text-sm text-gray-400">{selectedLead.city}, {selectedLead.state}</p>
            </div>
            <button
              onClick={() => setSelectedLead(null)}
              className="p-2 hover:bg-dark-hover rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Status Selector */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setEditStatus(status.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
                              ${editStatus === status.id
                                ? 'bg-accent-cyan/20 border border-accent-cyan text-white'
                                : 'bg-dark-bg border border-dark-border text-gray-300 hover:border-gray-600'
                              }`}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: status.color }}>
                      <StatusIconSvg iconKey={status.icon as IconKey} className="w-3 h-3 text-white" />
                    </div>
                    <span>{status.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                placeholder="Add notes..."
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2
                         text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan
                         text-sm resize-none"
              />
            </div>

            {/* Rep */}
            <p className="text-xs text-gray-500">
              Rep: <span className="text-white">{selectedLead.rep || 'Unassigned'}</span>
            </p>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveLead}
                className="flex-1 bg-accent-cyan text-white font-semibold py-2.5 rounded-xl
                         hover:bg-accent-cyan/90 active:scale-[0.98] transition-all"
              >
                Save
              </button>
              <button
                onClick={handleDeleteLead}
                className="px-4 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
