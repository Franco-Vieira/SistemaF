import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import DashboardAdvogado from './DashboardAdvogado'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Painel do advogado
  if (profile.role === 'advogado') {
    // Apenas pagamentos realizados vinculados a ele
    const { data: pagamentos } = await supabase
      .from('lancamentos')
      .select('id as lancamento_id, descricao, valor, tipo, status, data_competencia, data_pagamento, forma_pagamento, referencia, observacoes, processo:processos(numero_processo, titulo)')
      .eq('advogado_id', user.id)
      .eq('status', 'realizado')
      .order('data_pagamento', { ascending: false })
      .limit(100)

    const totalRecebido = (pagamentos || []).reduce((s: number, l: any) => s + Number(l.valor), 0)

    return (
      <DashboardAdvogado
        profile={profile}
        totalRecebido={totalRecebido}
        pagamentos={pagamentos || []}
      />
    )
  }

  // Admin — busca dados do dashboard
  const now = new Date()
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { data: resumoMensal } = await supabase
    .from('vw_resumo_mensal')
    .select('*')
    .order('mes', { ascending: false })
    .limit(13)

  const { data: comparativoAnual } = await supabase
    .from('vw_comparativo_anual')
    .select('*')
    .eq('ano', now.getFullYear())
    .order('mes', { ascending: true })

  const { data: alertas } = await supabase
    .from('alertas')
    .select('*')
    .eq('lido', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: totalClientes } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .eq('ativo', true)

  const { count: totalProcessos } = await supabase
    .from('processos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativo')

  const { count: parcelasAtrasadas } = await supabase
    .from('parcelas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'atrasado')

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
