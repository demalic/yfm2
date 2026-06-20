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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <img
            src={yfmLogo}
            alt="YFM"
            className="w-56 h-56 mx-auto mb-4 object-contain"
            onError={(e) => {
              const el = e.currentTarget;
              el.style.display = 'none';
              const fallback = el.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div style={{ display: 'none' }}>
            <h1 className="text-6xl font-black text-white tracking-tight">YFM</h1>
          </div>
          <p className="text-gray-500 text-sm mt-2 tracking-widest uppercase">Field Sales Platform</p>
        </div>

        {/* Login Form */}
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
              className="w-full bg-[#111] border border-[#222] rounded-2xl pl-12 pr-4 py-4
                       text-white placeholder-gray-600 focus:outline-none focus:border-accent-cyan
                       text-base transition-colors"
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
              className="w-full bg-[#111] border border-[#222] rounded-2xl pl-12 pr-4 py-4
                       text-white placeholder-gray-600 focus:outline-none focus:border-accent-cyan
                       text-base transition-colors"
            />
          </div>

          {loginError && (
            <div
              role="alert"
              className="flex gap-3 rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold text-sm">{loginError.title}</p>
                <p className="text-red-300/80 text-xs mt-1 leading-relaxed">{loginError.hint}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent-cyan text-black font-bold py-4 rounded-2xl
                     hover:bg-accent-cyan/90 active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
