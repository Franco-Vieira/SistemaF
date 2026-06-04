import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProcessosClient from './ProcessosClient'

export default async function ProcessosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['admin', 'secretaria'].includes(profile.role)) redirect('/home')
  const { data: processos } = await supabase
    .from('processos')
    .select(`
      *,
      cliente:clientes(id, nome),
      processo_advogados(advogado_id, papel, advogado:profiles(id, nome))
    `)
    .order('created_at', { ascending: false })
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')
  const { data: advogados } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('role', 'advogado')
    .eq('ativo', true)
    .order('nome')
  return <ProcessosClient processos={processos || []} clientes={clientes || []} advogados={advogados || []} />
}
