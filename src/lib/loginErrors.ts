import type { PostgrestError } from '@supabase/supabase-js';

export interface LoginErrorInfo {
  title: string;
  hint: string;
}

export function getLoginErrorInfo(
  reason: 'empty' | 'not_found' | 'wrong_password' | 'network' | 'config' | 'unknown',
  detail?: string
): LoginErrorInfo {
  switch (reason) {
    case 'empty':
      return {
        title: 'Missing info',
        hint: 'Enter both your name and password.',
      };
    case 'not_found':
      return {
        title: 'Name not found',
        hint: 'That name is not on the team list. Check spelling or ask your admin to add you.',
      };
    case 'wrong_password':
      return {
        title: 'Wrong password',
        hint: 'The password does not match this account. Try again or ask your admin.',
      };
    case 'network':
      return {
        title: 'Cannot reach server',
        hint: 'Supabase may be paused or offline. Open supabase.com → your project → Restore project if prompted, then try again.',
      };
    case 'config':
      return {
        title: 'App not configured',
        hint: 'Database settings are missing on this deployment. An admin needs to add Supabase env vars in Vercel.',
      };
    default:
      return {
        title: 'Sign in failed',
        hint: 'Something went wrong. Try again in a moment.',
      };
  }
}

export function getLoginErrorFromSupabase(error: PostgrestError): LoginErrorInfo {
  if (error.code === 'PGRST116') {
    return getLoginErrorInfo('not_found');
  }

  if (isMissingTableError(error)) {
    return {
      title: 'Database not set up',
      hint: 'The team table is missing in Supabase. Run the project migrations in the Supabase SQL editor, then try again.',
    };
  }

  if (error.code === '42P01') {
    return {
      title: 'Database not set up',
      hint: 'Required tables are missing. Run the Supabase migrations for this project.',
    };
  }

  if (error.message?.toLowerCase().includes('fetch')) {
    return getLoginErrorInfo('network');
  }

  if (error.code === '42501' || error.message?.toLowerCase().includes('permission')) {
    return {
      title: 'Access blocked',
      hint: 'The database rejected this request. Check Supabase row-level security policies.',
    };
  }

  console.error('Supabase login error:', error);
  return getLoginErrorInfo('unknown');
}

function isMissingTableError(error: PostgrestError): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'PGRST205' ||
    message.includes('schema cache') ||
    message.includes('could not find the table')
  );
}

export function getLoginErrorFromException(err: unknown): LoginErrorInfo {
  if (err instanceof TypeError && String(err.message).toLowerCase().includes('fetch')) {
    return getLoginErrorInfo('network');
  }

  if (err instanceof Error) {
    if (err.message.includes('Missing Supabase')) {
      return getLoginErrorInfo('config');
    }
    console.error('Login exception:', err);
    return getLoginErrorInfo('unknown');
  }

  return getLoginErrorInfo('unknown');
}
