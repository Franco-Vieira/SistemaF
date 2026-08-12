import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientesInativosClient from './ClientesInativosClient'

export default async function ClientesInativosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['admin', 'secretaria'].includes(profile.role)) redirect('/home')
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*, advogado_origem:profiles!advogado_origem_id(id, nome)')
    .eq('ativo', false)
    .order('nome', { ascending: true })
  return <ClientesInativosClient clientes={clientes || []} />
}
