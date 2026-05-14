import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MeusProcessosClient from './MeusProcessosClient'

export default async function MeusProcessosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'advogado') redirect('/home')

  const { data: processos } = await supabase
    .from('processo_advogados')
    .select(`
      papel,
      processo:processos(
        id, numero_processo, titulo, status, data_abertura, valor_total_contrato,
        cliente:clientes(nome)
      )
    `)
    .eq('advogado_id', user.id)
    .eq('processo.status', 'ativo')
    .order('created_at', { ascending: false })

  // Filtrar nulls (processos inativos que foram filtrados)
  const processosAtivos = (processos || []).filter((p: any) => p.processo !== null)

  return <MeusProcessosClient processos={processosAtivos} />
}
