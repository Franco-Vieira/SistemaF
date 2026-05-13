'use client'

import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { formatCurrency, formatDateTime, formatDate, statusParcelaLabel } from '@/lib/utils'
import { TrendingUp, TrendingDown, Users, FolderOpen, AlertTriangle, Calendar, DollarSign, Clock } from 'lucide-react'
import type { Profile, ResumoMensal, ComparativoAnual, Alerta, AdvogadoFinanceiro, PagamentoAdvogado } from '@/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DashboardClientProps {
  role: 'admin' | 'advogado'
  profile: Profile
  resumoMensal?: ResumoMensal[]
  comparativoAnual?: ComparativoAnual[]
  alertas?: Alerta[]
  totalClientes?: number
  totalProcessos?: number
  parcelasAtrasadas?: number
  mesAtual?: string
  advogadoFinanceiro?: AdvogadoFinanceiro[]
  pagamentosAdvogado?: PagamentoAdvogado[]
}

const GOLD = 'hsl(43, 72%, 58%)'
const GOLD_DARK = 'hsl(43, 60%, 42%)'
const DANGER = 'hsl(0, 72%, 51%)'
const SUCCESS = 'hsl(142, 60%, 45%)'
const MUTED = 'hsl(45, 8%, 30%)'

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string, value: string | number, icon: any, color: string, sub?: string
}) {
  return (
    <div className="card-base" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'hsl(45 8% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: 'hsl(45 8% 45%)', marginTop: '0.2rem' }}>{sub}</div>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'hsl(220 13% 13%)', border: '1px solid hsl(220 10% 22%)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <p style={{ color: 'hsl(45 10% 60%)', marginBottom: '0.4rem' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function DashboardClient(props: DashboardClientProps) {
  const { role, profile } = props
  const [mesSelecionado, setMesSelecionado] = useState(props.mesAtual || '')

  // ---- PAINEL ADVOGADO ----
  if (role === 'advogado') {
    const { advogadoFinanceiro = [], pagamentosAdvogado = [] } = props

    const totalPrevisto = advogadoFinanceiro.reduce((s, r) => s + Number(r.valor_total_previsto), 0)
    const totalPago = advogadoFinanceiro.reduce((s, r) => s + Number(r.valor_total_pago), 0)
    const totalReceber = advogadoFinanceiro.reduce((s, r) => s + Number(r.valor_a_receber), 0)

    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>
            Olá, {profile.nome.split(' ')[0]}
          </h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Resumo dos seus processos e recebimentos
          </p>
        </div>

        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Total Previsto" value={formatCurrency(totalPrevisto)} icon={DollarSign} color={GOLD} />
          <StatCard label="Total Recebido" value={formatCurrency(totalPago)} icon={TrendingUp} color={SUCCESS} />
          <StatCard label="A Receber" value={formatCurrency(totalReceber)} icon={Clock} color="hsl(210 80% 55%)" />
        </div>

        {/* Processos */}
        <div className="card-base" style={{ marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid hsl(var(--border))' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Meus Processos</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Processo</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Previsto</th>
                  <th>Pago</th>
                  <th>A Receber</th>
                </tr>
              </thead>
              <tbody>
                {advogadoFinanceiro.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'hsl(45 8% 40%)', padding: '2rem' }}>Nenhum processo encontrado</td></tr>
                ) : advogadoFinanceiro.map(r => (
                  <tr key={r.processo_id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(43 72% 58%)' }}>{r.numero_processo}</span><br /><span style={{ color: 'hsl(45 8% 55%)', fontSize: '0.8rem' }}>{r.processo_titulo}</span></td>
                    <td>{r.cliente_nome}</td>
                    <td><span className={`badge badge-${r.processo_status === 'ativo' ? 'success' : 'muted'}`}>{r.processo_status}</span></td>
                    <td>{formatCurrency(Number(r.valor_total_previsto))}</td>
                    <td style={{ color: SUCCESS }}>{formatCurrency(Number(r.valor_total_pago))}</td>
                    <td style={{ color: 'hsl(210 80% 65%)' }}>{formatCurrency(Number(r.valor_a_receber))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Histórico de pagamentos */}
        <div className="card-base">
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid hsl(var(--border))' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Histórico de Recebimentos</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Processo</th>
                  <th>Cliente</th>
                  <th>Parcela</th>
                  <th>Forma</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosAdvogado.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'hsl(45 8% 40%)', padding: '2rem' }}>Nenhum recebimento registrado</td></tr>
                ) : pagamentosAdvogado.map(p => (
                  <tr key={p.parcela_id}>
                    <td style={{ fontSize: '0.8rem', color: 'hsl(45 8% 55%)' }}>{formatDateTime(p.data_pagamento)}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(43 72% 58%)' }}>{p.numero_processo}</span></td>
                    <td>{p.cliente_nome}</td>
                    <td style={{ color: 'hsl(45 8% 55%)' }}>Parcela {p.numero_parcela}</td>
                    <td>{p.forma_pagamento || '-'}</td>
                    <td style={{ color: SUCCESS, fontWeight: '500' }}>{formatCurrency(Number(p.valor_pago))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ---- DASHBOARD ADMIN ----
  const { resumoMensal = [], comparativoAnual = [], alertas = [], totalClientes = 0, totalProcessos = 0, parcelasAtrasadas = 0 } = props

  const resumoFiltrado = resumoMensal.find(r => r.mes?.startsWith(mesSelecionado)) || resumoMensal[0]

  const mesesDisponiveis = resumoMensal.map(r => ({
    value: r.mes?.substring(0, 7) || '',
    label: r.mes ? format(parseISO(r.mes), 'MMMM yyyy', { locale: ptBR }) : '',
  }))

  const dadosGrafico = comparativoAnual.map(r => ({
    mes: r.mes_nome,
    Entradas: Number(r.entradas_realizadas),
    Saídas: Number(r.saidas_realizadas),
    Saldo: Number(r.saldo_realizado),
  }))

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>
            Dashboard Financeiro
          </h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Visão geral — Franco & Vieira Advogados & Associados
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={14} color="hsl(45 8% 45%)" />
          <select
            value={mesSelecionado}
            onChange={e => setMesSelecionado(e.target.value)}
            className="input-base"
            style={{ width: 'auto', paddingTop: '0.4rem', paddingBottom: '0.4rem' }}
          >
            {mesesDisponiveis.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard
          label="Entradas Realizadas"
          value={formatCurrency(Number(resumoFiltrado?.entradas_realizadas || 0))}
          icon={TrendingUp}
          color={SUCCESS}
          sub={`Previsto: ${formatCurrency(Number(resumoFiltrado?.entradas_previstas || 0))}`}
        />
        <StatCard
          label="Saídas Realizadas"
          value={formatCurrency(Number(resumoFiltrado?.saidas_realizadas || 0))}
          icon={TrendingDown}
          color={DANGER}
          sub={`Previsto: ${formatCurrency(Number(resumoFiltrado?.saidas_previstas || 0))}`}
        />
        <StatCard
          label="Clientes Ativos"
          value={totalClientes}
          icon={Users}
          color={GOLD}
        />
        <StatCard
          label="Processos Ativos"
          value={totalProcessos}
          icon={FolderOpen}
          color="hsl(210 80% 55%)"
          sub={parcelasAtrasadas > 0 ? `${parcelasAtrasadas} parcela(s) atrasada(s)` : undefined}
        />
      </div>

      {/* Gráfico de área mensal */}
      <div className="card-base" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Comparativo Anual — Mês a Mês</h2>
          <span style={{ fontSize: '0.75rem', color: 'hsl(45 8% 45%)' }}>{new Date().getFullYear()}</span>
        </div>
        {dadosGrafico.length === 0 ? (
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(45 8% 40%)', fontSize: '0.875rem' }}>
            Sem dados para exibir
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dadosGrafico} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SUCCESS} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={SUCCESS} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={DANGER} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={DANGER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 18%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'hsl(45 10% 60%)' }} />
              <Area type="monotone" dataKey="Entradas" stroke={SUCCESS} fill="url(#gradEntradas)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Saídas" stroke={DANGER} fill="url(#gradSaidas)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráfico barras + Alertas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
        {/* Barras saldo */}
        <div className="card-base" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)', marginBottom: '1.25rem' }}>Saldo Realizado por Mês</h2>
          {dadosGrafico.length === 0 ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(45 8% 40%)', fontSize: '0.875rem' }}>
              Sem dados para exibir
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dadosGrafico} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 18%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Saldo" fill={GOLD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alertas */}
        <div className="card-base" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={15} color="hsl(0 72% 65%)" />
            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Alertas Pendentes</h2>
            {alertas.length > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{alertas.length}</span>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {alertas.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(45 8% 40%)', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem 0' }}>
                ✓ Nenhum alerta pendente
              </div>
            ) : alertas.map(a => (
              <div key={a.id} style={{
                padding: '0.625rem 0.75rem',
                background: 'hsl(0 72% 51% / 0.08)',
                border: '1px solid hsl(0 72% 51% / 0.2)',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: 'hsl(0 72% 70%)',
                lineHeight: 1.4,
              }}>
                {a.mensagem}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
