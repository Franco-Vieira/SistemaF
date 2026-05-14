import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// CORRIGIDO: função lazy para não instanciar em build time (env vars ausentes)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { nome, email, telefone, senha, role } = await req.json()
  const supabaseAdmin = getAdminClient()

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, role },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  if (telefone) {
    await supabaseAdmin.from('profiles').update({ telefone }).eq('id', authData.user.id)
  }

  const { data: newProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', authData.user.id).single()

  return NextResponse.json({ profile: newProfile })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, ativo } = await req.json()
  const supabaseAdmin = getAdminClient()
  await supabaseAdmin.from('profiles').update({ ativo }).eq('id', id)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()

  // Não permite excluir a si mesmo
  if (id === user.id) return NextResponse.json({ error: 'Não é possível excluir sua própria conta' }, { status: 400 })

  const supabaseAdmin = getAdminClient()

  // Deleta do Auth (cascade deleta o profile via trigger)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
