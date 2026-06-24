import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getLoginErrorFromException,
  getLoginErrorFromSupabase,
  getLoginErrorInfo,
  type LoginErrorInfo,
} from '../lib/loginErrors';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import type { Member } from '../types';
import yfmLogo from '../assets/yfm-logo.jpg';

export function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<LoginErrorInfo | null>(null);
  const { login } = useAuth();
  const { showToast } = useToast();

  const showLoginError = (info: LoginErrorInfo) => {
    setLoginError(info);
    showToast(info.title, 'error');
  };

  const clearLoginError = () => {
    if (loginError) setLoginError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!name.trim() || !password.trim()) {
      showLoginError(getLoginErrorInfo('empty'));
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('team')
        .select('*')
        .ilike('name', name.trim())
        .single();

      if (error) {
        showLoginError(getLoginErrorFromSupabase(error));
        setIsLoading(false);
        return;
      }

      if (!data) {
        showLoginError(getLoginErrorInfo('not_found'));
        setIsLoading(false);
        return;
      }

      const member = data as Member;

      if (member.password !== password) {
        showLoginError(getLoginErrorInfo('wrong_password'));
        setIsLoading(false);
        return;
      }

      setLoginError(null);
      login(member);
      showToast(`Welcome back, ${member.name}`, 'success');
    } catch (err) {
      showLoginError(getLoginErrorFromException(err));
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen login-screen relative flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="login-grid absolute inset-0 pointer-events-none" aria-hidden />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={yfmLogo}
            alt="YFM"
            className="w-44 h-44 sm:w-52 sm:h-52 mx-auto object-contain logo-glow"
          />
          <p className="text-gray-500 text-xs mt-4 tracking-[0.25em] uppercase font-medium">
            Field Sales Platform
          </p>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-white">Sign in</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your team credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearLoginError();
                }}
                placeholder="Your name"
                autoComplete="name"
                className="input-yfm"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearLoginError();
                }}
                placeholder="Password"
                autoComplete="current-password"
                className="input-yfm"
              />
            </div>

            {loginError && (
              <div
                role="alert"
                className="flex gap-3 rounded-2xl bg-red-500/10 border border-red-500/25 px-4 py-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-semibold text-sm">{loginError.title}</p>
                  <p className="text-red-300/75 text-xs mt-1 leading-relaxed">{loginError.hint}</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary flex items-center justify-center gap-2">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Your Future Matters
        </p>
      </div>
    </div>
  );
}
