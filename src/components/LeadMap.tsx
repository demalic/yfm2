import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import type { Lead } from '../types';

// Fix for default marker icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface LeadMapProps {
  onPinClick?: (lead: Lead) => void;
  statusFilter?: Set<string>;
  center?: { lat: number; lng: number };
}

export function LeadMap({ onPinClick, statusFilter, center }: LeadMapProps) {
  const { member } = useAuth();
  const { leads, leadsWithLatLng, addLead } = useLeads();
  const { getStatusById, statuses } = useSettings();
  const { showToast } = useToast();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  const [showSatellite, setShowSatellite] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isDroppingPin, setIsDroppingPin] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Wait for two paint cycles
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (mapInstanceRef.current) return;

        const map = L.map(mapRef.current!, {
          zoomControl: true,
          attributionControl: false,
        }).setView([37.5, -77.6], 11);

        // Add tile layer
        const cartoDB = L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          { maxZoom: 19 }
        );
        const esri = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        );

        cartoDB.addTo(map);

        // Store layers for toggling
        (map as L.Map & { cartoDB: L.TileLayer; esri: L.TileLayer }).cartoDB = cartoDB;
        (map as L.Map & { cartoDB: L.TileLayer; esri: L.TileLayer }).esri = esri;

        // Add marker cluster group
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

        // Set up long-press for dropping pins
        let pressStart = false;
        let rippleEl: HTMLDivElement | null = null;

        const handleTouchStart = (e: TouchEvent) => {
          if (e.touches.length !== 1) return;
          pressStart = true;

          const touch = e.touches[0];
          const point = map.containerPointToLatLng([touch.clientX - mapRef.current!.getBoundingClientRect().left,
                                                     touch.clientY - mapRef.current!.getBoundingClientRect().top]);

          longPressCenterRef.current = { lat: point.lat, lng: point.lng };

          // Create ripple
          rippleEl = document.createElement('div');
          rippleEl.className = 'pin-drop-ripple';
          rippleEl.style.left = `${touch.clientX - 20}px`;
          rippleEl.style.top = `${touch.clientY - 20}px`;
          document.body.appendChild(rippleEl);

          // Vibrate if supported
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }

          longPressTimeoutRef.current = window.setTimeout(() => {
            if (pressStart && longPressCenterRef.current) {
              dropPinAt(longPressCenterRef.current.lat, longPressCenterRef.current.lng);
            }
            pressStart = false;
            if (rippleEl) {
              rippleEl.remove();
              rippleEl = null;
            }
          }, 600);
        };

        const handleTouchEnd = () => {
          pressStart = false;
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
          if (rippleEl) {
            rippleEl.remove();
            rippleEl = null;
          }
        };

        const handleTouchMove = () => {
          // Cancel long-press if moving
          pressStart = false;
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
          if (rippleEl) {
            rippleEl.remove();
            rippleEl = null;
          }
        };

        mapRef.current?.addEventListener('touchstart', handleTouchStart, { passive: true });
        mapRef.current?.addEventListener('touchend', handleTouchEnd, { passive: true });
        mapRef.current?.addEventListener('touchmove', handleTouchMove, { passive: true });
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler for map clicks when in drop pin mode
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isDroppingPin) {
        dropPinAt(e.latlng.lat, e.latlng.lng);
        setIsDroppingPin(false);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDroppingPin]);

  // Update markers when leads change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markers = markersLayerRef.current;
    markers.clearLayers();

    const filteredLeads = statusFilter && statusFilter.size > 0
      ? leadsWithLatLng.filter(lead => statusFilter.has(lead.status))
      : leadsWithLatLng;

    filteredLeads.forEach((lead) => {
      if (lead.lat === null || lead.lng === null) return;

      const status = getStatusById(lead.status);
      const latitude = lead.lat;
      const longitude = lead.lng;

      const marker = L.marker([latitude, longitude], {
        icon: L.divIcon({
          html: `<div class="lead-marker" style="background-color: ${status.color}">${status.icon}</div>`,
          className: 'custom-led-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        }),
      });

      marker.on('click', () => {
        // Pan to center first
        mapInstanceRef.current?.panTo([latitude, longitude], { animate: true, duration: 0.3 });
        // Show popup after pan
        setTimeout(() => {
          setShowStatusPopup(lead);
          setNotes(lead.notes || '');
          setSelectedStatus(lead.status);
        }, 400);
      });

      markers.addLayer(marker);
    });
  }, [leadsWithLatLng, statusFilter, getStatusById]);

  // Toggle satellite view
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current as L.Map & { cartoDB: L.TileLayer; esri: L.TileLayer };

    if (showSatellite) {
      map.cartoDB.removeFrom(map);
      map.esri.addTo(map);
    } else {
      map.esri.removeFrom(map);
      map.cartoDB.addTo(map);
    }
  }, [showSatellite]);

  // User location
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    let watchId: number;

    const success = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: '#3b82f6',
          fillOpacity: 0.9,
          color: '#60a5fa',
          weight: 3,
          opacity: 0.8,
        }).addTo(mapInstanceRef.current!);

        // First fix - pan to location
        mapInstanceRef.current?.panTo([lat, lng], { animate: true, duration: 0.5 });
      } else {
        userMarkerRef.current.setLatLng([lat, lng]);
      }

      // Add pulsing effect
      const pulse = L.circleMarker([lat, lng], {
        radius: 16,
        fillColor: '#3b82f6',
        fillOpacity: 0.3,
        color: '#3b82f6',
        weight: 1,
        opacity: 0.5,
      }).addTo(mapInstanceRef.current!);

      setTimeout(() => pulse.remove(), 1000);
    };

    const error = (err: GeolocationPositionError) => {
      console.log('Geolocation error:', err.message);
    };

    watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, []);

  const dropPinAt = useCallback(async (lat: number, lng: number) => {
    // Show temp marker immediately
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
    }

    tempMarkerRef.current = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div class="lead-marker loading">📍</div>`,
        className: 'custom-led-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
    }).addTo(mapInstanceRef.current!);

    // Pan to new pin
    mapInstanceRef.current?.panTo([lat, lng], { animate: true, duration: 0.3 });

    // Reverse geocode
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();

      const address = data.address;
      const street = address.house_number
        ? `${address.house_number} ${address.road}`
        : address.road || 'Unknown Address';
      const city = address.city || address.town || address.village || 'Unknown City';
      const state = address.state || 'VA';
      const zip = address.postcode || '';

      // Save to Supabase
      const newLead = await addLead({
        rep: member?.name || 'Unknown',
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
      showToast('Failed to geocode location', 'error');
    }
  }, [addLead, member?.name, showToast]);

  const handleSaveStatus = async () => {
    if (!showStatusPopup) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: selectedStatus,
          notes,
        })
        .eq('id', showStatusPopup.id);

      if (error) throw error;

      // Update local leads
      showStatusPopup.status = selectedStatus;
      showStatusPopup.notes = notes;

      setShowStatusPopup(null);
      showToast('Lead updated', 'success');
    } catch (err) {
      console.error('Update error:', err);
      showToast('Failed to update lead', 'error');
    }
  };

  const handleDeletePin = async () => {
    if (!showStatusPopup) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', showStatusPopup.id);

      if (error) throw error;

      setShowStatusPopup(null);
      showToast('Pin deleted', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete pin', 'error');
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ touchAction: 'auto' }}
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setShowSatellite(!showSatellite)}
          className="bg-dark-card/90 backdrop-blur-sm border border-dark-border rounded-xl p-3
                   hover:bg-dark-hover transition-colors"
          title="Toggle satellite view"
        >
          {showSatellite ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 014 0 2 2 0 012-2v-1a2 2 0 012-2h-1.905M3.055 11A9.001 9.001 0 0111 3.055M3.055 11H19.945M11 3.055A9.001 9.001 0 0120.945 11H11m-8.945 0a9 9 0 0014.89 6.7" />
            </svg>
          )}
        </button>

        <button
          onClick={() => setIsDroppingPin(!isDroppingPin)}
          className={`bg-dark-card/90 backdrop-blur-sm border rounded-xl p-3
                    hover:bg-dark-hover transition-colors
                    ${isDroppingPin ? 'border-accent-cyan bg-accent-cyan/20' : 'border-dark-border'}`}
          title="Drop a pin"
        >
          <svg className={`w-5 h-5 ${isDroppingPin ? 'text-accent-cyan' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Drop Pin Mode Indicator */}
      {isDroppingPin && (
        <div className="absolute top-4 left-4 right-16">
          <div className="bg-accent-cyan/20 border border-accent-cyan rounded-xl px-4 py-2 text-sm text-white">
            Tap on the map to drop a pin
          </div>
        </div>
      )}

      {/* Lead Detail Popup */}
      {showStatusPopup && (
        <div className="absolute top-4 left-4 right-4 max-w-sm bg-dark-card/95 backdrop-blur-md border border-dark-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
            <h3 className="font-semibold text-white truncate pr-4">
              {showStatusPopup.street}
            </h3>
            <button
              onClick={() => setShowStatusPopup(null)}
              className="p-1 hover:bg-dark-hover rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-400">
              {showStatusPopup.city}, {showStatusPopup.state}
            </p>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {statuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setSelectedStatus(status.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                              ${selectedStatus === status.id
                                ? 'bg-accent-cyan/20 border border-accent-cyan text-white'
                                : 'bg-dark-bg border border-dark-border text-gray-300 hover:border-gray-600'
                              }`}
                  >
                    <span>{status.icon}</span>
                    <span>{status.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Add notes..."
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2
                         text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan
                         text-sm resize-none"
              />
            </div>

            <p className="text-xs text-gray-500">
              Rep: {showStatusPopup.rep || 'Unassigned'}
            </p>

            <button
              onClick={handleSaveStatus}
              className="w-full bg-accent-cyan text-dark-bg font-semibold py-2.5 rounded-xl
                       hover:bg-accent-cyan/90 active:scale-[0.98] transition-all"
            >
              Save
            </button>

            <div className="border-t border-dark-border pt-3">
              <button
                onClick={handleDeletePin}
                className="w-full text-red-400 hover:text-red-300 text-sm py-1
                         hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Delete pin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
