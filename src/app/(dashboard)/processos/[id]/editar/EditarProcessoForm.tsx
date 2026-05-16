'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function EditarProcessoForm({ processo, clientes, advogados, vinculados }: { processo: any, clientes: any[], advogados: any[], vinculados: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [advSelecionados, setAdvSelecionados] = useState<{ id: string; papel: string }[]>(
    vinculados.map(v => ({ id: v.advogado_id, papel: v.papel }))
  )
  const [form, setForm] = useState({
    numero_processo: processo.numero_processo || '',
    titulo: processo.titulo || '',
    cliente_id: processo.cliente_id || '',
    descricao: processo.descricao || '',
    status: processo.status || 'ativo',
    data_abertura: processo.data_abertura?.split('T')[0] || '',
    valor_total_contrato: processo.valor_total_contrato || '',
  })

  function toggleAdvogado(id: string) {
    setAdvSelecionados(prev => prev.find(a => a.id === id) ? prev.filter(a => a.id !== id) : [...prev, { id, papel: 'responsavel' }])
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()

    const { error } = await supabase.from('processos').update({
      ...form, valor_total_contrato: Number(form.valor_total_contrato) || 0, updated_at: new Date().toISOString()
    }).eq('id', processo.id)

    if (error) { setErro(error.message); setLoading(false); return }

    // Atualizar advogados vinculados
    await supabase.from('processo_advogados').delete().eq('processo_id', processo.id)
    if (advSelecionados.length > 0) {
      await supabase.from('processo_advogados').insert(advSelecionados.map(a => ({ processo_id: processo.id, advogado_id: a.id, papel: a.papel })))
    }

    router.push('/processos')
    router.refresh()
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}>
          <ArrowLeft size={15} /> Voltar
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Editar Processo</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{processo.numero_processo}</p>
        </div>
      </div>
      <div className="card-base" style={{ padding: '1.75rem', borderColor: 'hsl(43 30% 22%)' }}>
        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="modal-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nº do Processo *</label>
              <input className="input-base" required value={form.numero_processo} onChange={e => setForm(p => ({ ...p, numero_processo: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
              <select className="input-base" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="ativo">Ativo</option>
                <option value="encerrado">Encerrado</option>
                <option value="suspenso">Suspenso</option>
                <option value="arquivado">Arquivado</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Título *</label>
              <input className="input-base" required value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente *</label>
              <select className="input-base" required value={form.cliente_id} onChange={e => setForm(p => ({ ...p, cliente_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor do Contrato</label>
              <input className="input-base" type="number" step="0.01" min="0" value={form.valor_total_contrato} onChange={e => setForm(p => ({ ...p, valor_total_contrato: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advogados Responsáveis</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {advogados.map(a => {
                  const sel = advSelecionados.find(s => s.id === a.id)
                  return (
                    <button key={a.id} type="button" onClick={() => toggleAdvogado(a.id)}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', border: `1px solid ${sel ? 'hsl(43 72% 58%)' : 'hsl(220 10% 22%)'}`, background: sel ? 'hsl(43 30% 20%)' : 'transparent', color: sel ? 'hsl(43 72% 65%)' : 'hsl(45 8% 55%)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {a.nome}
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</label>
              <textarea className="input-base" value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={3} />
            </div>
          </div>
          {erro && <div style={{ padding: '0.6rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>{erro}</div>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--border))' }}>
            <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
