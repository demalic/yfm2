import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Lock, User, ArrowRight } from 'lucide-react';
import type { Member } from '../types';
import yfmLogo from '../assets/yfm-logo.jpg';

export function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !password.trim()) {
      showToast('Please enter your name and password', 'error');
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
        if (error.code === 'PGRST116') {
          showToast('Name not found', 'error');
        } else {
          console.error('Supabase error:', error);
          showToast('Could not reach database — check Supabase env vars on Vercel', 'error');
        }
        setIsLoading(false);
        return;
      }

      if (!data) {
        showToast('Name not found', 'error');
        setIsLoading(false);
        return;
      }

      const member = data as Member;

      if (member.password !== password) {
        showToast('Incorrect password', 'error');
        setIsLoading(false);
        return;
      }

      login(member);
    } catch (err) {
      console.error('Login error:', err);
      showToast('Login failed', 'error');
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
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full bg-[#111] border border-[#222] rounded-2xl pl-12 pr-4 py-4
                       text-white placeholder-gray-600 focus:outline-none focus:border-accent-cyan
                       text-base transition-colors"
            />
          </div>

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
