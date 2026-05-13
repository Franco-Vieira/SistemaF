import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Franco & Vieira | Sistema Financeiro',
  description: 'Sistema de controle financeiro — Franco & Vieira Advogados & Associados',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
