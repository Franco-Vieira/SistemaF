import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import LancamentoDetalhe from './LancamentoDetalhe'

export default async function LancamentoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lancamento } = await supabase
    .from('lancamentos')
    .select('*, processo:processos(id, numero_processo, titulo, cliente:clientes(nome)), advogado:profiles!advogado_id(id, nome)')
    .eq('id', id)
    .single()

  if (!lancamento) notFound()

  return <LancamentoDetalhe lancamento={lancamento} />
}
