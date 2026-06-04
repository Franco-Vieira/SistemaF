'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const labelStyle = {
  display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)',
  marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em'
}

export default function NovoUsuarioForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', senha: '', role: 'advogado'
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  async function handleSalvar(e: React.FormEvent) {
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

    if (!res.ok) {
      setErro(data.error || 'Erro ao criar usuário')
      setLoading(false)
      return
    }

    setSucesso(`Usuário ${form.nome} criado com sucesso!`)
    setTimeout(() => {
      router.push('/usuarios')
      router.refresh()
    }, 1200)
    setLoading(false)
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => router.back()}
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}
        >
          <ArrowLeft size={15} /> Voltar
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>
            Novo Usuário
          </h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Preencha os dados do novo usuário
          </p>
        </div>
      </div>

      <div className="card-base" style={{ padding: '1.75rem', borderColor: 'hsl(43 30% 22%)' }}>
        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div>
            <label style={labelStyle}>Nome completo *</label>
            <input
              className="input-base"
              required
              value={form.nome}
              onChange={set('nome')}
              placeholder="Nome do usuário"
            />
          </div>

          <div>
            <label style={labelStyle}>E-mail *</label>
            <input
              className="input-base"
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="email@francovieira.com"
            />
          </div>

          <div>
            <label style={labelStyle}>Telefone</label>
            <input
              className="input-base"
              value={form.telefone}
              onChange={set('telefone')}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label style={labelStyle}>Senha inicial *</label>
            <input
              className="input-base"
              type="password"
              required
              minLength={8}
              value={form.senha}
              onChange={set('senha')}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label style={labelStyle}>Perfil *</label>
            <select className="input-base" value={form.role} onChange={set('role')}>
              <option value="advogado">Advogado</option>
              <option value="secretaria">Secretaria</option>
              <option value="admin">Administrador</option>
            </select>
            {form.role === 'secretaria' && (
              <p style={{ fontSize: '0.73rem', color: 'hsl(45 8% 45%)', marginTop: '0.4rem' }}>
                Acesso restrito a: Clientes, Processos e Contratos (cadastro e edição).
              </p>
            )}
            {form.role === 'advogado' && (
              <p style={{ fontSize: '0.73rem', color: 'hsl(45 8% 45%)', marginTop: '0.4rem' }}>
                Acesso restrito aos processos vinculados ao advogado.
              </p>
            )}
            {form.role === 'admin' && (
              <p style={{ fontSize: '0.73rem', color: 'hsl(45 8% 45%)', marginTop: '0.4rem' }}>
                Acesso completo a todos os módulos do sistema.
              </p>
            )}
          </div>

          {erro && (
            <div style={{ padding: '0.6rem 0.875rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>
              {erro}
            </div>
          )}

          {sucesso && (
            <div style={{ padding: '0.6rem 0.875rem', background: 'hsl(142 60% 45% / 0.1)', border: '1px solid hsl(142 60% 45% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(142 60% 55%)' }}>
              {sucesso}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--border))' }}>
            <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
            <button type="submit" className="btn-gold" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
