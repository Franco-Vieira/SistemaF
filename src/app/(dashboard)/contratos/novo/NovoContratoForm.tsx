'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

// Calcula a data de vencimento da 1ª parcela de um contrato Mensal.
function primeiroVencimentoMensal(dataInicio: string, diaVencimento: number): string {
  const [ano, mes, dia] = dataInicio.split('-').map(Number)
  let anoAlvo = ano
  let mesAlvo = mes
  if (dia > diaVencimento) {
    mesAlvo += 1
    if (mesAlvo > 12) { mesAlvo = 1; anoAlvo += 1 }
  }
  const ultimoDiaDoMes = new Date(anoAlvo, mesAlvo, 0).getDate()
  const diaFinal = Math.min(diaVencimento, ultimoDiaDoMes)
  return `${anoAlvo}-${String(mesAlvo).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`
}

interface Cliente { id: string; nome: string; nome_empresa: string | null; tipo_processo: string | null }
interface Processo { id: string; numero_processo: string; titulo: string; cliente_id: string }

export default function NovoContratoForm({ clientes, processos }: { clientes: Cliente[], processos: Processo[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    numero_contrato: '', cliente_id: '', processo_id: '', tipo: 'mensalidade', valor_total: '',
    numero_parcelas: '1', data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '', dia_vencimento: '', data_vencimento_fixo: '', observacoes: '',
  })

  const isMensal = form.tipo === 'mensalidade'
  const isFixo = form.tipo === 'avista'

  const clienteSelecionado = useMemo(
    () => clientes.find(c => c.id === form.cliente_id) || null,
    [clientes, form.cliente_id]
  )
  const isJudicial = clienteSelecionado?.tipo_processo === 'judicial'
  const isExtrajudicial = clienteSelecionado?.tipo_processo === 'extrajudicial'

  const processosDoCliente = useMemo(
    () => processos.filter(p => p.cliente_id === form.cliente_id),
    [processos, form.cliente_id]
  )

  function handleClienteChange(clienteId: string) {
    setForm(p => ({ ...p, cliente_id: clienteId, processo_id: '' }))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!form.cliente_id) { setErro('Selecione um cliente.'); return }
    if (isJudicial && !form.processo_id) { setErro('Este cliente é Judicial: selecione o processo vinculado ao contrato.'); return }

    setLoading(true)
    const supabase = createClient()

    const payload: any = {
      numero_contrato: form.numero_contrato,
      cliente_id: form.cliente_id,
      processo_id: isJudicial ? form.processo_id : null,
      tipo: form.tipo,
      valor_total: Number(form.valor_total),
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
      observacoes: form.observacoes || null,
      dia_vencimento: isMensal ? Number(form.dia_vencimento) : null,
      data_vencimento_fixo: isFixo ? form.data_vencimento_fixo : null,
      numero_parcelas: isMensal ? Number(form.numero_parcelas) : 1,
    }

    const { data: contrato, error } = await supabase.from('contratos').insert(payload).select('id, processo_id').single()
    if (error) { setErro(error.message); setLoading(false); return }

    // ── Gera a 1ª parcela do contrato (o "a receber" começa a existir aqui) ──
    const dataVencimentoParcela1 = isFixo
      ? form.data_vencimento_fixo
      : primeiroVencimentoMensal(form.data_inicio, Number(form.dia_vencimento))

    const { error: errParcela } = await supabase.from('parcelas').insert({
      contrato_id: contrato.id,
      processo_id: contrato.processo_id, // null quando extrajudicial — coluna já aceita null
      numero_parcela: 1,
      valor_previsto: Number(form.valor_total),
      valor_pago: 0,
      data_vencimento: dataVencimentoParcela1,
      status: 'pendente',
    })
    if (errParcela) {
      setErro('Contrato salvo, mas houve erro ao gerar a 1ª parcela: ' + errParcela.message)
      setLoading(false)
      return
    }

    router.push('/contratos')
    router.refresh()
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}>
          <ArrowLeft size={15} /> Voltar
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Novo Contrato</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Preencha os dados do contrato</p>
        </div>
      </div>
      <div className="card-base" style={{ padding: '1.75rem', borderColor: 'hsl(43 30% 22%)' }}>
        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="modal-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nº Contrato *</label>
              <input className="input-base" required value={form.numero_contrato} onChange={e => setForm(p => ({ ...p, numero_contrato: e.target.value }))} placeholder="CTR-001" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modalidade *</label>
              <select className="input-base" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                <option value="mensalidade">Mensal</option>
                <option value="avista">Fixo</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente *</label>
              <select className="input-base" required value={form.cliente_id} onChange={e => handleClienteChange(e.target.value)}>
                <option value="">Selecione o cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome_empresa || c.nome} {c.tipo_processo ? `— ${c.tipo_processo === 'judicial' ? 'Judicial' : 'Extrajudicial'}` : '(tipo não definido)'}
                  </option>
                ))}
              </select>
              {clienteSelecionado && !clienteSelecionado.tipo_processo && (
                <p style={{ fontSize: '0.75rem', color: 'hsl(0 72% 65%)', marginTop: '0.4rem' }}>
                  Este cliente não tem "Tipo de Processo" definido. Edite o cadastro dele antes de continuar.
                </p>
              )}
            </div>

            {isJudicial && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Processo *</label>
                <select className="input-base" required value={form.processo_id} onChange={e => setForm(p => ({ ...p, processo_id: e.target.value }))}>
                  <option value="">Selecione o processo...</option>
                  {processosDoCliente.map(p => <option key={p.id} value={p.id}>{p.numero_processo} — {p.titulo}</option>)}
                </select>
                {processosDoCliente.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'hsl(0 72% 65%)', marginTop: '0.4rem' }}>
                    Este cliente ainda não tem processo cadastrado. Cadastre o processo antes de vincular o contrato.
                  </p>
                )}
              </div>
            )}

            {isExtrajudicial && (
              <div style={{ gridColumn: '1 / -1', padding: '0.6rem 0.875rem', background: 'hsl(43 30% 18% / 0.4)', border: '1px solid hsl(43 40% 30%)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(45 8% 65%)' }}>
                Cliente extrajudicial — este contrato será vinculado direto ao cliente, sem processo.
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isMensal ? 'Valor Mensal *' : 'Valor Fixo *'}
              </label>
              <input className="input-base" type="number" step="0.01" min="0" required value={form.valor_total} onChange={e => setForm(p => ({ ...p, valor_total: e.target.value }))} placeholder="R$ 0,00" />
            </div>

            {isMensal && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duração (meses) *</label>
                <input className="input-base" type="number" min="1" required value={form.numero_parcelas} onChange={e => setForm(p => ({ ...p, numero_parcelas: e.target.value }))} placeholder="Ex: 12" />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Início *</label>
              <input className="input-base" type="date" required value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} />
            </div>

            {isMensal && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dia de Vencimento *</label>
                <input className="input-base" type="number" min="1" max="31" required value={form.dia_vencimento} onChange={e => setForm(p => ({ ...p, dia_vencimento: e.target.value }))} placeholder="Ex: 10" />
              </div>
            )}

            {isFixo && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data de Vencimento *</label>
                <input className="input-base" type="date" required value={form.data_vencimento_fixo} onChange={e => setForm(p => ({ ...p, data_vencimento_fixo: e.target.value }))} />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Fim</label>
              <input className="input-base" type="date" value={form.data_fim} onChange={e => setForm(p => ({ ...p, data_fim: e.target.value }))} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações</label>
              <textarea className="input-base" value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} placeholder="Observações adicionais..." rows={3} />
            </div>
          </div>
          {erro && <div style={{ padding: '0.6rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>{erro}</div>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--border))' }}>
            <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Contrato'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
