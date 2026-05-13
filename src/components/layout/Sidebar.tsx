'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, FolderOpen, FileText,
  ArrowDownUp, UserCog, LogOut, Bell, ChevronRight,
  Scale
} from 'lucide-react'
import type { Profile } from '@/types'

interface SidebarProps {
  profile: Profile
  alertasCount?: number
}

const navAdmin = [
  { href: '/home', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/processos', label: 'Processos', icon: FolderOpen },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/lancamentos', label: 'Lançamentos', icon: ArrowDownUp },
  { href: '/usuarios', label: 'Usuários', icon: UserCog },
]

const navAdvogado = [
  { href: '/home', label: 'Meu Painel', icon: LayoutDashboard },
]

export default function Sidebar({ profile, alertasCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const nav = profile.role === 'admin' ? navAdmin : navAdvogado

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'hsl(220 15% 7%)',
      borderRight: '1px solid hsl(220 10% 15%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.5rem 1.25rem 1.25rem',
        borderBottom: '1px solid hsl(220 10% 15%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'hsl(43 30% 15%)',
            border: '1px solid hsl(43 60% 42%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Scale size={18} color="hsl(43 72% 58%)" />
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'hsl(45 20% 92%)', lineHeight: 1.2 }}>
              Franco & Vieira
            </div>
            <div style={{ fontSize: '0.65rem', color: 'hsl(45 8% 40%)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Advogados & Assoc.
            </div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'hsl(45 8% 35%)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          {profile.role === 'admin' ? 'Administração' : 'Meu Painel'}
        </div>

        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={active ? 'sidebar-active' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                textDecoration: 'none',
                color: active ? undefined : 'hsl(45 10% 55%)',
                transition: 'all 0.15s',
                borderLeft: active ? undefined : '2px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.color = 'hsl(45 20% 80%)'
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.color = 'hsl(45 10% 55%)'
              }}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={12} style={{ opacity: 0.6 }} />}
            </Link>
          )
        })}

        {/* Alertas — só admin */}
        {profile.role === 'admin' && alertasCount > 0 && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.6rem 0.75rem',
            background: 'hsl(0 72% 51% / 0.1)',
            border: '1px solid hsl(0 72% 51% / 0.2)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'hsl(0 72% 65%)',
          }}>
            <Bell size={14} />
            <span>{alertasCount} alerta{alertasCount > 1 ? 's' : ''} pendente{alertasCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </nav>

      {/* Perfil e logout */}
      <div style={{
        padding: '0.75rem',
        borderTop: '1px solid hsl(220 10% 15%)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.625rem 0.75rem',
          borderRadius: '8px',
          background: 'hsl(220 13% 11%)',
          marginBottom: '0.5rem',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'hsl(43 30% 20%)',
            border: '1px solid hsl(43 60% 35%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'hsl(43 72% 58%)',
            flexShrink: 0,
          }}>
            {profile.nome.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '500', color: 'hsl(45 20% 88%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.nome}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'hsl(45 8% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {profile.role === 'admin' ? 'Administrador' : 'Advogado'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-ghost"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}
        >
          <LogOut size={14} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
