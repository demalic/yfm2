export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return false;
  if (url.includes('your-project') || key === 'your-anon-key') return false;

  return true;
}

/** Use in-browser mock DB when Supabase env is missing or VITE_DEV_MODE=true */
export function isLocalDevMode(): boolean {
  if (import.meta.env.VITE_DEV_MODE === 'true') return true;
  return !isSupabaseConfigured();
}

export const usingDevBackend = isLocalDevMode();

export function getSupabaseConfigHint(): string {
  if (usingDevBackend) {
    return 'Running in local dev mode with sample data. Add Supabase credentials to .env.local for production data.';
  }
  return '';
}
