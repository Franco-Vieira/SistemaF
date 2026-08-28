'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, X, ArrowUpCircle, ArrowDownCircle, CheckCircle, Trash2 } from 'lucide-react'
import { formatDate, formatCurrency, categoriaLancamento } from '@/lib/utils'

interface Props { lancamentos: any[]; processos: any[]; advogados: any[] }

// Nome do cliente: prioridade pro vínculo via processo (judicial); na ausência,
// resolve via parcela -> contrato -> cliente (fluxo extrajudicial).
function nomeClienteDoLancamento(l: any): string {
  return l.processo?.cliente?.nome || l.parcela?.contrato?.cliente?.nome || '—'
}

export default function LancamentosClient({ lancamentos: initial, processos, advogados }: Props) {
  const router = useRouter()
  const [lancamentos, setLancamentos] = useState(initial)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [form, setForm] = useState({
    tipo: 'entrada', categoria: '', descricao: '', valor: '',
    data_competencia: new Date().toISOString().split('T')[0],
    status: 'previsto', forma_pagamento: '', processo_id: '', advogado_id: '', referencia: '', observacoes: '',
  })

  const filtrados = lancamentos.filter(l => {
    const matchBusca = l.descricao?.toLowerCase().includes(busca.toLowerCase()) || l.categoria?.toLowerCase().includes(busca.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || l.tipo === filtroTipo
    return matchBusca && matchTipo
  })

  const totalEntradas = filtrados.filter(l => l.tipo === 'entrada' && l.status === 'realizado').reduce((s, l) => s + Number(l.valor), 0)
  const totalSaidas = filtrados.filter(l => l.tipo === 'saida' && l.status === 'realizado').reduce((s, l) => s + Number(l.valor), 0)

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()
    const payload: any = { ...form, valor: Number(form.valor) }
    if (!payload.processo_id) delete payload.processo_id
    if (!payload.advogado_id) delete payload.advogado_id
    if (!payload.forma_pagamento) delete payload.forma_pagamento
    if (payload.status === 'realizado') payload.data_pagamento = new Date().toISOString()

    const { data, error } = await supabase.from('lancamentos').insert(payload).select('*, processo:processos(numero_processo, titulo, cliente:clientes(nome)), advogado:profiles!advogado_id(nome), parcela:parcelas(numero_parcela, contrato:contratos(cliente:clientes(nome)))').single()
    if (error) { setErro(error.message); setLoading(false); return }
    setLancamentos(prev => [data, ...prev])
    setShowModal(false)
    setForm({ tipo: 'entrada', categoria: '', descricao: '', valor: '', data_competencia: new Date().toISOString().split('T')[0], status: 'previsto', forma_pagamento: '', processo_id: '', advogado_id: '', referencia: '', observacoes: '' })
    setLoading(false)
  }

  async function darBaixa(id: string) {
    const supabase = createClient()
    await supabase.from('lancamentos').update({ status: 'realizado', data_pagamento: new Date().toISOString() }).eq('id', id)
    setLancamentos(prev => prev.map(l => l.id === id ? { ...l, status: 'realizado', data_pagamento: new Date().toISOString() } : l))
  }

  async function handleDeletar(lancamento: any) {
    setLoadingDelete(true)
    const supabase = createClient()
    const { error } = await supabase.from('lancamentos').delete().eq('id', lancamento.id)
    if (error) {
      alert('Não foi possível excluir: ' + error.message)
      setLoadingDelete(false)
      return
    }
    setLancamentos(prev => prev.filter(l => l.id !== lancamento.id))
    setConfirmDelete(null)
    setLoadingDelete(false)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Lançamentos</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Entradas e saídas do escritório</p>
        </div>
        <button className="btn-gold" onClick={() => router.push('/lancamentos/novo')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={15} /> Novo Lançamento
        </button>
      </div>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Entradas Realizadas', value: totalEntradas, color: 'hsl(142 60% 55%)', icon: ArrowUpCircle },
          { label: 'Saídas Realizadas', value: totalSaidas, color: 'hsl(0 72% 65%)', icon: ArrowDownCircle },
          { label: 'Saldo', value: totalEntradas - totalSaidas, color: totalEntradas - totalSaidas >= 0 ? 'hsl(142 60% 55%)' : 'hsl(0 72% 65%)', icon: totalEntradas - totalSaidas >= 0 ? ArrowUpCircle : ArrowDownCircle },
        ].map(card => (
          <div key={card.label} className="card-base" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <card.icon size={22} color={card.color} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'hsl(45 8% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: card.color }}>{formatCurrency(card.value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(45 8% 40%)' }} />
          <input className="input-base" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} style={{ paddingLeft: '2.25rem', width: '200px' }} />
        </div>
        {(['todos', 'entrada', 'saida'] as const).map(t => (
          <button key={t} onClick={() => setFiltroTipo(t)}
            style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: `1px solid ${filtroTipo === t ? 'hsl(43 72% 58%)' : 'hsl(220 10% 22%)'}`, background: filtroTipo === t ? 'hsl(43 30% 18%)' : 'transparent', color: filtroTipo === t ? 'hsl(43 72% 65%)' : 'hsl(45 8% 55%)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}>
            {t === 'todos' ? 'Todos' : t === 'entrada' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      <div className="card-base" style={{ overflowX: 'auto' }}>
        <table className="table-base">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Data</th>
              <th>Descrição</th>
              <th>Cliente</th>
              <th>Categoria</th>
              <th>Processo</th>
              <th>Valor</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'hsl(45 8% 40%)', padding: '3rem' }}>Nenhum lançamento encontrado.</td></tr>
            ) : filtrados.map(l => (
              <tr key={l.id} onClick={() => router.push(`/lancamentos/${l.id}`)} style={{ cursor: 'pointer' }}>
                <td>
                  {l.tipo === 'entrada'
                    ? <ArrowUpCircle size={16} color="hsl(142 60% 55%)" />
                    : <ArrowDownCircle size={16} color="hsl(0 72% 65%)" />}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(45 8% 60%)' }}>{formatDate(l.data_competencia)}</td>
                <td style={{ fontWeight: '500', maxWidth: '200px' }}>{l.descricao}</td>
                <td style={{ color: 'hsl(45 20% 85%)', fontSize: '0.8rem' }}>{nomeClienteDoLancamento(l)}</td>
                <td style={{ color: 'hsl(45 8% 55%)', fontSize: '0.8rem' }}>{l.categoria}</td>
                <td style={{ color: 'hsl(43 72% 58%)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{l.processo?.numero_processo || '—'}</td>
                <td style={{ fontWeight: '600', color: l.tipo === 'entrada' ? 'hsl(142 60% 55%)' : 'hsl(0 72% 65%)' }}>
                  {l.tipo === 'saida' ? '-' : ''}{formatCurrency(Number(l.valor))}
                </td>
                <td>
                  <span className={`badge ${l.status === 'realizado' ? 'badge-success' : l.status === 'cancelado' ? 'badge-muted' : 'badge-warning'}`}>
                    {l.status === 'realizado' ? 'Realizado' : l.status === 'cancelado' ? 'Cancelado' : 'Previsto'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {l.status === 'previsto' && (
                      <button onClick={(e) => { e.stopPropagation(); darBaixa(l.id) }} className="btn-ghost"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle size={12} /> Baixar
                      </button>
                    )}
                    {l.status === 'cancelado' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(l) }}
                        title="Excluir do histórico"
                        style={{ padding: '0.25rem 0.5rem', background: 'none', border: '1px solid hsl(0 72% 51% / 0.4)', borderRadius: '6px', cursor: 'pointer', color: 'hsl(0 72% 65%)', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="card-base animate-fade-in" style={{ width: '100%', maxWidth: '560px', borderColor: 'hsl(43 30% 22%)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Novo Lançamento</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(45 8% 45%)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSalvar} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="modal-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo *</label>
                  <select className="input-base" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Competência *</label>
                  <input className="input-base" type="date" required value={form.data_competencia} onChange={e => setForm(p => ({ ...p, data_competencia: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição *</label>
                  <input className="input-base" required value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição do lançamento" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoria *</label>
                  <select className="input-base" required value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {categoriaLancamento.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor *</label>
                  <input className="input-base" type="number" step="0.01" min="0" required value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} placeholder="R$ 0,00" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                  <select className="input-base" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="previsto">Previsto</option>
                    <option value="realizado">Realizado</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Processo</label>
                  <select className="input-base" value={form.processo_id} onChange={e => setForm(p => ({ ...p, processo_id: e.target.value }))}>
                    <option value="">Nenhum</option>
                    {processos.map((p: any) => <option key={p.id} value={p.id}>{p.numero_processo}</option>)}
                  </select>
                </div>
                {form.tipo === 'saida' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advogado (Repasse)</label>
                    <select className="input-base" value={form.advogado_id} onChange={e => setForm(p => ({ ...p, advogado_id: e.target.value }))}>
                      <option value="">Nenhum</option>
                      {advogados.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {erro && <div style={{ padding: '0.6rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>{erro}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Lançamento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="card-base" style={{ width: '100%', maxWidth: '400px', borderColor: 'hsl(0 50% 30%)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'hsl(0 72% 51% / 0.15)', border: '1px solid hsl(0 72% 51% / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={20} color="hsl(0 72% 65%)" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(45 20% 88%)', marginBottom: '0.5rem' }}>Excluir do histórico?</h3>
              <p style={{ fontSize: '0.875rem', color: 'hsl(45 8% 55%)', marginBottom: '1.5rem' }}>
                O lançamento <strong style={{ color: 'hsl(45 20% 80%)' }}>{confirmDelete.descricao}</strong> será apagado permanentemente. Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                <button onClick={() => handleDeletar(confirmDelete)} disabled={loadingDelete} style={{ padding: '0.5rem 1.25rem', background: 'hsl(0 72% 45%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                  {loadingDelete ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
