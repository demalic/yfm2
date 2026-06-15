import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { MapPin, User, Lock, ArrowRight } from 'lucide-react';
import type { Member } from '../types';

export function Login() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordScreen, setShowPasswordScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { login } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    async function loadMembers() {
      try {
        const { data, error } = await supabase
          .from('team')
          .select('*')
          .order('name');

        if (!error && data) {
          setMembers(data as Member[]);
        }
      } catch (err) {
        console.error('Failed to load members:', err);
        showToast('Failed to load team members', 'error');
      }
      setIsLoading(false);
    }

    loadMembers();
  }, [showToast]);

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    if (member.role === 'admin') {
      setShowPasswordScreen(true);
    } else {
      login(member);
    }
  };

  const handleSubmitPassword = () => {
    if (!selectedMember) return;

    if (password === 'yfmusa') {
      login(selectedMember);
      setShowPasswordScreen(false);
      setPassword('');
    } else {
      showToast('Incorrect password', 'error');
      // Recover pending member if lost
      setPassword('');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '🔴';
      case 'manager':
        return '🔵';
      default:
        return '🟢';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-pulse text-accent-cyan text-lg">Loading...</div>
      </div>
    );
  }

  if (showPasswordScreen && selectedMember) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <button
            onClick={() => {
              setShowPasswordScreen(false);
              setSelectedMember(null);
            }}
            className="text-sm text-gray-400 mb-4 hover:text-white transition-colors"
          >
            ← Back to team selection
          </button>

          <div className="bg-dark-card rounded-2xl p-6 border border-dark-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-accent-cyan" />
              </div>
              <div>
                <h2 className="text-white font-semibold">
                  {selectedMember.name}
                </h2>
                <p className="text-sm text-gray-400">Admin password required</p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitPassword();
                }}
                placeholder="Enter admin password"
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3
                         text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan
                         text-base"
                autoComplete="off"
              />

              <button
                onClick={handleSubmitPassword}
                className="w-full bg-accent-cyan text-dark-bg font-semibold py-3 rounded-xl
                         hover:bg-accent-cyan/90 active:scale-[0.98] transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-cyan/20 mb-4">
            <MapPin className="w-8 h-8 text-accent-cyan" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">YFM</h1>
          <p className="text-gray-400">Field Sales Platform</p>
        </div>

        {/* Member Selection */}
        <div className="bg-dark-card rounded-2xl border border-dark-border overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-border">
            <p className="text-sm text-gray-400">Select your name</p>
          </div>

          <div className="divide-y divide-dark-border">
            {members.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No team members found. Contact your admin.
              </div>
            ) : (
              members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className="w-full flex items-center gap-3 px-4 py-3
                           hover:bg-dark-hover active:bg-dark-hover/50 transition-colors"
                >
                  <span className="text-lg">{getRoleIcon(member.role)}</span>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {member.role}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Tap your name to login
        </p>
      </div>
    </div>
  );
}
