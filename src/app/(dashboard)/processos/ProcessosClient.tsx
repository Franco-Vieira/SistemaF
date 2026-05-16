'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, X, FolderOpen, Pencil } from 'lucide-react'
import { formatDate, statusProcessoLabel, formatCurrency } from '@/lib/utils'

interface Props { processos: any[]; clientes: any[]; advogados: any[] }

const statusColors: Record<string, string> = {
  ativo: 'badge-success', encerrado: 'badge-muted', suspenso: 'badge-warning', arquivado: 'badge-muted'
}

export default function ProcessosClient({ processos: initialProcessos, clientes, advogados }: Props) {
  const router = useRouter()
  const [processos, setProcessos] = useState(initialProcessos)
  const [busca, setBusca] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [advSelecionados, setAdvSelecionados] = useState<{ id: string; papel: string }[]>([])
  const [form, setForm] = useState({
    numero_processo: '', titulo: '', cliente_id: '', descricao: '',
    status: 'ativo', data_abertura: new Date().toISOString().split('T')[0], valor_total_contrato: '',
  })

  const filtrados = processos.filter(p =>
    p.numero_processo?.toLowerCase().includes(busca.toLowerCase()) ||
    p.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    p.cliente?.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  function toggleAdvogado(id: string) {
    setAdvSelecionados(prev => {
      const exists = prev.find(a => a.id === id)
      if (exists) return prev.filter(a => a.id !== id)
      return [...prev, { id, papel: 'responsavel' }]
    })
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()

    const { data: processo, error } = await supabase
      .from('processos')
      .insert({ ...form, valor_total_contrato: Number(form.valor_total_contrato) || 0 })
      .select('*, cliente:clientes(id, nome)')
      .single()

    if (error) { setErro(error.message); setLoading(false); return }

    // Vincula advogados
    if (advSelecionados.length > 0) {
      await supabase.from('processo_advogados').insert(
        advSelecionados.map(a => ({ processo_id: processo.id, advogado_id: a.id, papel: a.papel }))
      )
    }

    setProcessos(prev => [{ ...processo, processo_advogados: advSelecionados }, ...prev])
    setShowModal(false)
    setForm({ numero_processo: '', titulo: '', cliente_id: '', descricao: '', status: 'ativo', data_abertura: new Date().toISOString().split('T')[0], valor_total_contrato: '' })
    setAdvSelecionados([])
    setLoading(false)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Processos</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{processos.length} processo{processos.length !== 1 ? 's' : ''} cadastrado{processos.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(45 8% 40%)' }} />
            <input className="input-base" placeholder="Buscar processo..." value={busca} onChange={e => setBusca(e.target.value)} style={{ paddingLeft: '2.25rem', width: '220px' }} />
          </div>
          <button className="btn-gold" onClick={() => router.push('/processos/novo')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={15} /> Novo Processo
          </button>
        </div>
      </div>

      <div className="card-base" style={{ overflowX: 'auto' }}>
        <table className="table-base">
          <thead>
            <tr>
              <th>Nº Processo</th>
              <th>Título</th>
              <th>Cliente</th>
              <th>Advogados</th>
              <th>Status</th>
              <th>Abertura</th>
              <th>Valor Contrato</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'hsl(45 8% 40%)', padding: '3rem' }}>
                {busca ? 'Nenhum processo encontrado.' : 'Nenhum processo cadastrado ainda.'}
              </td></tr>
            ) : filtrados.map(p => (
              <tr key={p.id}>
                <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(43 72% 58%)' }}>{p.numero_processo}</span></td>
                <td style={{ fontWeight: '500', maxWidth: '200px' }}>{p.titulo}</td>
                <td style={{ color: 'hsl(45 8% 65%)' }}>{p.cliente?.nome || '-'}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {p.processo_advogados?.length > 0
                      ? p.processo_advogados.map((pa: any) => (
                          <span key={pa.advogado_id} className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
                            {pa.advogado?.nome?.split(' ')[0] || '—'}
                          </span>
                        ))
                      : <span style={{ color: 'hsl(45 8% 40%)', fontSize: '0.8rem' }}>—</span>
                    }
                  </div>
                </td>
                <td><span className={`badge ${statusColors[p.status] || 'badge-muted'}`}>{statusProcessoLabel[p.status]}</span></td>
                <td style={{ color: 'hsl(45 8% 55%)', fontSize: '0.8rem' }}>{formatDate(p.data_abertura)}</td>
                <td style={{ fontWeight: '500' }}>{p.valor_total_contrato > 0 ? formatCurrency(p.valor_total_contrato) : '—'}</td>
                <td>
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/processos/${p.id}/editar`) }}
                    style={{ padding: '0.25rem 0.5rem', background: 'none', border: '1px solid hsl(43 40% 30%)', borderRadius: '6px', cursor: 'pointer', color: 'hsl(43 72% 58%)', display: 'flex', alignItems: 'center' }}
                  >
                    <Pencil size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="card-base animate-fade-in" style={{ width: '100%', maxWidth: '600px', borderColor: 'hsl(43 30% 22%)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Novo Processo</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(45 8% 45%)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSalvar} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="modal-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nº do Processo *</label>
                  <input className="input-base" required value={form.numero_processo} onChange={e => setForm(p => ({ ...p, numero_processo: e.target.value }))} placeholder="0000000-00.0000.0.00.0000" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data de Abertura *</label>
                  <input className="input-base" type="date" required value={form.data_abertura} onChange={e => setForm(p => ({ ...p, data_abertura: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Título *</label>
                  <input className="input-base" required value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Descrição resumida do processo" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente *</label>
                  <select className="input-base" required value={form.cliente_id} onChange={e => setForm(p => ({ ...p, cliente_id: e.target.value }))}>
                    <option value="">Selecione o cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor do Contrato</label>
                  <input className="input-base" type="number" step="0.01" min="0" value={form.valor_total_contrato} onChange={e => setForm(p => ({ ...p, valor_total_contrato: e.target.value }))} placeholder="R$ 0,00" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advogados Responsáveis</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {advogados.map(a => {
                      const sel = advSelecionados.find(s => s.id === a.id)
                      return (
                        <button key={a.id} type="button" onClick={() => toggleAdvogado(a.id)}
                          style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', border: `1px solid ${sel ? 'hsl(43 72% 58%)' : 'hsl(220 10% 22%)'}`, background: sel ? 'hsl(43 30% 20%)' : 'transparent', color: sel ? 'hsl(43 72% 65%)' : 'hsl(45 8% 55%)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                          {a.nome}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</label>
                  <textarea className="input-base" value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Detalhes do processo..." rows={3} />
                </div>
              </div>
              {erro && <div style={{ padding: '0.6rem 0.875rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>{erro}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Processo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
