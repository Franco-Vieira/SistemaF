import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientesClient from './ClientesClient'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['admin', 'secretaria'].includes(profile.role)) redirect('/home')
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*, advogado_origem:profiles!advogado_origem_id(id, nome)')
    .eq('ativo', true)
    .order('nome', { ascending: true })
  const { data: advogados } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('role', 'advogado')
    .eq('ativo', true)
    .order('nome')
  return <ClientesClient clientes={clientes || []} advogados={advogados || []} />
}
