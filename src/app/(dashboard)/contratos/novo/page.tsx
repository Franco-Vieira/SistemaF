import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoContratoForm from './NovoContratoForm'

export default async function NovoContratoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'secretaria'].includes(profile.role)) redirect('/home')

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, nome_empresa, tipo_processo')
    .eq('ativo', true)
    .order('nome')

  const { data: processos } = await supabase
    .from('processos')
    .select('id, numero_processo, titulo, cliente_id')
    .eq('status', 'ativo')
    .order('numero_processo')

  return <NovoContratoForm clientes={clientes || []} processos={processos || []} />
}
