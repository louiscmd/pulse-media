'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'magic'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
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
          <p className="text-text-dim mt-1 text-[13.5px]">Sign in to your client portal</p>
        </div>

        {/* Card */}
        <div className="bg-panel border border-border-default rounded-[24px] p-8">
          {magicSent ? (
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

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'magic' : 'login'); setError(null) }}
                  className="text-purple text-[13px] hover:underline"
                >
                  {mode === 'login' ? 'Sign in with magic link instead' : 'Sign in with password'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-text-faint text-[12px] mt-6">
          Access is by invitation only — contact your Pulse Media account manager to get started.
        </p>
      </div>
    </div>
  )
}
