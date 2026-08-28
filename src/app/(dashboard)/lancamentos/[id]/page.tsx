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
    .select(`
      *,
      processo:processos(id, numero_processo, titulo, cliente:clientes(nome)),
      advogado:profiles!advogado_id(id, nome),
      parcela:parcelas(numero_parcela, contrato:contratos(numero_contrato, cliente:clientes(nome)))
    `)
    .eq('id', id)
    .single()
  if (!lancamento) notFound()
  const { data: profile } = await supabase.from('profiles').select('role, id').eq('id', user.id).single()
  // Se for advogado vinculado a este lançamento, inverte a perspectiva (saída do escritório = entrada para ele)
  const isAdvogadoVinculado = profile?.role === 'advogado' && lancamento.advogado_id === user.id
  return <LancamentoDetalhe lancamento={lancamento} perspectiva={isAdvogadoVinculado ? 'advogado' : 'admin'} />
}
