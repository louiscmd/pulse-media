'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'magic' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)
  const [signupDone, setSignupDone] = useState(false)
  // Tracks whether the error is specifically an unconfirmed-email case
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setNeedsConfirmation(false)
    setResendSent(false)
    setPassword('')
    setConfirmPassword('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNeedsConfirmation(false)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Supabase returns "Email not confirmed" when the account exists but
      // the confirmation link hasn't been clicked yet.
      const isUnconfirmed =
        error.message.toLowerCase().includes('email not confirmed') ||
        // @ts-ignore — newer Supabase SDK exposes error.code
        error.code === 'email_not_confirmed'

      if (isUnconfirmed) {
        setNeedsConfirmation(true)
        setError(null)
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleResendConfirmation() {
    setResendLoading(true)
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email })
    setResendLoading(false)
    setResendSent(true)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMagicSent(true)
    setLoading(false)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSignupDone(true)
    setLoading(false)
  }

  const subtitle =
    mode === 'signup'
      ? 'Create your client portal account'
      : 'Sign in to your client portal'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-12 h-12 rounded-pill flex items-center justify-center text-white font-bold text-xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #b47cff, #6f2dff)',
              boxShadow: '0 0 40px rgba(155,92,255,0.25)',
            }}
          >
            P
          </div>
          <h1 className="text-[26px] font-semibold text-text">Welcome to Pulse Media</h1>
          <p className="text-text-dim mt-1 text-[13.5px]">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-panel border border-border-default rounded-[24px] p-8">

          {/* ── Email not confirmed ── */}
          {needsConfirmation ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-amber text-xl">✉</span>
                </div>
                <h2 className="text-[17px] font-semibold text-text mb-2">Confirm your email first</h2>
                <p className="text-text-dim text-[13.5px] leading-relaxed">
                  Your account for <strong className="text-text">{email}</strong> was created but
                  the confirmation link hasn't been clicked yet. Check your inbox (and spam folder).
                </p>
              </div>

              {resendSent ? (
                <div className="flex items-center gap-2 justify-center text-green text-[13.5px]">
                  <span>✓</span>
                  <span>New confirmation email sent — check your inbox.</span>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleResendConfirmation}
                  loading={resendLoading}
                >
                  Resend confirmation email
                </Button>
              )}

              <div className="text-center space-y-2 pt-1">
                <p className="text-text-faint text-[12.5px]">
                  Already confirmed?{' '}
                  <button
                    onClick={() => { setNeedsConfirmation(false) }}
                    className="text-purple hover:underline"
                  >
                    Try signing in again
                  </button>
                </p>
                <p className="text-text-faint text-[12.5px]">
                  Wrong email?{' '}
                  <button
                    onClick={() => { setNeedsConfirmation(false); setEmail('') }}
                    className="text-purple hover:underline"
                  >
                    Use a different address
                  </button>
                </p>
              </div>
            </div>

          /* ── Magic link sent ── */
          ) : magicSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-green text-xl">✓</span>
              </div>
              <h2 className="text-[17px] font-semibold text-text mb-2">Check your email</h2>
              <p className="text-text-dim text-[13.5px]">
                We sent a sign-in link to <strong className="text-text">{email}</strong>
              </p>
              <button
                onClick={() => setMagicSent(false)}
                className="mt-4 text-purple text-[13px] hover:underline"
              >
                Use a different email
              </button>
            </div>

          /* ── Signup confirm ── */
          ) : signupDone ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-green text-xl">✓</span>
              </div>
              <h2 className="text-[17px] font-semibold text-text mb-2">One step left — confirm your email</h2>
              <p className="text-text-dim text-[13.5px] leading-relaxed">
                We sent a confirmation link to <strong className="text-text">{email}</strong>.{' '}
                Click it to activate your account, then come back here to sign in.
              </p>
              <p className="text-text-faint text-[12.5px] mt-3">
                Don't see it? Check your spam folder.
              </p>
              <button
                onClick={() => { setSignupDone(false); switchMode('login') }}
                className="mt-4 text-purple text-[13px] hover:underline"
              >
                Back to sign in
              </button>
            </div>

          /* ── Sign up form ── */
          ) : mode === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@brand.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                placeholder="min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              {error && (
                <p className="text-red text-[13px] bg-red/10 border border-red/20 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                Create account
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-purple text-[13px] hover:underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>

          /* ── Login / magic link forms ── */
          ) : (
            <form onSubmit={mode === 'login' ? handleLogin : handleMagicLink} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@brand.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              {mode === 'login' && (
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              )}

              {error && (
                <p className="text-red text-[13px] bg-red/10 border border-red/20 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                {mode === 'login' ? 'Sign in' : 'Send magic link'}
              </Button>

              <div className="pt-2 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'magic' : 'login'); setError(null) }}
                  className="text-purple text-[13px] hover:underline"
                >
                  {mode === 'login' ? 'Sign in with magic link instead' : 'Sign in with password'}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-text-dim text-[13px] hover:text-text transition-colors"
                >
                  Don&apos;t have an account?{' '}
                  <span className="text-purple hover:underline">Create one</span>
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-text-faint text-[12px] mt-6">
          {mode === 'signup'
            ? 'By creating an account you agree to our terms of service.'
            : 'Access is by invitation only — contact your Pulse Media account manager to get started.'}
        </p>
      </div>
    </div>
  )
}
