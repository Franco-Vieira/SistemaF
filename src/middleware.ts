import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // CORREÇÃO: Inicializar supabaseResponse UMA vez e não recriar dentro do setAll
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // CORREÇÃO: Setar nos cookies do request primeiro
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // CORREÇÃO: Recriar resposta com headers atualizados
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // CORREÇÃO: Setar todos os cookies na resposta
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: getUser() valida o token com o servidor Supabase
  // Não usar getSession() aqui — getSession() não valida server-side
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Não autenticado tentando acessar rota protegida → redireciona para /login
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Autenticado tentando acessar /login → redireciona para /home
  if (user && pathname.startsWith('/login')) {
    const redirectUrl = new URL('/home', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // CRÍTICO: Sempre retornar supabaseResponse para propagar cookies de sessão
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Aplica middleware em todas as rotas EXCETO:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - arquivos de imagem
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
