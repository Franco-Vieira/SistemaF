import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConfiguracoesClient from './ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/home')

  const { data: config } = await supabase.from('configuracoes').select('*').eq('id', 'default').single()

  return <ConfiguracoesClient config={config} />
}
