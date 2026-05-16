'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function EditarClienteForm({ cliente, advogados }: { cliente: any, advogados: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: cliente.nome || '', telefone: cliente.telefone || '', email: cliente.email || '',
    endereco: cliente.endereco || '', cidade: cliente.cidade || '', estado: cliente.estado || '',
    origem: cliente.origem || 'escritorio', advogado_origem_id: cliente.advogado_origem_id || '',
    observacoes: cliente.observacoes || '',
  })

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()
    const payload: any = { ...form, updated_at: new Date().toISOString() }
    if (payload.origem === 'escritorio') payload.advogado_origem_id = null
    if (!payload.advogado_origem_id) payload.advogado_origem_id = null

    const { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id)
    if (error) { setErro(error.message); setLoading(false); return }
    router.push('/clientes')
    router.refresh()
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}>
          <ArrowLeft size={15} /> Voltar
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Editar Cliente</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{cliente.nome}</p>
        </div>
      </div>
      <div className="card-base" style={{ padding: '1.75rem', borderColor: 'hsl(43 30% 22%)' }}>
        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="modal-grid">
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome completo *</label>
              <input className="input-base" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telefone</label>
              <input className="input-base" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail</label>
              <input className="input-base" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endereço</label>
              <input className="input-base" value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cidade</label>
              <input className="input-base" value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</label>
              <input className="input-base" value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} maxLength={2} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Origem</label>
              <select className="input-base" value={form.origem} onChange={e => setForm(p => ({ ...p, origem: e.target.value }))}>
                <option value="escritorio">Escritório (Franco & Vieira)</option>
                <option value="advogado_associado">Advogado Associado</option>
              </select>
            </div>
            {form.origem === 'advogado_associado' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advogado Responsável</label>
                <select className="input-base" value={form.advogado_origem_id} onChange={e => setForm(p => ({ ...p, advogado_origem_id: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {advogados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações</label>
              <textarea className="input-base" value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={3} />
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
