'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

const labelStyle = { display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

export default function NovoProcessoForm({ clientes, advogados }: { clientes: any[], advogados: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [advSelecionados, setAdvSelecionados] = useState<{ id: string; papel: string }[]>([])
  const [form, setForm] = useState({
    numero_processo: '',
    titulo: '',
    cliente_id: '',
    tipo_processo: '',
    descricao: '',
    status: 'ativo',
    data_abertura: new Date().toISOString().split('T')[0],
    valor_total_contrato: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  function toggleAdvogado(id: string) {
    setAdvSelecionados(prev =>
      prev.find(a => a.id === id) ? prev.filter(a => a.id !== id) : [...prev, { id, papel: 'responsavel' }]
    )
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()
    const { data: processo, error } = await supabase
      .from('processos')
      .insert({
        ...form,
        tipo_processo: form.tipo_processo || null,
        valor_total_contrato: Number(form.valor_total_contrato) || 0,
      })
      .select('id').single()
    if (error) { setErro(error.message); setLoading(false); return }
    if (advSelecionados.length > 0) {
      await supabase.from('processo_advogados').insert(
        advSelecionados.map(a => ({ processo_id: processo.id, advogado_id: a.id, papel: a.papel }))
      )
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
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Novo Processo</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Preencha os dados do processo</p>
        </div>
      </div>

      <div className="card-base" style={{ padding: '1.75rem', borderColor: 'hsl(43 30% 22%)' }}>
        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="modal-grid">

            <div>
              <label style={labelStyle}>Nº do Processo *</label>
              <input className="input-base" required value={form.numero_processo} onChange={set('numero_processo')} placeholder="0000000-00.0000.0.00.0000" />
            </div>

            <div>
              <label style={labelStyle}>Tipo de Processo *</label>
              <select className="input-base" required value={form.tipo_processo} onChange={set('tipo_processo')}>
                <option value="">Selecione...</option>
                <option value="judicial">Judicial</option>
                <option value="extrajudicial">Extrajudicial</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Título *</label>
              <input className="input-base" required value={form.titulo} onChange={set('titulo')} placeholder="Descrição resumida do processo" />
            </div>

            <div>
              <label style={labelStyle}>Cliente *</label>
              <select className="input-base" required value={form.cliente_id} onChange={set('cliente_id')}>
                <option value="">Selecione o cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_empresa || c.nome}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Data de Abertura *</label>
              <input className="input-base" type="date" required value={form.data_abertura} onChange={set('data_abertura')} />
            </div>

            <div>
              <label style={labelStyle}>Valor do Contrato</label>
              <input className="input-base" type="number" step="0.01" min="0" value={form.valor_total_contrato} onChange={set('valor_total_contrato')} placeholder="R$ 0,00" />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select className="input-base" value={form.status} onChange={set('status')}>
                <option value="ativo">Ativo</option>
                <option value="suspenso">Suspenso</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Advogados Responsáveis</label>
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
              <label style={labelStyle}>Descrição</label>
              <textarea className="input-base" value={form.descricao} onChange={set('descricao')} placeholder="Detalhes do processo..." rows={3} />
            </div>

          </div>

          {erro && (
            <div style={{ padding: '0.6rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--border))' }}>
            <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Processo'}</button>
          </div>

        </form>
      </div>
    </div>
  )
}
