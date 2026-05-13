'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/home')
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'hsl(220 15% 8%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorativo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(43 72% 58% / 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '-200px',
        right: '-200px',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'hsl(43 72% 58% / 0.04)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'hsl(43 72% 58% / 0.03)',
        pointerEvents: 'none',
      }} />

      {/* Card de login */}
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '0 1.5rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="card-base" style={{ padding: '2.5rem', borderColor: 'hsl(43 30% 25%)' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'hsl(43 30% 15%)',
              border: '1px solid hsl(43 60% 42%)',
              marginBottom: '1.25rem',
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L16 28M10 8L16 4L22 8M10 24L16 28L22 24M6 12H10M22 12H26M6 20H10M22 20H26" stroke="hsl(43 72% 58%)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="3" stroke="hsl(43 72% 58%)" strokeWidth="1.5"/>
              </svg>
            </div>
            <h1 className="font-display" style={{
              fontSize: '1.75rem',
              fontWeight: '600',
              color: 'hsl(45 20% 92%)',
              letterSpacing: '0.02em',
              marginBottom: '0.25rem',
            }}>
              Franco & Vieira
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'hsl(45 8% 40%)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Advogados & Associados
            </p>
            <div style={{
              width: '40px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, hsl(43 72% 58%), transparent)',
              margin: '1rem auto 0',
            }} />
          </div>

          <p style={{ textAlign: 'center', color: 'hsl(45 10% 60%)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            Acesse o sistema de gestão financeira
          </p>

          {/* Formulário */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 10% 60%)', marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(45 8% 40%)' }} />
                <input
                  className="input-base"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 10% 60%)', marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(45 8% 40%)' }} />
                <input
                  className="input-base"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(45 8% 40%)', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'hsl(0 72% 51% / 0.1)',
                border: '1px solid hsl(0 72% 51% / 0.3)',
                borderRadius: 'var(--radius)',
                padding: '0.6rem 0.875rem',
                fontSize: '0.8rem',
                color: 'hsl(0 72% 65%)',
              }}>
                {error}
              </div>
            )}

            <button
              className="btn-gold"
              type="submit"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.875rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid hsl(var(--border))',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'hsl(45 8% 35%)',
          }}>
            Sistema de uso interno exclusivo
          </div>
        </div>
      </div>
    </div>
  )
}
