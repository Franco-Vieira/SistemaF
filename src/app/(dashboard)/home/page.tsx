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

  // Secretaria → painel simples sem dados financeiros
  if (profile.role === 'secretaria') {
    return <DashboardClient role="secretaria" profile={profile} />
  }

  // Advogado → dashboard próprio com pagamentos
  if (profile.role === 'advogado') {
    const { data: pagamentos } = await supabase
      .from('vw_pagamentos_advogado')
      .select('*')
      .eq('advogado_id', user.id)
      .order('data_pagamento', { ascending: false })
    const totalRecebido = (pagamentos || []).reduce((acc: number, p: any) => acc + Number(p.valor || 0), 0)
    return (
      <DashboardAdvogado
        profile={profile}
        totalRecebido={totalRecebido}
        pagamentos={pagamentos || []}
      />
    )
  }

  // Admin → dashboard completo
  // mês atual no fuso de Brasília (servidor Vercel roda em UTC)
  const mesAtual = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date()) // ex.: "2026-06"

  const [
    { data: resumoMensal },
    { data: comparativoAnual },
    { data: alertas },
    { count: totalClientes },
    { count: totalProcessos },
    { count: parcelasAtrasadas },
  ] = await Promise.all([
    supabase.from('vw_resumo_mensal').select('*').order('mes', { ascending: false }).limit(12),
    supabase.from('vw_comparativo_anual').select('*').order('mes'), // ← era 'mes_numero' (coluna inexistente)
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
