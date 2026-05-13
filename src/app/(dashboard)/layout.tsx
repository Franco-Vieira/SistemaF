import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import type { Profile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Busca alertas não lidos (apenas admin)
  let alertasCount = 0
  if (profile.role === 'admin') {
    const { count } = await supabase
      .from('alertas')
      .select('*', { count: 'exact', head: true })
      .eq('lido', false)
    alertasCount = count || 0
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'hsl(220 15% 8%)' }}>
      <Sidebar profile={profile as Profile} alertasCount={alertasCount} />
      <main style={{
        flex: 1,
        marginLeft: '240px',
        padding: '2rem',
        minHeight: '100vh',
        maxWidth: 'calc(100vw - 240px)',
      }}>
        {children}
      </main>
    </div>
  )
}
