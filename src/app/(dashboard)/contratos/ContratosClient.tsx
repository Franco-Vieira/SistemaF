'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, X, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import { formatDate, formatCurrency, tipoContratoLabel, statusContratoLabel, statusParcelaLabel, formaPagamentoLabel } from '@/lib/utils'

interface Props { contratos: any[]; processos: any[] }

const statusContratoColor: Record<string, string> = { ativo: 'badge-success', quitado: 'badge-info', cancelado: 'badge-muted', inadimplente: 'badge-danger' }
const statusParcelaColor: Record<string, string> = { pendente: 'badge-warning', pago: 'badge-success', pago_parcial: 'badge-info', atrasado: 'badge-danger', cancelado: 'badge-muted' }

export default function ContratosClient({ contratos: initialContratos, processos }: Props) {
  const [contratos, setContratos] = useState(initialContratos)
  const [busca, setBusca] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [parcelas, setParcelas] = useState<Record<string, any[]>>({})
  const [loadingParcelas, setLoadingParcelas] = useState(false)
  const [showBaixaModal, setShowBaixaModal] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    numero_contrato: '', processo_id: '', tipo: 'parcelado', valor_total: '',
    numero_parcelas: '1', data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '', dia_vencimento: '', observacoes: '',
  })
  const [baixaForm, setBaixaForm] = useState({ valor_pago: '', forma_pagamento: 'pix', referencia: '', observacoes: '' })

  const filtrados = contratos.filter(c =>
    c.numero_contrato?.toLowerCase().includes(busca.toLowerCase()) ||
    c.processo?.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    c.processo?.numero_processo?.toLowerCase().includes(busca.toLowerCase())
  )

  async function carregarParcelas(contratoId: string) {
    if (parcelas[contratoId]) { setExpandido(expandido === contratoId ? null : contratoId); return }
    setLoadingParcelas(true)
    const supabase = createClient()
    const { data } = await supabase.from('parcelas').select('*').eq('contrato_id', contratoId).order('numero_parcela')
    setParcelas(prev => ({ ...prev, [contratoId]: data || [] }))
    setExpandido(contratoId)
    setLoadingParcelas(false)
  }

  async function handleBaixa(e: React.FormEvent) {
    e.preventDefault()
    if (!showBaixaModal) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('parcelas').update({
      valor_pago: Number(baixaForm.valor_pago),
      status: Number(baixaForm.valor_pago) >= showBaixaModal.valor_previsto ? 'pago' : 'pago_parcial',
      forma_pagamento: baixaForm.forma_pagamento,
      referencia: baixaForm.referencia,
      observacoes: baixaForm.observacoes,
      data_pagamento: new Date().toISOString(),
    }).eq('id', showBaixaModal.id)

    if (!error) {
      setParcelas(prev => ({ ...prev, [showBaixaModal.contrato_id]: (prev[showBaixaModal.contrato_id] || []).map(p => p.id === showBaixaModal.id ? { ...p, status: Number(baixaForm.valor_pago) >= showBaixaModal.valor_previsto ? 'pago' : 'pago_parcial', valor_pago: Number(baixaForm.valor_pago) } : p) }))
      setShowBaixaModal(null)
      setBaixaForm({ valor_pago: '', forma_pagamento: 'pix', referencia: '', observacoes: '' })
    }
    setLoading(false)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()
    const payload: any = { ...form, valor_total: Number(form.valor_total), numero_parcelas: Number(form.numero_parcelas), dia_vencimento: form.dia_vencimento ? Number(form.dia_vencimento) : null }
    if (!payload.data_fim) delete payload.data_fim
    if (!payload.dia_vencimento) delete payload.dia_vencimento

    const { data, error } = await supabase.from('contratos').insert(payload).select('*, processo:processos(id, numero_processo, titulo, cliente:clientes(nome))').single()
    if (error) { setErro(error.message); setLoading(false); return }
    setContratos(prev => [data, ...prev])
    setShowModal(false)
    setForm({ numero_contrato: '', processo_id: '', tipo: 'parcelado', valor_total: '', numero_parcelas: '1', data_inicio: new Date().toISOString().split('T')[0], data_fim: '', dia_vencimento: '', observacoes: '' })
    setLoading(false)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Contratos</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{contratos.length} contrato{contratos.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(45 8% 40%)' }} />
            <input className="input-base" placeholder="Buscar contrato..." value={busca} onChange={e => setBusca(e.target.value)} style={{ paddingLeft: '2.25rem', width: '220px' }} />
          </div>
          <button className="btn-gold" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={15} /> Novo Contrato
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtrados.length === 0 ? (
          <div className="card-base" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(45 8% 40%)' }}>
            {busca ? 'Nenhum contrato encontrado.' : 'Nenhum contrato cadastrado ainda.'}
          </div>
        ) : filtrados.map(c => (
          <div key={c.id} className="card-base" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => carregarParcelas(c.id)}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, auto) 1fr', gap: '1.5rem', alignItems: 'center', overflow: 'hidden' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(45 8% 40%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Contrato</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'hsl(43 72% 65%)' }}>{c.numero_contrato}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(45 8% 40%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Processo</div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(45 20% 80%)' }}>{c.processo?.numero_processo} — {c.processo?.cliente?.nome}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(45 8% 40%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Tipo</div>
                  <span className="badge badge-gold">{tipoContratoLabel[c.tipo]}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(45 8% 40%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Valor Total</div>
                  <div style={{ fontWeight: '600', color: 'hsl(45 20% 92%)' }}>{formatCurrency(Number(c.valor_total))}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(45 8% 40%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Parcelas</div>
                  <div style={{ fontSize: '0.85rem', color: 'hsl(45 8% 65%)' }}>{c.numero_parcelas}x</div>
                </div>
                <div>
                  <span className={`badge ${statusContratoColor[c.status] || 'badge-muted'}`}>{statusContratoLabel[c.status]}</span>
                </div>
              </div>
              <div style={{ color: 'hsl(45 8% 45%)' }}>
                {expandido === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expandido === c.id && (
              <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '0.75rem 1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'hsl(45 8% 40%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Parcelas</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Vencimento</th>
                        <th>Valor Previsto</th>
                        <th>Valor Pago</th>
                        <th>Status</th>
                        <th>Forma</th>
                        <th>Data Pagamento</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(parcelas[c.id] || []).map(p => (
                        <tr key={p.id}>
                          <td style={{ color: 'hsl(45 8% 55%)' }}>{p.numero_parcela}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDate(p.data_vencimento)}</td>
                          <td>{formatCurrency(Number(p.valor_previsto))}</td>
                          <td style={{ color: p.valor_pago > 0 ? 'hsl(142 60% 55%)' : 'hsl(45 8% 40%)' }}>{p.valor_pago > 0 ? formatCurrency(Number(p.valor_pago)) : '—'}</td>
                          <td><span className={`badge ${statusParcelaColor[p.status] || 'badge-muted'}`}>{statusParcelaLabel[p.status]}</span></td>
                          <td style={{ color: 'hsl(45 8% 55%)', fontSize: '0.8rem' }}>{formaPagamentoLabel[p.forma_pagamento] || '—'}</td>
                          <td style={{ color: 'hsl(45 8% 55%)', fontSize: '0.8rem' }}>{p.data_pagamento ? formatDate(p.data_pagamento) : '—'}</td>
                          <td>
                            {!['pago', 'cancelado'].includes(p.status) && (
                              <button className="btn-ghost" onClick={() => { setShowBaixaModal(p); setBaixaForm({ valor_pago: String(p.valor_previsto), forma_pagamento: 'pix', referencia: '', observacoes: '' }) }}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <CheckCircle size={12} /> Baixar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal novo contrato */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card-base animate-fade-in" style={{ width: '100%', maxWidth: '560px', maxHeight: '90dvh', overflowY: 'auto', borderColor: 'hsl(43 30% 22%)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Novo Contrato</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(45 8% 45%)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSalvar} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="modal-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nº Contrato *</label>
                  <input className="input-base" required value={form.numero_contrato} onChange={e => setForm(p => ({ ...p, numero_contrato: e.target.value }))} placeholder="CTR-001" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo *</label>
                  <select className="input-base" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                    <option value="avista">À Vista</option>
                    <option value="parcelado">Parcelado</option>
                    <option value="mensalidade">Mensalidade</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Processo *</label>
                  <select className="input-base" required value={form.processo_id} onChange={e => setForm(p => ({ ...p, processo_id: e.target.value }))}>
                    <option value="">Selecione o processo...</option>
                    {processos.map((p: any) => <option key={p.id} value={p.id}>{p.numero_processo} — {(p.cliente as any)?.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor Total *</label>
                  <input className="input-base" type="number" step="0.01" min="0" required value={form.valor_total} onChange={e => setForm(p => ({ ...p, valor_total: e.target.value }))} placeholder="R$ 0,00" />
                </div>
                {form.tipo !== 'avista' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nº de Parcelas *</label>
                    <input className="input-base" type="number" min="1" required value={form.numero_parcelas} onChange={e => setForm(p => ({ ...p, numero_parcelas: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Início *</label>
                  <input className="input-base" type="date" required value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Fim</label>
                  <input className="input-base" type="date" value={form.data_fim} onChange={e => setForm(p => ({ ...p, data_fim: e.target.value }))} />
                </div>
                {form.tipo !== 'avista' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dia de Vencimento</label>
                    <input className="input-base" type="number" min="1" max="31" value={form.dia_vencimento} onChange={e => setForm(p => ({ ...p, dia_vencimento: e.target.value }))} placeholder="Ex: 10" />
                  </div>
                )}
              </div>
              {erro && <div style={{ padding: '0.6rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>{erro}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar e Gerar Parcelas'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal baixa */}
      {showBaixaModal && (
        <div className="modal-overlay">
          <div className="card-base animate-fade-in" style={{ width: '100%', maxWidth: '420px', maxHeight: '90dvh', overflowY: 'auto', borderColor: 'hsl(43 30% 22%)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Dar Baixa — Parcela {showBaixaModal.numero_parcela}</h2>
              <button onClick={() => setShowBaixaModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(45 8% 45%)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleBaixa} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'hsl(43 30% 15%)', borderRadius: '6px', fontSize: '0.85rem', color: 'hsl(43 72% 65%)' }}>
                Valor previsto: <strong>{formatCurrency(Number(showBaixaModal.valor_previsto))}</strong>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor Pago *</label>
                <input className="input-base" type="number" step="0.01" min="0" required value={baixaForm.valor_pago} onChange={e => setBaixaForm(p => ({ ...p, valor_pago: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forma de Pagamento</label>
                <select className="input-base" value={baixaForm.forma_pagamento} onChange={e => setBaixaForm(p => ({ ...p, forma_pagamento: e.target.value }))}>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="transferencia">Transferência</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Referência</label>
                <input className="input-base" value={baixaForm.referencia} onChange={e => setBaixaForm(p => ({ ...p, referencia: e.target.value }))} placeholder="ID da transação, comprovante..." />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowBaixaModal(null)}>Cancelar</button>
                <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Confirmar Baixa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
