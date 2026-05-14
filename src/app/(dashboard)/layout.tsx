import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import type { Profile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) redirect('/login')

  // Tenta buscar perfil — se não existir, cria um padrão
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Se perfil não existe no banco ainda, cria agora
  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
        email: user.email!,
        role: user.user_metadata?.role || 'advogado',
      })
      .select('*')
      .single()

    profile = newProfile
  }

  if (!profile) redirect('/login')

  // Alertas não lidos (apenas admin)
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
