'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import { categoriaLancamento, formatCurrency } from '@/lib/utils'

// formata "2026-06-12" -> "12/06/2026" sem passar por fuso
function fmtVenc(d?: string) {
  if (!d) return ''
  const [ano, mes, dia] = d.substring(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
function saldoParcela(p: any) {
  return Number(p.valor_previsto) - Number(p.valor_pago || 0)
}

export default function NovoLancamentoForm({ processos, advogados }: { processos: any[], advogados: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [contratos, setContratos] = useState<any[]>([])
  const [parcelas, setParcelas] = useState<any[]>([])
  const [loadingParcelas, setLoadingParcelas] = useState(false)
  const [form, setForm] = useState({
    tipo: 'entrada', categoria: '', descricao: '', valor: '',
    data_competencia: new Date().toISOString().split('T')[0],
    status: 'previsto', forma_pagamento: '', processo_id: '', advogado_id: '',
    contrato_id: '', parcela_id: '', observacoes: '',
  })

  // carrega contratos uma vez (usado só pra filtrar parcelas)
  useEffect(() => {
    const supabase = createClient()
    supabase.from('contratos').select('id, numero_contrato, processo_id').order('numero_contrato')
      .then(({ data }) => setContratos(data || []))
  }, [])

  async function handleContratoChange(contratoId: string) {
    const contrato = contratos.find(c => c.id === contratoId)
    // vincula também o processo do contrato (lançamento grava processo_id)
    setForm(p => ({ ...p, contrato_id: contratoId, parcela_id: '', processo_id: contrato?.processo_id || p.processo_id }))
    setParcelas([])
    if (!contratoId) return
    setLoadingParcelas(true)
    const supabase = createClient()
    // só parcelas realmente em aberto: fora 'pago' (quitada), 'transferida' (saldo já absorvido
    // pela parcela do mês seguinte) e 'cancelado'
    const { data } = await supabase.from('parcelas')
      .select('id, numero_parcela, valor_previsto, valor_pago, data_vencimento, status, processo_id')
      .eq('contrato_id', contratoId)
      .in('status', ['pendente', 'pago_parcial', 'atrasado'])
      .order('numero_parcela')
    setParcelas(data || [])
    setLoadingParcelas(false)
  }

  function handleParcelaChange(parcelaId: string) {
    const parcela = parcelas.find(p => p.id === parcelaId)
    setForm(p => ({
      ...p,
      parcela_id: parcelaId,
      // só SUGERE o valor cheio se o campo ainda estiver vazio — nunca sobrescreve
      // um valor que a pessoa já digitou manualmente (ex: pagamento parcial)
      valor: parcela && !p.valor ? String(saldoParcela(parcela)) : p.valor,
      processo_id: parcela?.processo_id || p.processo_id,
    }))
  }

  function handleTipoChange(tipo: string) {
    // limpa campos que não fazem sentido no outro tipo
    setForm(p => ({
      ...p,
      tipo,
      ...(tipo === 'saida' ? { contrato_id: '', parcela_id: '' } : { advogado_id: '' }),
    }))
    if (tipo === 'saida') setParcelas([])
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // payload do lançamento (NÃO inclui contrato_id — não existe na tabela)
    const payload: any = {
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao,
      valor: Number(form.valor),
      data_competencia: form.data_competencia,
      status: form.status,
      forma_pagamento: form.forma_pagamento || null,
      processo_id: form.processo_id || null,
      advogado_id: form.advogado_id || null,
      parcela_id: form.parcela_id || null,
      observacoes: form.observacoes || null,
    }
    if (form.status === 'realizado') payload.data_pagamento = new Date().toISOString()

    const { error } = await supabase.from('lancamentos').insert(payload)
    if (error) { setErro(error.message); setLoading(false); return }

    // ── BAIXA NA PARCELA (só entrada realizada vinculada a parcela) ──
    if (form.tipo === 'entrada' && form.parcela_id && form.status === 'realizado') {
      const parcela = parcelas.find(p => p.id === form.parcela_id)
      if (parcela) {
        const previsto = Number(parcela.valor_previsto)
        const novoPago = Number(parcela.valor_pago || 0) + Number(form.valor)
        // tolerância de centavos pra evitar erro de arredondamento
        const quitada = Math.round(novoPago * 100) >= Math.round(previsto * 100)
        const { error: errParcela } = await supabase.from('parcelas').update({
          valor_pago: novoPago,
          status: quitada ? 'pago' : 'pago_parcial', // valor válido na CHECK constraint (era 'parcial' — bug)
          data_pagamento: new Date().toISOString(),
          forma_pagamento: form.forma_pagamento || null,
          baixa_por: user?.id || null,
        }).eq('id', form.parcela_id)
        // se a baixa falhar, o lançamento já foi salvo — avisa mas não trava
        if (errParcela) {
          setErro('Lançamento salvo, mas houve erro ao baixar a parcela: ' + errParcela.message)
          setLoading(false)
          return
        }
      }
    }

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
              <select className="input-base" value={form.tipo} onChange={e => handleTipoChange(e.target.value)}>
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
              {form.parcela_id && Number(form.valor) > 0 && (() => {
                const parcela = parcelas.find(p => p.id === form.parcela_id)
                if (!parcela) return null
                const restante = saldoParcela(parcela) - Number(form.valor)
                if (restante > 0.004) {
                  return (
                    <p style={{ fontSize: '0.72rem', color: 'hsl(38 92% 60%)', marginTop: '0.35rem' }}>
                      Pagamento parcial — faltarão {formatCurrency(restante)}. Registre o motivo em Observações.
                    </p>
                  )
                }
                return null
              })()}
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

            {/* Contrato + Parcela — só em ENTRADA */}
            {form.tipo === 'entrada' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contrato (Cliente)</label>
                  <select className="input-base" value={form.contrato_id} onChange={e => handleContratoChange(e.target.value)}>
                    <option value="">Nenhum</option>
                    {contratos.map((c: any) => <option key={c.id} value={c.id}>{c.numero_contrato}</option>)}
                  </select>
                </div>
                {form.contrato_id && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Referência (parcela em aberto)</label>
                    <select className="input-base" value={form.parcela_id} onChange={e => handleParcelaChange(e.target.value)} disabled={loadingParcelas}>
                      <option value="">{loadingParcelas ? 'Carregando...' : parcelas.length === 0 ? 'Nenhuma parcela em aberto' : 'Nenhuma'}</option>
                      {parcelas.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          Ref. {fmtVenc(p.data_vencimento)} • falta {formatCurrency(saldoParcela(p))}{p.status === 'pago_parcial' ? ' (parcial)' : p.status === 'atrasado' ? ' (atrasada)' : ''}
                        </option>
                      ))}
                    </select>
                    {form.parcela_id && form.status !== 'realizado' && (
                      <p style={{ fontSize: '0.72rem', color: 'hsl(43 72% 58%)', marginTop: '0.35rem' }}>
                        A baixa só acontece com Status = Realizado.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

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
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações</label>
              <textarea className="input-base" value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} placeholder="Ex: cliente pagou parcial, restante combinado para dia X" rows={2} />
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
