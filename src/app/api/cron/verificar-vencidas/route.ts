import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
// Executa via Vercel Cron todo dia às 07:00 UTC (04:00 em Brasília).
// Marca parcelas pendentes vencidas como 'atrasado' e gera o alerta em 'alertas'
// (com nome do cliente já resolvido, via processo ou via contrato direto).
// Protegido por CRON_SECRET (o Vercel injeta o header Authorization automaticamente
// nos crons configurados no vercel.json — não precisa fazer nada manual em produção).
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service role: ignora RLS, roda com privilégio total
  )
  const { error } = await supabase.rpc('verificar_parcelas_vencidas')
  if (error) {
    console.error('[cron/verificar-vencidas] erro:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  console.log('[cron/verificar-vencidas] processado com sucesso')
  return NextResponse.json({ success: true })
}
