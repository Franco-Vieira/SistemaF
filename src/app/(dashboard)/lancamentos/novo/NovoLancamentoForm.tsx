'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import { categoriaLancamento } from '@/lib/utils'

export default function NovoLancamentoForm({ processos, advogados }: { processos: any[], advogados: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    tipo: 'entrada', categoria: '', descricao: '', valor: '',
    data_competencia: new Date().toISOString().split('T')[0],
    status: 'previsto', forma_pagamento: '', processo_id: '', advogado_id: '', referencia: '', observacoes: '',
  })

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()
    const payload: any = { ...form, valor: Number(form.valor) }
    if (!payload.processo_id) delete payload.processo_id
    if (!payload.advogado_id) delete payload.advogado_id
    if (!payload.forma_pagamento) delete payload.forma_pagamento
    if (!payload.referencia) delete payload.referencia
    if (payload.status === 'realizado') payload.data_pagamento = new Date().toISOString()
    const { error } = await supabase.from('lancamentos').insert(payload)
    if (error) { setErro(error.message); setLoading(false); return }
    router.push('/lancamentos')
    router.refresh()
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}>
          <ArrowLeft size={15} /> Voltar
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Novo Lançamento</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Registre uma entrada ou saída</p>
        </div>
      </div>
      <div className="card-base" style={{ padding: '1.75rem', borderColor: 'hsl(43 30% 22%)' }}>
        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              <input className="input-base" type="number" step="0.01" min="0" required value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} placeholder="0,00" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
              <select className="input-base" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="previsto">Previsto</option>
                <option value="realizado">Realizado</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forma de Pagamento</label>
              <select className="input-base" value={form.forma_pagamento} onChange={e => setForm(p => ({ ...p, forma_pagamento: e.target.value }))}>
                <option value="">Selecione...</option>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
                <option value="boleto">Boleto</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
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
            {form.advogado_id && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Referência do Pagamento *
                  <span style={{ color: 'hsl(43 72% 58%)', marginLeft: '0.4rem', fontWeight: 400 }}>(obrigatório ao vincular advogado)</span>
                </label>
                <input className="input-base" required value={form.referencia} onChange={e => setForm(p => ({ ...p, referencia: e.target.value }))} placeholder="Ex: Honorários maio/2026, Repasse processo 001..." />
              </div>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações</label>
              <textarea className="input-base" value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} placeholder="Observações adicionais..." rows={2} />
            </div>
          </div>
          {erro && <div style={{ padding: '0.6rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>{erro}</div>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--border))' }}>
            <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Lançamento'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
