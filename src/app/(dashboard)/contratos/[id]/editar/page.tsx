import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditarContratoForm from './EditarContratoForm'

export default async function EditarContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/home')

  const { data: contrato } = await supabase.from('contratos').select('*').eq('id', id).single()
  if (!contrato) notFound()

  const { data: processos } = await supabase.from('processos').select('id, numero_processo, titulo, cliente:clientes(nome)').eq('status', 'ativo').order('numero_processo')

  return <EditarContratoForm contrato={contrato} processos={processos || []} />
}
