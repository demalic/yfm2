import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Member, SessionData } from '../types';

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

interface AuthContextType {
  member: Member | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (member: Member) => void;
  logout: () => void;
  saveSession: (member: Member) => void;
  checkPassword: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('yfm_session');
    if (session) {
      try {
        const data: SessionData = JSON.parse(session);
        const now = Date.now();
        if (now - data.timestamp < SESSION_TTL) {
          // Session still valid, refresh timestamp
          const updatedSession: SessionData = {
            ...data,
            timestamp: now,
          };
          localStorage.setItem('yfm_session', JSON.stringify(updatedSession));
          setMember({
            id: data.memberId,
            name: data.memberName,
            role: data.role,
            created_at: new Date().toISOString(),
          });
        } else {
          localStorage.removeItem('yfm_session');
        }
      } catch {
        localStorage.removeItem('yfm_session');
      }
    }
    setIsLoading(false);
  }, []);

  const saveSession = useCallback((member: Member) => {
    const session: SessionData = {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      timestamp: Date.now(),
    };
    localStorage.setItem('yfm_session', JSON.stringify(session));
  }, []);

  const login = useCallback((member: Member) => {
    setMember(member);
    saveSession(member);
  }, [saveSession]);

  const logout = useCallback(() => {
    setMember(null);
    localStorage.removeItem('yfm_session');
    localStorage.removeItem('yfm_leads_cache');
  }, []);

  const checkPassword = useCallback((password: string) => {
    return password === 'yfmusa';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        member,
        isAuthenticated: !!member,
        isLoading,
        login,
        logout,
        saveSession,
        checkPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
