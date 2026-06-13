'use client'

import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, ChevronRight } from 'lucide-react'
import type { Profile } from '@/types'

const SUCCESS = 'hsl(142, 60%, 45%)'

interface Props {
  profile: Profile
  totalRecebido: number
  pagamentos: any[]
}

export default function DashboardAdvogado({ profile, totalRecebido, pagamentos }: Props) {
  const router = useRouter()

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>
          Olá, {profile.nome.split(' ')[0]}
        </h1>
        <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Seus recebimentos registrados pelo escritório
        </p>
      </div>

      {/* Card total recebido */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card-base" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'hsl(142 60% 45% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={20} color={SUCCESS} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'hsl(45 8% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Recebido</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: SUCCESS }}>{formatCurrency(totalRecebido)}</div>
          </div>
        </div>
      </div>

      {/* Lista de pagamentos recebidos */}
      <div className="card-base">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid hsl(var(--border))' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>
            Pagamentos Recebidos ({pagamentos.length})
          </h2>
        </div>

        {pagamentos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(45 8% 40%)', fontSize: '0.875rem' }}>
            Nenhum pagamento registrado ainda
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Processo / Cliente</th>
                  <th>Forma</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p: any) => (
                  <tr
                    key={p.lancamento_id}
                    onClick={() => router.push(`/lancamentos/${p.lancamento_id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontSize: '0.8rem', color: 'hsl(45 8% 55%)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {formatDate(p.data_pagamento || p.data_competencia)}
                    </td>
                    <td style={{ fontWeight: '500' }}>{p.descricao}</td>
                    <td style={{ fontSize: '0.8rem', color: 'hsl(43 72% 65%)' }}>
                      {p.numero_processo || p.cliente_nome || p.observacoes || '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'hsl(45 8% 55%)' }}>
                      {p.forma_pagamento ? p.forma_pagamento.charAt(0).toUpperCase() + p.forma_pagamento.slice(1) : '—'}
                    </td>
                    <td style={{ fontWeight: '700', color: SUCCESS, whiteSpace: 'nowrap' }}>
                      {formatCurrency(Number(p.valor))}
                    </td>
                    <td>
                      <ChevronRight size={14} color="hsl(45 8% 40%)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
