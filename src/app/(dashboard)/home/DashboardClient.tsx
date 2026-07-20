'use client'

import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, Users, FolderOpen, AlertTriangle, Calendar, FileText, Wallet, Clock } from 'lucide-react'
import type { Profile, ResumoMensal, ComparativoAnual, Alerta } from '@/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface ReceberMensal {
  mes: string // "YYYY-MM"
  valor_previsto_mes: number
  valor_recebido_mes: number
  valor_nao_recebido_mes: number
  qtd_atrasadas_mes: number
}

interface DashboardClientProps {
  role: 'admin' | 'advogado' | 'secretaria'
  profile: Profile
  resumoMensal?: ResumoMensal[]
  comparativoAnual?: ComparativoAnual[]
  alertas?: Alerta[]
  totalClientes?: number
  totalProcessos?: number
  parcelasAtrasadas?: number
  mesAtual?: string
  receberMensal?: ReceberMensal[]
  totalAReceberGeral?: number
}

const GOLD = 'hsl(43, 72%, 58%)'
const DANGER = 'hsl(0, 72%, 51%)'
const SUCCESS = 'hsl(142, 60%, 45%)'
const MUTED = 'hsl(45, 8%, 30%)'
const INFO = 'hsl(210, 80%, 55%)'

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

// ── PAINEL SECRETARIA ──────────────────────────────────────────
function PainelSecretaria({ profile }: { profile: Profile }) {
  const atalhos = [
    { href: '/clientes/novo', label: 'Novo Cliente', icon: Users, color: GOLD },
    { href: '/processos/novo', label: 'Novo Processo', icon: FolderOpen, color: 'hsl(210 80% 55%)' },
    { href: '/contratos/novo', label: 'Novo Contrato', icon: FileText, color: SUCCESS },
  ]

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>
          Olá, {profile.nome.split(' ')[0]}
        </h1>
        <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Franco & Vieira Advogados & Associados
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {atalhos.map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div className="card-base" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'border-color 0.15s', borderColor: 'hsl(43 30% 22%)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'hsl(43 30% 22%)')}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={color} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>{label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { href: '/clientes', label: 'Ver Clientes', color: GOLD },
          { href: '/processos', label: 'Ver Processos', color: 'hsl(210 80% 55%)' },
          { href: '/contratos', label: 'Ver Contratos', color: SUCCESS },
        ].map(({ href, label, color }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '0.75rem', border: `1px solid hsl(220 10% 20%)`, borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', color: 'hsl(45 8% 55%)', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color }}
              onMouseLeave={e => { e.currentTarget.style.color = 'hsl(45 8% 55%)'; e.currentTarget.style.borderColor = 'hsl(220 10% 20%)' }}
            >
              {label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── DASHBOARD ADMIN ────────────────────────────────────────────
export default function DashboardClient(props: DashboardClientProps) {
  const { role, profile } = props

  if (role === 'secretaria') return <PainelSecretaria profile={profile} />

  const [mesSelecionado, setMesSelecionado] = useState(props.mesAtual || '')
  const {
    resumoMensal = [], comparativoAnual = [], alertas = [],
    totalClientes = 0, totalProcessos = 0, parcelasAtrasadas = 0,
    receberMensal = [], totalAReceberGeral = 0,
  } = props

  const resumoFiltrado = resumoMensal.find(r => r.mes?.startsWith(mesSelecionado)) || resumoMensal[0]
  // vw_receber_mensal já devolve "mes" como texto "YYYY-MM" puro — comparação direta, sem risco de timezone
  const receberFiltrado = receberMensal.find(r => r.mes === mesSelecionado)

  const mesesDisponiveis = resumoMensal.map(r => {
    const value = r.mes?.substring(0, 7) || '' // "2026-06" (sem conversão de fuso)
    let label = ''
    if (value) {
      const [ano, mes] = value.split('-').map(Number)
      // data montada no fuso local evita o deslocamento de -1 mês causado pelo timestamp UTC
      label = format(new Date(ano, mes - 1, 1), 'MMMM yyyy', { locale: ptBR })
    }
    return { value, label }
  })

  const dadosGrafico = comparativoAnual.map(r => ({
    mes: r.mes_nome,
    Entradas: Number(r.entradas_realizadas),
    'Saídas': Number(r.saidas_realizadas),
    Saldo: Number(r.saldo_realizado),
  }))

  return (
    <div className="animate-fade-in">
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
          <select value={mesSelecionado} onChange={e => setMesSelecionado(e.target.value)} className="input-base" style={{ width: 'auto', paddingTop: '0.4rem', paddingBottom: '0.4rem' }}>
            {mesesDisponiveis.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── A RECEBER: total geral (sem filtro de mês) + recebido/não recebido do mês selecionado ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <StatCard
          label="A Receber (Total Geral)"
          value={formatCurrency(totalAReceberGeral)}
          icon={Wallet}
          color={GOLD}
          sub="Soma de tudo em aberto, todos os meses"
        />
        <StatCard
          label="A Receber no Mês"
          value={formatCurrency(Number(receberFiltrado?.valor_nao_recebido_mes || 0))}
          icon={Clock}
          color={DANGER}
          sub={receberFiltrado?.qtd_atrasadas_mes ? `${receberFiltrado.qtd_atrasadas_mes} parcela(s) atrasada(s)` : 'Nenhuma parcela atrasada'}
        />
        <StatCard
          label="Recebido no Mês"
          value={formatCurrency(Number(receberFiltrado?.valor_recebido_mes || 0))}
          icon={TrendingUp}
          color={SUCCESS}
          sub={`Previsto do mês: ${formatCurrency(Number(receberFiltrado?.valor_previsto_mes || 0))}`}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Entradas Realizadas" value={formatCurrency(Number(resumoFiltrado?.entradas_realizadas || 0))} icon={TrendingUp} color={SUCCESS} sub={`Previsto: ${formatCurrency(Number(resumoFiltrado?.entradas_previstas || 0))}`} />
        <StatCard label="Saídas Realizadas" value={formatCurrency(Number(resumoFiltrado?.saidas_realizadas || 0))} icon={TrendingDown} color={DANGER} sub={`Previsto: ${formatCurrency(Number(resumoFiltrado?.saidas_previstas || 0))}`} />
        <StatCard label="Clientes Ativos" value={totalClientes} icon={Users} color={GOLD} />
        <StatCard label="Processos Ativos" value={totalProcessos} icon={FolderOpen} color={INFO} sub={parcelasAtrasadas > 0 ? `${parcelasAtrasadas} parcela(s) atrasada(s)` : undefined} />
      </div>

      <div className="card-base" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Comparativo Anual — Mês a Mês</h2>
          <span style={{ fontSize: '0.75rem', color: 'hsl(45 8% 45%)' }}>{new Date().getFullYear()}</span>
        </div>
        {dadosGrafico.length === 0 ? (
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(45 8% 40%)', fontSize: '0.875rem' }}>Sem dados para exibir</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
        <div className="card-base" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)', marginBottom: '1.25rem' }}>Saldo Realizado por Mês</h2>
          {dadosGrafico.length === 0 ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(45 8% 40%)', fontSize: '0.875rem' }}>Sem dados para exibir</div>
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

        <div className="card-base" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={15} color="hsl(0 72% 65%)" />
            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Alertas Pendentes</h2>
            {alertas.length > 0 && <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{alertas.length}</span>}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {alertas.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(45 8% 40%)', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem 0' }}>
                ✓ Nenhum alerta pendente
              </div>
            ) : alertas.map((a: any) => (
              <div key={a.id} style={{ padding: '0.625rem 0.75rem', background: 'hsl(0 72% 51% / 0.08)', border: '1px solid hsl(0 72% 51% / 0.2)', borderRadius: '6px', fontSize: '0.78rem', color: 'hsl(0 72% 70%)', lineHeight: 1.4 }}>
                {a.mensagem}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
