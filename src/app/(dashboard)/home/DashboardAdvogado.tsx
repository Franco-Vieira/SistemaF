'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import type { Profile, AdvogadoFinanceiro, PagamentoAdvogado } from '@/types'

const SUCCESS = 'hsl(142, 60%, 45%)'
const DANGER = 'hsl(0, 72%, 51%)'
const GOLD = 'hsl(43, 72%, 58%)'
const INFO = 'hsl(210, 80%, 55%)'

interface Props {
  profile: Profile
  financeiro: AdvogadoFinanceiro | null
  lancamentos: PagamentoAdvogado[]
}

export default function DashboardAdvogado({ profile, financeiro, lancamentos }: Props) {
  const totalEntradas = Number(financeiro?.total_entradas_realizadas || 0)
  const totalSaidas = Number(financeiro?.total_saidas_realizadas || 0)
  const totalEntradasPrev = Number(financeiro?.total_entradas_previstas || 0)
  const totalSaidasPrev = Number(financeiro?.total_saidas_previstas || 0)
  const saldo = Number(financeiro?.saldo_realizado || 0)

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>
          Olá, {profile.nome.split(' ')[0]}
        </h1>
        <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Resumo dos seus lançamentos e recebimentos
        </p>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Entradas Realizadas', value: formatCurrency(totalEntradas), color: SUCCESS, icon: TrendingUp },
          { label: 'Saídas Realizadas', value: formatCurrency(totalSaidas), color: DANGER, icon: TrendingDown },
          { label: 'Entradas Previstas', value: formatCurrency(totalEntradasPrev), color: GOLD, icon: ArrowUpCircle },
          { label: 'Saídas Previstas', value: formatCurrency(totalSaidasPrev), color: INFO, icon: ArrowDownCircle },
          { label: 'Saldo Realizado', value: formatCurrency(saldo), color: saldo >= 0 ? SUCCESS : DANGER, icon: DollarSign },
        ].map(card => (
          <div key={card.label} className="card-base" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', color: 'hsl(45 8% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</span>
              <card.icon size={14} color={card.color} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Histórico de lançamentos */}
      <div className="card-base">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid hsl(var(--border))' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>
            Meus Lançamentos ({lancamentos.length})
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Processo</th>
                <th>Forma</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'hsl(45 8% 40%)', padding: '2rem' }}>
                  Nenhum lançamento registrado
                </td></tr>
              ) : lancamentos.map(l => (
                <tr key={l.lancamento_id}>
                  <td>
                    {l.tipo === 'entrada'
                      ? <ArrowUpCircle size={15} color="hsl(142 60% 55%)" />
                      : <ArrowDownCircle size={15} color="hsl(0 72% 65%)" />}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'hsl(45 8% 55%)', fontFamily: 'monospace' }}>
                    {formatDate(l.data_competencia)}
                  </td>
                  <td style={{ fontWeight: '500' }}>{l.descricao}</td>
                  <td style={{ fontSize: '0.8rem', color: 'hsl(45 8% 55%)' }}>{l.categoria}</td>
                  <td style={{ fontSize: '0.8rem', color: 'hsl(43 72% 58%)', fontFamily: 'monospace' }}>
                    {l.numero_processo || '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'hsl(45 8% 55%)' }}>
                    {l.forma_pagamento || '—'}
                  </td>
                  <td>
                    <span className={`badge ${l.status === 'realizado' ? 'badge-success' : l.status === 'cancelado' ? 'badge-muted' : 'badge-warning'}`}>
                      {l.status === 'realizado' ? 'Realizado' : l.status === 'cancelado' ? 'Cancelado' : 'Previsto'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600', color: l.tipo === 'entrada' ? 'hsl(142 60% 55%)' : 'hsl(0 72% 65%)' }}>
                    {l.tipo === 'saida' ? '-' : ''}{formatCurrency(Number(l.valor))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
