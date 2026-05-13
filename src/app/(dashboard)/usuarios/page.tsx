import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsuariosClient from './UsuariosClient'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/home')

  const { data: usuarios } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: false })
    .order('nome')

  return <UsuariosClient usuarios={usuarios || []} adminId={user.id} />
}
