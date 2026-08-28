'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

interface Parcela { id: string; numero_parcela: number; status: string }

export default function EditarContratoForm({ contrato, processos, parcelas }: { contrato: any, processos: any[], parcelas: Parcela[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState<string[]>([])
  const isJudicial = contrato.cliente?.tipo_processo === 'judicial'
  const isExtrajudicial = contrato.cliente?.tipo_processo === 'extrajudicial'
  const [form, setForm] = useState({
    numero_contrato: contrato.numero_contrato || '',
    processo_id: contrato.processo_id || '',
    tipo: contrato.tipo || 'mensalidade',
    valor_total: contrato.valor_total || '',
    numero_parcelas: contrato.numero_parcelas || '1',
    data_inicio: contrato.data_inicio?.split('T')[0] || '',
    data_fim: contrato.data_fim?.split('T')[0] || '',
    dia_vencimento: contrato.dia_vencimento || '',
    data_vencimento_fixo: contrato.data_vencimento_fixo?.split('T')[0] || '',
    status: contrato.status || 'ativo',
    observacoes: contrato.observacoes || '',
  })

  const isMensal = form.tipo === 'mensalidade'
  const isFixo = form.tipo === 'avista'

  // Tem alguma parcela que já saiu do estado inicial (pago, atrasado, cancelado, transferida)?
  const temHistorico = useMemo(() => parcelas.some(p => p.status !== 'pendente'), [parcelas])
  const tipoMudou = form.tipo !== contrato.tipo

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso([])

    if (isJudicial && !form.processo_id) { setErro('Este cliente é Judicial: selecione o processo vinculado.'); return }
    if (tipoMudou && temHistorico) {
      setErro('Não é possível trocar a modalidade: este contrato já tem parcela paga, atrasada, cancelada ou transferida. As estruturas de Mensal e Fixo são diferentes e não dá pra reconciliar automaticamente com histórico real por trás. Se for realmente necessário, fale comigo antes de fazer manualmente.')
      return
    }
    if (isMensal && (!form.numero_parcelas || Number(form.numero_parcelas) < 1)) { setErro('Informe a duração em meses.'); return }

    setLoading(true)
    const supabase = createClient()
    const payload: any = {
      numero_contrato: form.numero_contrato,
      processo_id: isJudicial ? form.processo_id : null,
      tipo: form.tipo,
      valor_total: Number(form.valor_total),
      numero_parcelas: Number(form.numero_parcelas) || 1,
      dia_vencimento: isMensal ? Number(form.dia_vencimento) : null,
      data_vencimento_fixo: isFixo ? (form.data_vencimento_fixo || null) : null,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
      status: form.status,
      observacoes: form.observacoes || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('contratos').update(payload).eq('id', contrato.id)
    if (error) { setErro(error.message); setLoading(false); return }

    if (tipoMudou) {
      // Sem histórico ainda (garantido pela checagem acima) — apaga as parcelas 'pendente' antigas
      // e gera do zero na estrutura da nova modalidade.
      await supabase.from('parcelas').delete().eq('contrato_id', contrato.id).eq('status', 'pendente')
      const { error: errGerar } = await supabase.rpc('gerar_parcelas', { contrato_id: contrato.id })
      if (errGerar) {
        setErro('Contrato salvo, mas houve erro ao gerar as parcelas da nova modalidade: ' + errGerar.message)
        setLoading(false)
        return
      }
    } else {
      // Mesma modalidade — reconcilia parcelas existentes com os novos valores/duração
      const { data: resultado, error: errSync } = await supabase.rpc('sincronizar_parcelas_contrato', { p_contrato_id: contrato.id })
      if (errSync) {
        setErro('Contrato salvo, mas houve erro ao sincronizar as parcelas: ' + errSync.message)
        setLoading(false)
        return
      }
      if (resultado && resultado.length > 0) {
        setAviso(resultado.map((r: any) => r.detalhe))
        setLoading(false)
        return // deixa o usuário ver o resumo antes de sair da página
      }
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
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Editar Contrato</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{contrato.numero_contrato}</p>
        </div>
      </div>
      <div className="card-base" style={{ padding: '1.75rem', borderColor: 'hsl(43 30% 22%)' }}>
        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="modal-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nº Contrato *</label>
              <input className="input-base" required value={form.numero_contrato} onChange={e => setForm(p => ({ ...p, numero_contrato: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
              <select className="input-base" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="ativo">Ativo</option>
                <option value="quitado">Quitado</option>
                <option value="cancelado">Cancelado</option>
                <option value="inadimplente">Inadimplente</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</label>
              <div className="input-base" style={{ display: 'flex', alignItems: 'center', color: 'hsl(45 8% 65%)', cursor: 'not-allowed' }}>
                {contrato.cliente?.nome_empresa || contrato.cliente?.nome} — {isJudicial ? 'Judicial' : isExtrajudicial ? 'Extrajudicial' : 'Tipo não definido'}
              </div>
            </div>

            {isJudicial && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Processo *</label>
                <select className="input-base" required value={form.processo_id} onChange={e => setForm(p => ({ ...p, processo_id: e.target.value }))}>
                  <option value="">Selecione o processo...</option>
                  {processos.map((p: any) => <option key={p.id} value={p.id}>{p.numero_processo} — {p.titulo}</option>)}
                </select>
              </div>
            )}

            {isExtrajudicial && (
              <div style={{ gridColumn: '1 / -1', padding: '0.6rem 0.875rem', background: 'hsl(43 30% 18% / 0.4)', border: '1px solid hsl(43 40% 30%)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(45 8% 65%)' }}>
                Contrato vinculado direto ao cliente, sem processo (extrajudicial).
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modalidade *</label>
              <select className="input-base" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} disabled={temHistorico}>
                <option value="mensalidade">Mensal</option>
                <option value="avista">Fixo</option>
              </select>
              {temHistorico && (
                <p style={{ fontSize: '0.7rem', color: 'hsl(45 8% 45%)', marginTop: '0.35rem' }}>
                  Travado: este contrato já tem parcela com movimentação (paga, atrasada, cancelada ou transferida).
                </p>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isMensal ? 'Valor Mensal *' : 'Valor Total *'}
              </label>
              <input className="input-base" type="number" step="0.01" min="0" required value={form.valor_total} onChange={e => setForm(p => ({ ...p, valor_total: e.target.value }))} />
            </div>

            {isMensal && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duração (meses) *</label>
                <input className="input-base" type="number" min="1" required value={form.numero_parcelas} onChange={e => setForm(p => ({ ...p, numero_parcelas: e.target.value }))} />
              </div>
            )}

            {isFixo && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Número de Parcelas</label>
                <input className="input-base" type="number" min="1" value={form.numero_parcelas} onChange={e => setForm(p => ({ ...p, numero_parcelas: e.target.value }))} placeholder="1" />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Início</label>
              <input className="input-base" type="date" value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} />
            </div>

            {isMensal && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(45 8% 50%)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dia de Vencimento *</label>
                <input className="input-base" type="number" min="1" max="31" required value={form.dia_vencimento} onChange={e => setForm(p => ({ ...p, dia_vencimento: e.target.value }))} />
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
              <textarea className="input-base" value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={3} />
            </div>
          </div>
          {erro && <div style={{ padding: '0.6rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>{erro}</div>}
          {aviso.length > 0 && (
            <div style={{ padding: '0.75rem', background: 'hsl(43 60% 20% / 0.3)', border: '1px solid hsl(43 40% 35%)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(45 20% 85%)' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Parcelas atualizadas:</p>
              <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {aviso.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
              <button type="button" className="btn-gold" style={{ marginTop: '0.75rem' }} onClick={() => { router.push('/contratos'); router.refresh() }}>
                Fechar e voltar
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--border))' }}>
            <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
