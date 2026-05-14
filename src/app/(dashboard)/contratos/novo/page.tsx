import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoContratoForm from './NovoContratoForm'

export default async function NovoContratoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/home')

  const { data: processos } = await supabase
    .from('processos').select('id, numero_processo, titulo, cliente:clientes(nome)').eq('status', 'ativo').order('numero_processo')

  return <NovoContratoForm processos={processos || []} />
}
