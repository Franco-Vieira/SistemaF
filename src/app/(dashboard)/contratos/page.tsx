import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContratosClient from './ContratosClient'

export default async function ContratosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/home')

  const { data: contratos } = await supabase
    .from('contratos')
    .select('*, processo:processos(id, numero_processo, titulo, cliente:clientes(nome))')
    .order('created_at', { ascending: false })

  const { data: processos } = await supabase
    .from('processos')
    .select('id, numero_processo, titulo, cliente:clientes(nome)')
    .eq('status', 'ativo')
    .order('numero_processo')

  return <ContratosClient contratos={contratos || []} processos={processos || []} />
}
