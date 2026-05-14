'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, X, User, Phone, Mail, MapPin, FileText, ChevronDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Cliente, Profile } from '@/types'

interface Props {
  clientes: any[]
  advogados: Pick<Profile, 'id' | 'nome'>[]
}

export default function ClientesClient({ clientes: initialClientes, advogados }: Props) {
  const [clientes, setClientes] = useState(initialClientes)
  const [busca, setBusca] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '', telefone: '', email: '', endereco: '', cidade: '', estado: '', cep: '',
    origem: 'escritorio', advogado_origem_id: '', observacoes: '',
  })

  const filtrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.email?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca)
  )

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()
    const payload: any = { ...form }
    if (payload.origem === 'escritorio') delete payload.advogado_origem_id
    if (!payload.advogado_origem_id) delete payload.advogado_origem_id

    const { data, error } = await supabase.from('clientes').insert(payload).select('*, advogado_origem:profiles!advogado_origem_id(id, nome)').single()
    if (error) { setErro(error.message); setLoading(false); return }
    setClientes(prev => [data, ...prev])
    setShowModal(false)
    setForm({ nome: '', telefone: '', email: '', endereco: '', cidade: '', estado: '', cep: '', origem: 'escritorio', advogado_origem_id: '', observacoes: '' })
    setLoading(false)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Clientes</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(45 8% 40%)' }} />
            <input className="input-base" placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} style={{ paddingLeft: '2.25rem', width: '220px' }} />
          </div>
          <button className="btn-gold" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={15} /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="card-base" style={{ overflowX: 'auto' }}>
        <table className="table-base">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>Cidade</th>
              <th>Origem</th>
              <th>Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'hsl(45 8% 40%)', padding: '3rem' }}>
                {busca ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado ainda.'}
              </td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'hsl(43 30% 18%)', border: '1px solid hsl(43 40% 30%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(43 72% 58%)', flexShrink: 0 }}>
                      {c.nome?.charAt(0)?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '500' }}>{c.nome}</span>
                  </div>
                </td>
                <td style={{ color: 'hsl(45 8% 60%)' }}>{c.telefone || '-'}</td>
                <td style={{ color: 'hsl(45 8% 60%)' }}>{c.email || '-'}</td>
                <td style={{ color: 'hsl(45 8% 60%)' }}>{c.cidade ? `${c.cidade}/${c.estado}` : '-'}</td>
                <td>
                  <span className={`badge ${c.origem === 'escritorio' ? 'badge-gold' : 'badge-info'}`}>
                    {c.origem === 'escritorio' ? 'Escritório' : c.advogado_origem?.nome || 'Advogado Assoc.'}
                  </span>
                </td>
                <td style={{ color: 'hsl(45 8% 50%)', fontSize: '0.8rem' }}>{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal cadastro */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
          <div className="card-base animate-fade-in" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', borderColor: 'hsl(43 30% 22%)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Novo Cliente</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(45 8% 45%)', padding: '0.25rem' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSalvar} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome completo *</label>
                  <input className="input-base" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do cliente" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telefone</label>
                  <input className="input-base" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail</label>
                  <input className="input-base" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endereço</label>
                  <input className="input-base" value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, número, complemento" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cidade</label>
                  <input className="input-base" value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} placeholder="Cidade" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</label>
                  <input className="input-base" value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} placeholder="UF" maxLength={2} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Origem *</label>
                  <select className="input-base" value={form.origem} onChange={e => setForm(p => ({ ...p, origem: e.target.value }))}>
                    <option value="escritorio">Escritório (Franco & Vieira)</option>
                    <option value="advogado_associado">Advogado Associado</option>
                  </select>
                </div>
                {form.origem === 'advogado_associado' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advogado Responsável *</label>
                    <select className="input-base" required value={form.advogado_origem_id} onChange={e => setForm(p => ({ ...p, advogado_origem_id: e.target.value }))}>
                      <option value="">Selecione o advogado...</option>
                      {advogados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações</label>
                  <textarea className="input-base" value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} placeholder="Observações adicionais..." rows={3} />
                </div>
              </div>

              {erro && <div style={{ padding: '0.6rem 0.875rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>{erro}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
