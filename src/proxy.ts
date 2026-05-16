import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isPublicRoute = pathname.startsWith('/login')

  // Não autenticado → login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Autenticado → verificar se está ativo
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('ativo')
      .eq('id', user.id)
      .single()

    // Usuário inativo → forçar logout e redirecionar para login
    if (profile && profile.ativo === false) {
      await supabase.auth.signOut()
      const response = NextResponse.redirect(new URL('/login', request.url))
      // Limpar cookies de sessão
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
          response.cookies.delete(cookie.name)
        }
      })
      return response
    }
  }

  // Autenticado tentando acessar login → home
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
