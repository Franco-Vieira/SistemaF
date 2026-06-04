import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoClienteForm from './NovoClienteForm'

export default async function NovoClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'secretaria'].includes(profile.role)) redirect('/home')
  const { data: advogados } = await supabase
    .from('profiles').select('id, nome').eq('role', 'advogado').eq('ativo', true).order('nome')
  return <NovoClienteForm advogados={advogados || []} />
}
