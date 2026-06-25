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
import { Lock, User, ArrowRight } from 'lucide-react';
import type { Member } from '../types';
import { YfmLogoLogin, YfmLogoTagline } from './YfmLogo';
import { OpeningBackdrop } from './OpeningBackdrop';
import { Button, Input, Alert, Card } from './ui';

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
    <div className="min-h-screen auth-screen login-screen relative flex flex-col items-center justify-center py-6 px-6 overflow-hidden">
      <OpeningBackdrop />

      {isLoading && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-sm font-semibold text-white tracking-wide">Signing in…</p>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-7">
          <YfmLogoLogin />
        </div>

        <Card variant="glass" padding="lg" className="rounded-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-extrabold text-white">Sign in</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Enter your team credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearLoginError();
              }}
              placeholder="Your name"
              autoComplete="name"
              icon={<User className="w-5 h-5" />}
            />

            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearLoginError();
              }}
              placeholder="Password"
              autoComplete="current-password"
              icon={<Lock className="w-5 h-5" />}
            />

            {loginError && (
              <Alert
                variant="error"
                title={loginError.title}
                description={loginError.hint}
              />
            )}

            <Button type="submit" fullWidth size="lg" loading={isLoading}>
              {!isLoading && (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </Card>

        <YfmLogoTagline className="mt-6 sm:mt-7" />
      </div>
    </div>
  );
}
