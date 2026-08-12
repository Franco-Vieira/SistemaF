import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditarProcessoForm from './EditarProcessoForm'
export default async function EditarProcessoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/home')
  const { data: processo } = await supabase.from('processos').select('*').eq('id', id).single()
  if (!processo) notFound()
  const { data: clientes } = await supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome')
  const { data: advogados } = await supabase.from('profiles').select('id, nome').eq('role', 'advogado').eq('ativo', true).order('nome')
  const { data: vinculados } = await supabase.from('processo_advogados').select('advogado_id, papel').eq('processo_id', id)
  return <EditarProcessoForm processo={processo} clientes={clientes || []} advogados={advogados || []} vinculados={vinculados || []} />
}
