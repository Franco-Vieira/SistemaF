'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const labelStyle = { display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const sectionTitle = { fontSize: '0.7rem', fontWeight: '600' as const, color: 'hsl(43 72% 58%)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '1rem' }

export default function NovoClienteForm({ advogados }: { advogados: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome_empresa: '',
    telefone: '',
    email: '',
    endereco: '',
    numero: '',
    complemento: '',
    cep: '',
    nome_responsavel: '',
    telefone_responsavel: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    tipo_processo: '',
    origem: 'escritorio',
    advogado_origem_id: '',
    observacoes: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()
    const payload: any = {
      nome: form.nome_empresa,
      nome_empresa: form.nome_empresa,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: form.endereco || null,
      numero: form.numero || null,
      complemento: form.complemento || null,
      cep: form.cep || null,
      nome_responsavel: form.nome_responsavel || null,
      telefone_responsavel: form.telefone_responsavel || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      pais: form.pais,
      tipo_processo: form.tipo_processo || null,
      origem: form.origem,
      observacoes: form.observacoes || null,
    }
    if (form.origem === 'advogado_associado' && form.advogado_origem_id) {
      payload.advogado_origem_id = form.advogado_origem_id
    }

    const { error } = await supabase.from('clientes').insert(payload)
    if (error) { setErro(error.message); setLoading(false); return }
    router.push('/clientes')
    router.refresh()
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}>
          <ArrowLeft size={15} /> Voltar
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Novo Cliente</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Preencha os dados cadastrais do cliente</p>
        </div>
      </div>

      <div className="card-base" style={{ padding: '1.75rem', borderColor: 'hsl(43 30% 22%)' }}>
        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── DADOS DA EMPRESA ── */}
          <div>
            <p style={sectionTitle}>Dados da Empresa</p>
            <div className="modal-grid">
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Nome da Empresa *</label>
                <input className="input-base" required value={form.nome_empresa} onChange={set('nome_empresa')} placeholder="Razão social ou nome fantasia" />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input className="input-base" value={form.telefone} onChange={set('telefone')} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input className="input-base" type="email" value={form.email} onChange={set('email')} placeholder="email@empresa.com" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Tipo de Processo</label>
                <select className="input-base" value={form.tipo_processo} onChange={set('tipo_processo')}>
                  <option value="">Selecione...</option>
                  <option value="judicial">Judicial</option>
                  <option value="extrajudicial">Extrajudicial</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── ENDEREÇO ── */}
          <div>
            <p style={sectionTitle}>Endereço</p>
            <div className="modal-grid">
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Endereço</label>
                <input className="input-base" value={form.endereco} onChange={set('endereco')} placeholder="Rua, Avenida, etc." />
              </div>
              <div>
                <label style={labelStyle}>Número</label>
                <input className="input-base" value={form.numero} onChange={set('numero')} placeholder="Nº" />
              </div>
              <div>
                <label style={labelStyle}>Complemento</label>
                <input className="input-base" value={form.complemento} onChange={set('complemento')} placeholder="Sala, Andar (opcional)" />
              </div>
              <div>
                <label style={labelStyle}>CEP</label>
                <input className="input-base" value={form.cep} onChange={set('cep')} placeholder="00000-000" />
              </div>
              <div>
                <label style={labelStyle}>Cidade</label>
                <input className="input-base" value={form.cidade} onChange={set('cidade')} placeholder="Cidade" />
              </div>
              <div>
                <label style={labelStyle}>Estado</label>
                <select className="input-base" value={form.estado} onChange={set('estado')}>
                  <option value="">Selecione...</option>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>País</label>
                <input className="input-base" value={form.pais} onChange={set('pais')} placeholder="País" />
              </div>
            </div>
          </div>

          {/* ── RESPONSÁVEL ── */}
          <div>
            <p style={sectionTitle}>Responsável pelo Contato</p>
            <div className="modal-grid">
              <div>
                <label style={labelStyle}>Nome do Responsável</label>
                <input className="input-base" value={form.nome_responsavel} onChange={set('nome_responsavel')} placeholder="Nome completo" />
              </div>
              <div>
                <label style={labelStyle}>Telefone do Responsável</label>
                <input className="input-base" value={form.telefone_responsavel} onChange={set('telefone_responsavel')} placeholder="(00) 00000-0000" />
              </div>
            </div>
          </div>

          {/* ── ORIGEM ── */}
          <div>
            <p style={sectionTitle}>Origem</p>
            <div className="modal-grid">
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Origem *</label>
                <select className="input-base" value={form.origem} onChange={set('origem')}>
                  <option value="escritorio">Escritório (Franco & Vieira)</option>
                  <option value="advogado_associado">Advogado Associado</option>
                </select>
              </div>
              {form.origem === 'advogado_associado' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Advogado Responsável *</label>
                  <select className="input-base" required value={form.advogado_origem_id} onChange={set('advogado_origem_id')}>
                    <option value="">Selecione o advogado...</option>
                    {advogados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Observações</label>
                <textarea className="input-base" value={form.observacoes} onChange={set('observacoes')} placeholder="Observações adicionais..." rows={3} />
              </div>
            </div>
          </div>

          {erro && (
            <div style={{ padding: '0.6rem 0.875rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--border))' }}>
            <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Cliente'}</button>
          </div>

        </form>
      </div>
    </div>
  )
}
