import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LancamentosClient from './LancamentosClient'
export default async function LancamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/home')
  const { data: lancamentos } = await supabase
    .from('lancamentos')
    .select(`
      *,
      processo:processos(numero_processo, titulo, cliente:clientes(nome)),
      advogado:profiles!advogado_id(nome),
      parcela:parcelas(numero_parcela, contrato:contratos(cliente:clientes(nome)))
    `)
    // nome do cliente: vem do processo quando é judicial, ou via parcela -> contrato quando é extrajudicial
    .order('data_competencia', { ascending: false })
    .limit(200)
  const { data: processos } = await supabase
    .from('processos')
    .select('id, numero_processo, titulo')
    .eq('status', 'ativo')
    .order('numero_processo')
  const { data: advogados } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('role', 'advogado')
    .eq('ativo', true)
  return <LancamentosClient lancamentos={lancamentos || []} processos={processos || []} advogados={advogados || []} />
}
