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
        hint: 'The app could not connect to the database. Check your internet and try again.',
      };
    case 'config':
      return {
        title: 'App not configured',
        hint: 'Database settings are missing on this deployment. An admin needs to add Supabase env vars in Vercel.',
      };
    default:
      return {
        title: 'Sign in failed',
        hint: detail || 'Something went wrong. Try again in a moment.',
      };
  }
}

export function getLoginErrorFromSupabase(error: PostgrestError): LoginErrorInfo {
  if (error.code === 'PGRST116') {
    return getLoginErrorInfo('not_found');
  }

  if (error.code === '42P01') {
    return {
      title: 'Team table missing',
      hint: 'The database is not set up yet. Run Supabase migrations for this project.',
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
  return getLoginErrorInfo('unknown', error.message);
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
    return getLoginErrorInfo('unknown', err.message);
  }

  return getLoginErrorInfo('unknown');
}
