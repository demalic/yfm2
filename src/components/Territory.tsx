import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import { Users, Check, X } from 'lucide-react';
import type { Member, Lead } from '../types';

export function Territory() {
  const { member } = useAuth();
  const { leads, leadsWithLatLng, bulkAssign } = useLeads();
  const { getStatusById } = useSettings();
  const { showToast } = useToast();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnPolygonRef = useRef<L.Polygon | null>(null);
  const markersInPolygonRef = useRef<L.Marker[]>([]);
  const drawPointsRef = useRef<L.LatLng[]>([]);

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedRep, setSelectedRep] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [polygonPoints, setPolygonPoints] = useState<L.LatLng[]>([]);

  useEffect(() => {
    async function loadMembers() {
      const { data } = await supabase.from('members').select('*').order('name');
      if (data) setMembers(data as Member[]);
    }
    loadMembers();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const map = L.map(mapRef.current!, {
          zoomControl: true,
        }).setView([37.5, -77.6], 11);

        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          { maxZoom: 19 }
        ).addTo(map);

        // Add markers for all leads
        const markers = L.markerClusterGroup();
        leadsWithLatLng.forEach((lead) => {
          if (lead.lat === null || lead.lng === null) return;
          const status = getStatusById(lead.status);

          const marker = L.marker([lead.lat, lead.lng], {
            icon: L.divIcon({
              html: `<div class="lead-marker" style="background-color: ${status.color}">${status.icon}</div>`,
              className: 'custom-led-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            }),
            data: lead,
          });

          markers.addLayer(marker);
        });

        markers.addTo(map);
        mapInstanceRef.current = map;
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when leads change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Find and remove old marker layer
    map.eachLayer((layer) => {
      if ((layer as L.MarkerClusterGroup).getChildCount) {
        map.removeLayer(layer);
      }
    });

    // Add new markers
    const markers = L.markerClusterGroup();
    leadsWithLatLng.forEach((lead) => {
      if (lead.lat === null || lead.lng === null) return;
      const status = getStatusById(lead.status);

      const isSelected = selectedLeads.some((l) => l.id === lead.id);

      const marker = L.marker([lead.lat, lead.lng], {
        icon: L.divIcon({
          html: `<div class="lead-marker ${isSelected ? 'selected' : ''}" style="background-color: ${isSelected ? '#06b6d4' : status.color}">${isSelected ? '✓' : status.icon}</div>`,
          className: 'custom-led-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
        data: lead,
      });

      markers.addLayer(marker);
    });

    markers.addTo(map);
  }, [leadsWithLatLng, selectedLeads, getStatusById]);

  // Drawing mode click handler
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return;

      const point = e.latlng;
      drawPointsRef.current = [...drawPointsRef.current, point];
      setPolygonPoints([...drawPointsRef.current]);

      // Update or create polygon
      if (drawnPolygonRef.current) {
        drawnPolygonRef.current.setLatLngs(drawPointsRef.current);
      } else {
        drawnPolygonRef.current = L.polygon(drawPointsRef.current, {
          color: '#06b6d4',
          fillColor: '#06b6d4',
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(map);
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [isDrawing]);

  const pointsInPolygon = useMemo(() => {
    if (polygonPoints.length < 3) return [];

    const polygon = L.polygon(polygonPoints);

    return leadsWithLatLng.filter((lead) => {
      if (lead.lat === null || lead.lng === null) return false;
      const point = L.latLng(lead.lat, lead.lng);
      return polygon.getBounds().contains(point);
    });
  }, [polygonPoints, leadsWithLatLng]);

  const handleStartDrawing = () => {
    setIsDrawing(true);
    // Clear previous
    if (drawnPolygonRef.current) {
      mapInstanceRef.current?.removeLayer(drawnPolygonRef.current);
      drawnPolygonRef.current = null;
    }
    drawPointsRef.current = [];
    setPolygonPoints([]);
    setSelectedLeads([]);
  };

  const handleFinishDrawing = () => {
    setIsDrawing(false);
    setSelectedLeads([...pointsInPolygon]);
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    if (drawnPolygonRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(drawnPolygonRef.current);
      drawnPolygonRef.current = null;
    }
    drawPointsRef.current = [];
    setPolygonPoints([]);
  };

  const handleAssign = async () => {
    if (!selectedRep) {
      showToast('Please select a rep', 'error');
      return;
    }

    // Find the member by ID to get their name
    const repMember = members.find((m) => m.id === selectedRep);
    const repName = repMember?.name || selectedRep;

    try {
      await bulkAssign(
        selectedLeads.map((l) => l.id),
        repName
      );
      showToast(`Assigned ${selectedLeads.length} leads to ${repName}`, 'success');
      setSelectedLeads([]);
      if (drawnPolygonRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(drawnPolygonRef.current);
        drawnPolygonRef.current = null;
      }
      drawPointsRef.current = [];
      setPolygonPoints([]);
      setSelectedRep('');
    } catch (err) {
      showToast('Failed to assign leads', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="px-4 py-4 border-b border-dark-border">
        <h1 className="text-xl font-bold text-white mb-3">Territory</h1>

        {/* Controls */}
        <div className="flex gap-2">
          {!isDrawing ? (
            <button
              onClick={handleStartDrawing}
              className="flex-1 bg-accent-cyan/20 text-accent-cyan font-medium py-2 rounded-xl
                       hover:bg-accent-cyan/30 active:scale-[0.98] transition-all"
            >
              Draw Territory
            </button>
          ) : (
            <>
              <button
                onClick={handleFinishDrawing}
                disabled={polygonPoints.length < 3}
                className="flex-1 bg-green-500/20 text-green-400 font-medium py-2 rounded-xl
                         hover:bg-green-500/30 active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Finish ({polygonPoints.length} points)
              </button>
              <button
                onClick={handleCancelDrawing}
                className="bg-red-500/20 text-red-400 px-4 py-2 rounded-xl
                         hover:bg-red-500/30 active:scale-[0.98] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" style={{ touchAction: 'auto' }} />

        {/* Selection Info Overlay */}
        {selectedLeads.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 glass">
            <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-medium">
                  {selectedLeads.length} leads selected
                </p>
                <button
                  onClick={() => setSelectedLeads([])}
                  className="text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedRep}
                  onChange={(e) => setSelectedRep(e.target.value)}
                  className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3 py-2
                           text-white focus:outline-none focus:border-accent-cyan"
                >
                  <option value="">Select Rep</option>
                  {members
                    .filter((m) => m.role !== 'admin')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>

                <button
                  onClick={handleAssign}
                  disabled={!selectedRep}
                  className="bg-accent-cyan text-dark-bg font-semibold px-4 py-2 rounded-xl
                           hover:bg-accent-cyan/90 active:scale-[0.98] transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drawing Instructions */}
        {isDrawing && (
          <div className="absolute top-4 left-4 right-4 pointer-events-none">
            <div className="bg-accent-cyan/20 border border-accent-cyan rounded-xl px-4 py-2 text-sm text-white max-w-sm">
              Click on the map to add points. Minimum 3 points needed.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
