import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditarClienteForm from './EditarClienteForm'

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/home')

  const { data: cliente } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (!cliente) notFound()

  const { data: advogados } = await supabase.from('profiles').select('id, nome').eq('role', 'advogado').eq('ativo', true).order('nome')

  return <EditarClienteForm cliente={cliente} advogados={advogados || []} />
}
