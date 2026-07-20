import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Executa via Vercel Cron todo dia 1º do mês.
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

  const { data, error } = await supabase.rpc('processar_virada_mes')

  if (error) {
    console.error('[cron/virada-mes] erro:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  console.log('[cron/virada-mes] processado:', data)
  return NextResponse.json({ success: true, processadas: data?.length || 0, detalhes: data })
}
