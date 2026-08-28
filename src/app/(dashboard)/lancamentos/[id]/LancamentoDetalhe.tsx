'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, CheckCircle, Calendar, Tag, DollarSign, FileText, User, CreditCard, AlignLeft, RotateCcw, Receipt } from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

const SELECT_COMPLETO = '*, processo:processos(id, numero_processo, titulo, cliente:clientes(nome)), advogado:profiles!advogado_id(id, nome), parcela:parcelas(numero_parcela, contrato:contratos(numero_contrato, cliente:clientes(nome)))'

export default function LancamentoDetalhe({ lancamento: inicial, perspectiva = 'admin' }: { lancamento: any, perspectiva?: 'admin' | 'advogado' }) {
  const router = useRouter()
  const [lancamento, setLancamento] = useState(inicial)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  // Para o advogado, saída do escritório = entrada para ele
  const tipoOriginal = lancamento.tipo
  const isEntrada = perspectiva === 'advogado' ? true : tipoOriginal === 'entrada'

  // nome do cliente: vem do processo quando é judicial, ou via parcela -> contrato quando é extrajudicial
  const nomeCliente = lancamento.processo?.cliente?.nome || lancamento.parcela?.contrato?.cliente?.nome

  // Aplica baixa na parcela vinculada (soma o valor; quita ou deixa parcial)
  async function aplicarBaixaParcela(supabase: any, lanc: any, userId?: string) {
    if (lanc.tipo !== 'entrada' || !lanc.parcela_id) return
    const { data: parcela } = await supabase
      .from('parcelas').select('valor_previsto, valor_pago').eq('id', lanc.parcela_id).single()
    if (!parcela) return
    const previsto = Number(parcela.valor_previsto)
    const novoPago = Number(parcela.valor_pago || 0) + Number(lanc.valor)
    const quitada = Math.round(novoPago * 100) >= Math.round(previsto * 100)
    await supabase.from('parcelas').update({
      valor_pago: novoPago,
      status: quitada ? 'pago' : 'pago_parcial', // valor válido na CHECK constraint (era 'parcial' — bug)
      data_pagamento: new Date().toISOString(),
      forma_pagamento: lanc.forma_pagamento || null,
      baixa_por: userId || null,
    }).eq('id', lanc.parcela_id)
  }

  // Reverte a baixa (subtrai o valor; recalcula status)
  async function reverterParcela(supabase: any, lanc: any) {
    if (lanc.tipo !== 'entrada' || !lanc.parcela_id) return
    const { data: parcela } = await supabase
      .from('parcelas').select('valor_previsto, valor_pago').eq('id', lanc.parcela_id).single()
    if (!parcela) return
    const previsto = Number(parcela.valor_previsto)
    const novoPago = Math.max(0, Number(parcela.valor_pago || 0) - Number(lanc.valor))
    let novoStatus: string
    if (Math.round(novoPago * 100) <= 0) novoStatus = 'pendente'
    else if (Math.round(novoPago * 100) >= Math.round(previsto * 100)) novoStatus = 'pago'
    else novoStatus = 'pago_parcial' // valor válido na CHECK constraint (era 'parcial' — bug)
    await supabase.from('parcelas').update({
      valor_pago: novoPago,
      status: novoStatus,
      // zera dados de baixa só quando a parcela volta a ficar totalmente aberta
      data_pagamento: novoStatus === 'pendente' ? null : undefined,
      baixa_por: novoStatus === 'pendente' ? null : undefined,
    }).eq('id', lanc.parcela_id)
  }

  async function darBaixa() {
    setLoading(true)
    setErro('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('lancamentos')
      .update({ status: 'realizado', data_pagamento: new Date().toISOString() })
      .eq('id', lancamento.id)
      .select(SELECT_COMPLETO)
      .single()

    if (error) { setErro(error.message); setLoading(false); return }

    // dá baixa na parcela vinculada (se houver)
    await aplicarBaixaParcela(supabase, lancamento, user?.id)

    if (data) setLancamento(data)
    setLoading(false)
    router.refresh()
  }

  async function estornar() {
    if (!window.confirm('Estornar este lançamento? Ele sairá do caixa e, se houver parcela vinculada, o valor será devolvido a ela.')) return
    setLoading(true)
    setErro('')
    const supabase = createClient()

    // 1) reverte a parcela ANTES de cancelar (usa os dados atuais do lançamento)
    await reverterParcela(supabase, lancamento)

    // 2) marca o lançamento como cancelado (mantém histórico; a view já o exclui do caixa)
    const { data, error } = await supabase
      .from('lancamentos')
      .update({ status: 'cancelado' })
      .eq('id', lancamento.id)
      .select(SELECT_COMPLETO)
      .single()

    if (error) { setErro(error.message); setLoading(false); return }
    if (data) setLancamento(data)
    setLoading(false)
    router.refresh()
  }

  const statusColor = lancamento.status === 'realizado' ? 'hsl(142 60% 55%)' : lancamento.status === 'cancelado' ? 'hsl(45 8% 45%)' : 'hsl(38 92% 60%)'
  const statusLabel = lancamento.status === 'realizado' ? 'Realizado' : lancamento.status === 'cancelado' ? 'Cancelado' : 'Previsto'

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}>
          <ArrowLeft size={15} /> Voltar
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.4rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Detalhe do Lançamento</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{lancamento.descricao}</p>
        </div>
      </div>

      {/* Card principal */}
      <div className="card-base" style={{ padding: '1.75rem', borderColor: 'hsl(43 30% 22%)', marginBottom: '1rem' }}>
        {/* Valor destaque */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: isEntrada ? 'hsl(142 60% 45% / 0.15)' : 'hsl(0 72% 51% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isEntrada ? <ArrowUpCircle size={26} color="hsl(142 60% 55%)" /> : <ArrowDownCircle size={26} color="hsl(0 72% 65%)" />}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(45 8% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
              {perspectiva === 'advogado' ? 'Recebido' : (isEntrada ? 'Entrada' : 'Saída')}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: isEntrada ? 'hsl(142 60% 55%)' : 'hsl(0 72% 65%)' }}>
              {perspectiva === 'admin' && !isEntrada ? '-' : ''}{formatCurrency(Number(lancamento.valor))}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '500', background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Campos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <Campo icon={<AlignLeft size={14} />} label="Descrição" valor={lancamento.descricao} fullWidth />
          {nomeCliente && (
            <Campo icon={<User size={14} />} label="Cliente" valor={nomeCliente} />
          )}
          <Campo icon={<Tag size={14} />} label="Categoria" valor={lancamento.categoria} />
          <Campo icon={<Calendar size={14} />} label="Data Competência" valor={formatDate(lancamento.data_competencia)} />
          {lancamento.data_pagamento && (
            <Campo icon={<CheckCircle size={14} />} label="Data de Pagamento" valor={formatDateTime(lancamento.data_pagamento)} />
          )}
          {lancamento.forma_pagamento && (
            <Campo icon={<CreditCard size={14} />} label="Forma de Pagamento" valor={lancamento.forma_pagamento.charAt(0).toUpperCase() + lancamento.forma_pagamento.slice(1)} />
          )}
          {lancamento.processo && (
            <Campo icon={<FileText size={14} />} label="Processo" valor={`${lancamento.processo.numero_processo} — ${lancamento.processo.titulo}`} fullWidth />
          )}
          {lancamento.parcela && (
            <Campo icon={<Receipt size={14} />} label="Referente a" valor={`${lancamento.parcela.contrato?.numero_contrato || 'Contrato'} — Parcela ${lancamento.parcela.numero_parcela}`} fullWidth />
          )}
          {lancamento.advogado && (
            <Campo icon={<User size={14} />} label="Advogado (Repasse)" valor={lancamento.advogado.nome} />
          )}
          {lancamento.observacoes && (
            <Campo icon={<AlignLeft size={14} />} label="Observações" valor={lancamento.observacoes} fullWidth />
          )}
        </div>
      </div>

      {erro && <div style={{ padding: '0.6rem 0.875rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)', marginBottom: '1rem' }}>{erro}</div>}

      {/* Ação de baixa */}
      {lancamento.status === 'previsto' && perspectiva === 'admin' && (
        <div className="card-base" style={{ padding: '1.25rem 1.5rem', borderColor: 'hsl(43 30% 22%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'hsl(45 20% 88%)' }}>Dar Baixa</div>
            <div style={{ fontSize: '0.8rem', color: 'hsl(45 8% 45%)', marginTop: '0.1rem' }}>Marcar como realizado{lancamento.parcela_id ? ' e baixar a parcela vinculada' : ''}</div>
          </div>
          <button onClick={darBaixa} disabled={loading} className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={14} /> {loading ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      )}

      {/* Ação de estorno */}
      {lancamento.status === 'realizado' && perspectiva === 'admin' && (
        <div className="card-base" style={{ padding: '1.25rem 1.5rem', borderColor: 'hsl(0 50% 30%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'hsl(45 20% 88%)' }}>Estornar Lançamento</div>
            <div style={{ fontSize: '0.8rem', color: 'hsl(45 8% 45%)', marginTop: '0.1rem' }}>
              Cancela o lançamento{lancamento.parcela_id ? ' e devolve o valor à parcela' : ''}
            </div>
          </div>
          <button onClick={estornar} disabled={loading} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'hsl(0 72% 65%)', borderColor: 'hsl(0 50% 35%)' }}>
            <RotateCcw size={14} /> {loading ? 'Processando...' : 'Estornar'}
          </button>
        </div>
      )}
    </div>
  )
}

function Campo({ icon, label, valor, fullWidth }: { icon: React.ReactNode, label: string, valor: string, fullWidth?: boolean }) {
  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'hsl(45 8% 40%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'hsl(45 15% 80%)', fontWeight: '500' }}>{valor || '—'}</div>
    </div>
  )
}
