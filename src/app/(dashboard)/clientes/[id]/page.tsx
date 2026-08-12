import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ClienteDetalheClient from './ClienteDetalheClient'

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'secretaria'].includes(profile.role)) redirect('/home')

  const { data: cliente } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (!cliente) notFound()

  const { data: processos } = await supabase
    .from('processos')
    .select('id, numero_processo, titulo, status, data_abertura, valor_total_contrato')
    .eq('cliente_id', id)
    .order('created_at', { ascending: false })

  const { data: contratos } = await supabase
    .from('contratos')
    .select('id, numero_contrato, tipo, valor_total, status, data_inicio, processo_id')
    .eq('cliente_id', id)
    .order('created_at', { ascending: false })

  return <ClienteDetalheClient cliente={cliente} processos={processos || []} contratos={contratos || []} />
}
