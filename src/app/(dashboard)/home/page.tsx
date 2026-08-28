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
  // data/hora atual no fuso de Brasília (servidor Vercel roda em UTC)
  const mesAtual = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date()) // ex.: "2026-07"
  const hojeStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()) // ex.: "2026-08-28"
  const [
    { data: resumoMensal },
    { data: comparativoAnual },
    { data: alertas },
    { count: totalClientes },
    { count: totalProcessos },
    { count: parcelasAtrasadas },
    { data: receberMensal },
    { data: parcelasEmAberto },
    { data: cobrancasPendentes },
  ] = await Promise.all([
    supabase.from('vw_resumo_mensal').select('*').order('mes', { ascending: false }).limit(12),
    supabase.from('vw_comparativo_anual').select('*').order('mes'),
    supabase.from('alertas').select('*').eq('lido', false).order('created_at', { ascending: false }).limit(10),
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'atrasado'),
    // Sem limit: com contratos Mensal de longa duração o cronograma pode se estender
    // por vários anos (ex.: 29 meses), e um limit(12) ordenado desc cortava o mês atual
    // fora da janela retornada, sempre pegando só os meses mais distantes no futuro.
    supabase.from('vw_receber_mensal').select('*').order('mes', { ascending: false }),
    supabase.from('parcelas').select('valor_previsto, valor_pago').in('status', ['pendente', 'pago_parcial', 'atrasado']),
    // Parcelas VENCIDAS (data_vencimento < hoje) e ainda não quitadas, com nome do cliente
    // resolvido via processo (judicial) ou, na ausência de processo, direto pelo contrato (extrajudicial).
    supabase.from('parcelas')
      .select(`
        id, valor_previsto, valor_pago, data_vencimento, status,
        processo:processos(numero_processo, cliente:clientes(nome)),
        contrato:contratos(cliente:clientes(nome))
      `)
      .in('status', ['pendente', 'pago_parcial', 'atrasado'])
      .lt('data_vencimento', hojeStr)
      .order('data_vencimento', { ascending: true })
      .limit(10),
  ])
  const totalAReceberGeral = (parcelasEmAberto || []).reduce(
    (acc: number, p: any) => acc + (Number(p.valor_previsto) - Number(p.valor_pago || 0)),
    0
  )
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
      receberMensal={receberMensal || []}
      totalAReceberGeral={totalAReceberGeral}
      // cast: o types.ts do projeto não tem os relacionamentos de FK bem tipados,
      // então o Supabase infere "processo"/"contrato"/"cliente" como array em vez de objeto único.
      // O dado real vem como objeto (many-to-one), o DashboardClient já lê assim.
      cobrancasPendentes={(cobrancasPendentes || []) as any}
    />
  )
}
