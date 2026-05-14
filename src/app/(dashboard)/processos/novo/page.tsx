import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoProcessoForm from './NovoProcessoForm'

export default async function NovoProcessoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/home')

  const { data: clientes } = await supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome')
  const { data: advogados } = await supabase.from('profiles').select('id, nome').eq('role', 'advogado').eq('ativo', true).order('nome')

  return <NovoProcessoForm clientes={clientes || []} advogados={advogados || []} />
}
