import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { Search, Download, MapPin, Building2, Wifi } from 'lucide-react';
import type { FCCLocation } from '../types';

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

export function FCCLeadLookup() {
  const { showToast } = useToast();

  const [searchType, setSearchType] = useState<'state' | 'city' | 'zip'>('city');
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [results, setResults] = useState<FCCLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from('fcc_locations')
        .select('*')
        .eq('technology', 'Fiber');

      if (searchType === 'state' && selectedState) {
        query = query.eq('state', selectedState);
      } else if (searchType === 'city' && city && selectedState) {
        query = query.eq('state', selectedState).ilike('city', `%${city}%`);
      } else if (searchType === 'zip' && zip) {
        query = query.eq('zip', zip);
      } else {
        showToast('Please fill in the search fields', 'error');
        setIsLoading(false);
        return;
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;
      setResults((data as FCCLocation[]) || []);
    } catch (err) {
      console.error('Search error:', err);
      showToast('Failed to search FCC data', 'error');
    }

    setIsLoading(false);
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;

    const headers = ['Street1', 'City', 'State', 'Postal Code', 'Latitude', 'Longitude'];
    const rows = results.map((r) => [
      r.street,
      r.city,
      r.state,
      r.zip,
      r.lat.toString(),
      r.lng.toString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fcc-fiber-${city || zip || selectedState}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`Downloaded ${results.length} addresses`, 'success');
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="page-header shrink-0">
        <h1 className="page-title">Find Leads</h1>
        <p className="page-subtitle">Search FCC fiber availability data</p>
      </div>

      {/* Search Form */}
      <div className="p-4 border-b border-dark-border">
        {/* Search Type Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchType('city')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors
                      ${searchType === 'city'
                        ? 'bg-accent-cyan/20 text-accent-cyan'
                        : 'bg-dark-card text-gray-400 hover:text-white'
                      }`}
          >
            City
          </button>
          <button
            onClick={() => setSearchType('zip')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors
                      ${searchType === 'zip'
                        ? 'bg-accent-cyan/20 text-accent-cyan'
                        : 'bg-dark-card text-gray-400 hover:text-white'
                      }`}
          >
            ZIP
          </button>
          <button
            onClick={() => setSearchType('state')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors
                      ${searchType === 'state'
                        ? 'bg-accent-cyan/20 text-accent-cyan'
                        : 'bg-dark-card text-gray-400 hover:text-white'
                      }`}
          >
            State
          </button>
        </div>

        {/* Search Fields */}
        <div className="space-y-3">
          {(searchType === 'city' || searchType === 'state') && (
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3
                       text-white focus:outline-none focus:border-accent-cyan"
            >
              <option value="">Select State</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {searchType === 'city' && (
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name"
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3
                       text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan"
            />
          )}

          {searchType === 'zip' && (
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="Enter ZIP code"
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3
                       text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan"
            />
          )}

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full bg-accent-cyan text-dark-bg font-semibold py-3 rounded-xl
                     hover:bg-accent-cyan/90 active:scale-[0.98] transition-all
                     flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Search FCC Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {hasSearched && results.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No fiber addresses found</p>
            <p className="text-sm mt-1">Try a different search</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            {/* Results Header */}
            <div className="px-4 py-3 flex items-center justify-between bg-dark-card/50">
              <p className="font-medium text-white">
                {results.length.toLocaleString()} fiber addresses found
              </p>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400
                         rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-card text-gray-400 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Address</th>
                    <th className="px-4 py-2 font-medium">City</th>
                    <th className="px-4 py-2 font-medium hidden md:table-cell">ISP</th>
                    <th className="px-4 py-2 font-medium text-right">Speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {results.slice(0, 100).map((location) => (
                    <tr key={location.id} className="hover:bg-dark-hover">
                      <td className="px-4 py-3">
                        <p className="text-white">{location.street}</p>
                        <p className="text-gray-500 text-xs">{location.state} {location.zip}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{location.city}</td>
                      <td className="px-4 py-3 text-gray-300 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          {location.isp_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 text-green-400">
                          <Wifi className="w-4 h-4" />
                          {location.max_download_mbps} Mbps
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {results.length > 100 && (
              <p className="text-center text-gray-500 text-sm py-4">
                Showing first 100 of {results.length.toLocaleString()} results
              </p>
            )}

            {/* Data Attribution */}
            <div className="px-4 py-4 border-t border-dark-border">
              <p className="text-xs text-gray-600 text-center">
                Data sourced from FCC Broadband Data Collection. Updated every 6 months.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
