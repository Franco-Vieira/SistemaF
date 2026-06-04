import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import DashboardAdvogado from './DashboardAdvogado'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Secretaria → tela simples, sem dados financeiros
  if (profile.role === 'secretaria') {
    return <DashboardClient role="secretaria" profile={profile} />
  }

  // Advogado → dashboard próprio
  if (profile.role === 'advogado') {
    return <DashboardAdvogado profile={profile} />
  }

  // Admin → dashboard completo
  const hoje = new Date()
  const mesAtual = hoje.toISOString().substring(0, 7)

  const [
    { data: resumoMensal },
    { data: comparativoAnual },
    { data: alertas },
    { count: totalClientes },
    { count: totalProcessos },
    { count: parcelasAtrasadas },
  ] = await Promise.all([
    supabase.from('vw_resumo_mensal').select('*').order('mes', { ascending: false }).limit(12),
    supabase.from('vw_comparativo_anual').select('*').order('mes_numero'),
    supabase.from('alertas').select('*').eq('resolvido', false).order('created_at', { ascending: false }).limit(10),
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'atrasado'),
  ])

  return (
    <DashboardClient
      role="admin"
      profile={profile}
      resumoMensal={resumoMensal || []}
      comparativoAnual={comparativoAnual || []}
      alertas={alertas || []}
      totalClientes={totalClientes || 0}
      totalProcessos={totalProcessos || 0}
      parcelasAtrasadas={parcelasAtrasadas || 0}
      mesAtual={mesAtual}
    />
  )
}
