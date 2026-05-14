import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoLancamentoForm from './NovoLancamentoForm'

export default async function NovoLancamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/home')

  const { data: processos } = await supabase.from('processos').select('id, numero_processo, titulo').eq('status', 'ativo').order('numero_processo')
  const { data: advogados } = await supabase.from('profiles').select('id, nome').eq('role', 'advogado').eq('ativo', true)

  return <NovoLancamentoForm processos={processos || []} advogados={advogados || []} />
}
