import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { Upload, FileText, Trash2, Download, AlertCircle } from 'lucide-react';
import type { ImportBatch, Lead } from '../types';

interface ParsedCSV {
  addresses: Array<{
    street: string;
    lat: number;
    lng: number;
    city: string;
    state: string;
    zip: string;
    status: string;
    isExistingCustomer: boolean;
  }>;
  errors: string[];
}

export function Import() {
  const { member } = useAuth();
  const { importBatches, loadImportBatches, loadLeads } = useLeads();
  const { statuses } = useSettings();
  const { showToast } = useToast();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('new');
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [progress, setProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      showToast('Please upload a CSV file', 'error');
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      const result = await parseCSV(text);
      setParsedData(result);
      setShowStatusPicker(true);
    } catch (err) {
      console.error('Parse error:', err);
      showToast('Failed to parse CSV', 'error');
    }

    setIsUploading(false);
  };

  const parseCSV = async (text: string): Promise<ParsedCSV> => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      return { addresses: [], errors: ['File is empty or missing headers'] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const addresses: ParsedCSV['addresses'] = [];
    const errors: string[] = [];

    // Detect format
    const isYFMFormat = headers.includes('street1');
    const isOpenAddrFormat = headers.includes('number') && headers.includes('street');

    for (let i = 1; i < lines.length && i < 1000; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      let address: {
        street: string;
        lat: number;
        lng: number;
        city: string;
        state: string;
        zip: string;
        status: string;
        isExistingCustomer: boolean;
      } | null = null;

      try {
        if (isYFMFormat) {
          const streetIndex = headers.indexOf('street1');
          const cityIndex = headers.indexOf('city');
          const stateIndex = headers.indexOf('state');
          const zipIndex = headers.indexOf('postal code');
          const latIndex = headers.indexOf('latitude');
          const lngIndex = headers.indexOf('longitude');
          const resultIndex = headers.indexOf('result');

          address = {
            street: values[streetIndex] || '',
            city: values[cityIndex] || '',
            state: values[stateIndex] || '',
            zip: values[zipIndex] || '',
            lat: parseFloat(values[latIndex]) || 0,
            lng: parseFloat(values[lngIndex]) || 0,
            status: selectedStatus,
            isExistingCustomer:
              resultIndex >= 0 && values[resultIndex]?.toLowerCase() === 'existing_customer',
          };
        } else if (isOpenAddrFormat) {
          const numberIndex = headers.indexOf('number');
          const streetIndex = headers.indexOf('street');
          const cityIndex = headers.indexOf('city');
          const stateIndex = headers.indexOf('region');
          const zipIndex = headers.indexOf('postcode');
          const latIndex = headers.indexOf('lat');
          const lngIndex = headers.indexOf('lon');

          address = {
            street: `${values[numberIndex]} ${values[streetIndex]}`,
            city: values[cityIndex] || '',
            state: values[stateIndex] || '',
            zip: values[zipIndex] || '',
            lat: parseFloat(values[latIndex]) || 0,
            lng: parseFloat(values[lngIndex]) || 0,
            status: selectedStatus,
            isExistingCustomer: false,
          };
        } else {
          errors.push(`Line ${i + 1}: Unknown CSV format`);
          continue;
        }

        if (address.street && address.lat && address.lng) {
          addresses.push(address);
        } else {
          errors.push(`Line ${i + 1}: Missing required fields`);
        }
      } catch {
        errors.push(`Line ${i + 1}: Failed to parse`);
      }
    }

    return { addresses, errors };
  };

  const handleImport = async () => {
    if (!parsedData || !member) return;

    setIsUploading(true);
    setProgress(0);

    try {
      // Create import batch
      const { data: importData, error: importError } = await supabase
        .from('imports')
        .insert({
          name: `Import ${new Date().toLocaleDateString()}`,
          rep: member.name,
        })
        .select()
        .single();

      if (importError) throw importError;

      const importId = (importData as ImportBatch).id;

      // Check for duplicates
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('street, city');

      const existingSet = new Set(
        (existingLeads || []).map((l: { street: string; city: string }) =>
          `${l.street.toLowerCase()}-${l.city.toLowerCase()}`
        )
      );

      const newLeads = parsedData.addresses.filter(
        (a) => !existingSet.has(`${a.street.toLowerCase()}-${a.city.toLowerCase()}`)
      );

      const skipped = parsedData.addresses.length - newLeads.length;

      // Insert leads in batches
      const batchSize = 100;
      for (let i = 0; i < newLeads.length; i += batchSize) {
        const batch = newLeads.slice(i, i + batchSize);

        await supabase.from('leads').insert(
          batch.map((a) => ({
            rep: member.name,
            street: a.street,
            city: a.city,
            state: a.state,
            zip: a.zip,
            lat: a.lat,
            lng: a.lng,
            status: a.isExistingCustomer ? 'existing_customer' : a.status,
            notes: null,
            import_id: importId,
          }))
        );

        setProgress(Math.round(((i + batchSize) / newLeads.length) * 100));
      }

      showToast(
        `Imported ${newLeads.length} leads${skipped > 0 ? `, ${skipped} duplicates skipped` : ''}`,
        'success'
      );

      loadImportBatches();
      loadLeads();
      setParsedData(null);
      setShowStatusPicker(false);
    } catch (err) {
      console.error('Import error:', err);
      showToast('Failed to import leads', 'error');
    }

    setIsUploading(false);
    setProgress(0);
  };

  const deleteImportBatch = async (batch: ImportBatch) => {
    if (!confirm(`Delete "${batch.name}"? All ${batch.rep} leads from this import will be removed.`))
      return;

    try {
      // Delete leads from this import
      await supabase.from('leads').delete().eq('import_id', batch.id);

      // Delete the import record
      await supabase.from('imports').delete().eq('id', batch.id);

      loadImportBatches();
      loadLeads();
      showToast('Import batch deleted', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete import batch', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="px-4 py-4 border-b border-dark-border">
        <h1 className="text-xl font-bold text-white">Imports</h1>
      </div>

      {/* Upload Area */}
      <div className="p-4">
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer
                    ${isDragging ? 'border-accent-cyan bg-accent-cyan/10' : 'border-dark-border hover:border-gray-600'}
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-3">Processing...</p>
              {progress > 0 && (
                <p className="text-sm text-gray-500 mt-1">{progress}%</p>
              )}
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">
                Drop CSV file here or click to upload
              </p>
              <p className="text-sm text-gray-500">
                Supports YFM or OpenAddresses format
              </p>
            </>
          )}
        </div>
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Import History */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Import History</h2>

          {importBatches.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No imports yet</p>
          ) : (
            <div className="space-y-2">
              {importBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-dark-card rounded-xl p-4 border border-dark-border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{batch.name}</p>
                      <p className="text-sm text-gray-500">
                        {batch.rep} • {new Date(batch.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteImportBatch(batch)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Picker Modal */}
      {showStatusPicker && parsedData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-dark-card rounded-t-3xl border-t border-dark-border bottom-sheet">
            <div className="px-4 py-4 border-b border-dark-border">
              <h3 className="font-semibold text-white">Import Status</h3>
              <p className="text-sm text-gray-400 mt-1">
                {parsedData.addresses.length} addresses found
              </p>
            </div>

            <div className="p-4">
              <p className="text-xs text-gray-500 mb-2">Set initial status</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
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

              {parsedData.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {parsedData.errors.length} parse errors
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowStatusPicker(false);
                    setParsedData(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-dark-border text-gray-400
                             hover:bg-dark-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 bg-accent-cyan text-dark-bg font-semibold py-2.5 rounded-xl
                           hover:bg-accent-cyan/90 active:scale-[0.98] transition-all"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
