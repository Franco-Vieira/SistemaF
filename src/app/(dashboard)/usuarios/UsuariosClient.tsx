'use client'

import { useState } from 'react'
import { Plus, X, UserCheck, UserX } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

interface Props { usuarios: Profile[]; adminId: string }

export default function UsuariosClient({ usuarios: initial, adminId }: Props) {
  const [usuarios, setUsuarios] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '', role: 'advogado' })

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    setSucesso('')

    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) { setErro(data.error || 'Erro ao criar usuário'); setLoading(false); return }

    setSucesso(`Usuário ${form.nome} criado com sucesso!`)
    setUsuarios(prev => [...prev, data.profile])
    setForm({ nome: '', email: '', telefone: '', senha: '', role: 'advogado' })
    setTimeout(() => { setShowModal(false); setSucesso('') }, 1500)
    setLoading(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    const res = await fetch('/api/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo: !ativo }),
    })
    if (res.ok) setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo: !ativo } : u))
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Usuários</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} no sistema</p>
        </div>
        <button className="btn-gold" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={15} /> Novo Usuário
        </button>
      </div>

      <div className="card-base" style={{ overflowX: 'auto' }}>
        <table className="table-base">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'hsl(43 30% 18%)', border: '1px solid hsl(43 40% 30%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(43 72% 58%)', flexShrink: 0 }}>
                      {u.nome?.charAt(0)?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '500' }}>{u.nome}</span>
                    {u.id === adminId && <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>Você</span>}
                  </div>
                </td>
                <td style={{ color: 'hsl(45 8% 60%)' }}>{u.email}</td>
                <td style={{ color: 'hsl(45 8% 60%)' }}>{u.telefone || '—'}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-info'}`}>
                    {u.role === 'admin' ? 'Administrador' : 'Advogado'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.ativo ? 'badge-success' : 'badge-danger'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ color: 'hsl(45 8% 50%)', fontSize: '0.8rem' }}>{formatDate(u.created_at)}</td>
                <td>
                  {u.id !== adminId && (
                    <button className="btn-ghost" onClick={() => toggleAtivo(u.id, u.ativo)}
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {u.ativo ? <><UserX size={12} /> Desativar</> : <><UserCheck size={12} /> Ativar</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card-base animate-fade-in" style={{ width: '100%', maxWidth: '460px', borderColor: 'hsl(43 30% 22%)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Novo Usuário</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(45 8% 45%)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCriar} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome completo *</label>
                <input className="input-base" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do usuário" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail *</label>
                <input className="input-base" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@francovieira.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telefone</label>
                <input className="input-base" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha inicial *</label>
                <input className="input-base" type="password" required minLength={8} value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Perfil *</label>
                <select className="input-base" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="advogado">Advogado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {erro && <div style={{ padding: '0.6rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>{erro}</div>}
              {sucesso && <div style={{ padding: '0.6rem', background: 'hsl(142 60% 45% / 0.1)', border: '1px solid hsl(142 60% 45% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(142 60% 55%)' }}>{sucesso}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Criando...' : 'Criar Usuário'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
