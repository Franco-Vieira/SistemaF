'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, UserCheck, UserX, Trash2, Pencil, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

interface Props { usuarios: Profile[]; adminId: string }

function getRoleLabel(role: string) {
  if (role === 'admin') return 'Administrador'
  if (role === 'secretaria') return 'Secretaria'
  return 'Advogado'
}

function getRoleBadgeClass(role: string) {
  if (role === 'admin') return 'badge badge-gold'
  if (role === 'secretaria') return 'badge badge-warning'
  return 'badge badge-info'
}

export default function UsuariosClient({ usuarios: initial, adminId }: Props) {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', email: '', senha: '' })
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [erroEdit, setErroEdit] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '', role: 'advogado' })

  const labelStyle = { display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

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
    setLoadingId(id)
    const res = await fetch('/api/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo: !ativo }),
    })
    if (res.ok) setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo: !ativo } : u))
    setLoadingId('')
  }

  function abrirEdicao(usuario: Profile) {
    setEditUser(usuario)
    setEditForm({ nome: usuario.nome, email: usuario.email, senha: '' })
    setErroEdit('')
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser) return
    setLoadingEdit(true)
    setErroEdit('')
    const payload: any = {}
    if (editForm.nome !== editUser.nome) payload.nome = editForm.nome
    if (editForm.email !== editUser.email) payload.email = editForm.email
    if (editForm.senha) payload.senha = editForm.senha
    const res = await fetch('/api/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editUser.id, ...payload }),
    })
    const data = await res.json()
    if (!res.ok) { setErroEdit(data.error || 'Erro ao atualizar'); setLoadingEdit(false); return }
    setUsuarios(prev => prev.map(u => u.id === editUser.id ? { ...u, nome: editForm.nome, email: editForm.email } : u))
    setEditUser(null)
    setLoadingEdit(false)
  }

  async function handleExcluir(usuario: Profile) {
    setLoadingId(usuario.id)
    const res = await fetch('/api/usuarios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: usuario.id }),
    })
    if (res.ok) {
      setUsuarios(prev => prev.filter(u => u.id !== usuario.id))
      setConfirmDelete(null)
    }
    setLoadingId('')
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
                  <span className={getRoleBadgeClass(u.role)}>
                    {getRoleLabel(u.role)}
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
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn-ghost" onClick={() => toggleAtivo(u.id, u.ativo)} disabled={loadingId === u.id} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {u.ativo ? <><UserX size={12} /> Desativar</> : <><UserCheck size={12} /> Ativar</>}
                      </button>
                      <button onClick={() => abrirEdicao(u)} disabled={loadingId === u.id} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: '1px solid hsl(43 40% 30%)', borderRadius: '6px', cursor: 'pointer', color: 'hsl(43 72% 58%)' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setConfirmDelete(u)} disabled={loadingId === u.id} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: '1px solid hsl(0 72% 51% / 0.4)', borderRadius: '6px', cursor: 'pointer', color: 'hsl(0 72% 65%)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal novo usuário */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card-base animate-fade-in" style={{ width: '100%', maxWidth: '460px', borderColor: 'hsl(43 30% 22%)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Novo Usuário</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(45 8% 45%)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCriar} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Nome completo *</label>
                <input className="input-base" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do usuário" />
              </div>
              <div>
                <label style={labelStyle}>E-mail *</label>
                <input className="input-base" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@francovieira.com" />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input className="input-base" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label style={labelStyle}>Senha inicial *</label>
                <input className="input-base" type="password" required minLength={8} value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label style={labelStyle}>Perfil *</label>
                <select className="input-base" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="advogado">Advogado</option>
                  <option value="secretaria">Secretaria</option>
                  <option value="admin">Administrador</option>
                </select>
                {form.role === 'secretaria' && (
                  <p style={{ fontSize: '0.73rem', color: 'hsl(45 8% 45%)', marginTop: '0.4rem' }}>
                    Acesso restrito a: Clientes, Processos e Contratos (cadastro e edição).
                  </p>
                )}
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

      {/* Modal edição */}
      {editUser && (
        <div className="modal-overlay">
          <div className="card-base animate-fade-in" style={{ width: '100%', maxWidth: '460px', borderColor: 'hsl(43 30% 22%)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(45 20% 88%)' }}>Editar Usuário</h2>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(45 8% 45%)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditar} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Nome completo</label>
                <input className="input-base" value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input className="input-base" type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Nova senha (deixe em branco para manter)</label>
                <input className="input-base" type="password" minLength={8} value={editForm.senha} onChange={e => setEditForm(p => ({ ...p, senha: e.target.value }))} placeholder="Mínimo 8 caracteres" />
              </div>
              {erroEdit && <div style={{ padding: '0.6rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>{erroEdit}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setEditUser(null)}>Cancelar</button>
                <button type="submit" className="btn-gold" disabled={loadingEdit}>{loadingEdit ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmação de exclusão */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="card-base" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', borderColor: 'hsl(0 50% 30%)' }}>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'hsl(0 72% 51% / 0.15)', border: '1px solid hsl(0 72% 51% / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={20} color="hsl(0 72% 65%)" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(45 20% 88%)', marginBottom: '0.5rem' }}>Excluir usuário?</h3>
              <p style={{ fontSize: '0.875rem', color: 'hsl(45 8% 55%)', marginBottom: '1.5rem' }}>
                Tem certeza que deseja excluir <strong style={{ color: 'hsl(45 20% 80%)' }}>{confirmDelete.nome}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                <button onClick={() => handleExcluir(confirmDelete)} disabled={loadingId === confirmDelete.id} style={{ padding: '0.5rem 1.25rem', background: 'hsl(0 72% 45%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                  {loadingId === confirmDelete.id ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
