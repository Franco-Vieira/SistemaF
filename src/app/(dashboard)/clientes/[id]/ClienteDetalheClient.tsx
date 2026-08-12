'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, FolderOpen, FileText } from 'lucide-react'
import { formatDate, formatCurrency, statusProcessoLabel, statusContratoLabel, tipoContratoLabel } from '@/lib/utils'

const sectionTitle = { fontSize: '0.7rem', fontWeight: '600' as const, color: 'hsl(43 72% 58%)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '1rem' }
const statusProcessoColor: Record<string, string> = { ativo: 'badge-success', encerrado: 'badge-muted', suspenso: 'badge-warning', arquivado: 'badge-muted' }
const statusContratoColor: Record<string, string> = { ativo: 'badge-success', quitado: 'badge-info', cancelado: 'badge-muted', inadimplente: 'badge-danger' }

export default function ClienteDetalheClient({ cliente, processos, contratos }: { cliente: any, processos: any[], contratos: any[] }) {
  const router = useRouter()
  const nomeExibido = cliente.nome_empresa || cliente.nome

  return (
    <div className="animate-fade-in" style={{ maxWidth: '780px' }}>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.push('/clientes')} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}>
            <ArrowLeft size={15} /> Voltar
          </button>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>{nomeExibido}</h1>
            <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              {cliente.tipo_processo === 'judicial' ? 'Judicial' : cliente.tipo_processo === 'extrajudicial' ? 'Extrajudicial' : 'Tipo não definido'}
            </p>
          </div>
        </div>
        <button className="btn-gold" onClick={() => router.push(`/clientes/${cliente.id}/editar`)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Pencil size={14} /> Editar Cliente
        </button>
      </div>

      {/* ── DADOS DO CLIENTE ── */}
      <div className="card-base" style={{ padding: '1.5rem', borderColor: 'hsl(43 30% 22%)', marginBottom: '1.5rem' }}>
        <p style={sectionTitle}>Dados Cadastrais</p>
        <div className="modal-grid" style={{ rowGap: '0.9rem' }}>
          <div><Label>Telefone</Label><Valor>{cliente.telefone || '—'}</Valor></div>
          <div><Label>E-mail</Label><Valor>{cliente.email || '—'}</Valor></div>
          <div style={{ gridColumn: '1 / -1' }}><Label>Endereço</Label><Valor>{[cliente.endereco, cliente.numero, cliente.complemento].filter(Boolean).join(', ') || '—'}</Valor></div>
          <div><Label>Cidade/UF</Label><Valor>{cliente.cidade ? `${cliente.cidade}/${cliente.estado}` : '—'}</Valor></div>
          <div><Label>Responsável</Label><Valor>{cliente.nome_responsavel || '—'}</Valor></div>
          <div><Label>Origem</Label><Valor>{cliente.origem === 'escritorio' ? 'Escritório' : 'Advogado Associado'}</Valor></div>
        </div>
      </div>

      {/* ── PROCESSOS ── */}
      <div className="card-base" style={{ padding: '1.5rem', borderColor: 'hsl(43 30% 22%)', marginBottom: '1.5rem' }}>
        <p style={sectionTitle}>Processos ({processos.length})</p>
        {processos.length === 0 ? (
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.85rem' }}>Nenhum processo cadastrado para este cliente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {processos.map(p => (
              <div
                key={p.id}
                onClick={() => router.push(`/processos/${p.id}/editar`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', border: '1px solid hsl(220 10% 20%)', borderRadius: '8px', cursor: 'pointer', gap: '1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <FolderOpen size={16} color="hsl(43 72% 58%)" style={{ flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(43 72% 65%)' }}>{p.numero_processo}</div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(45 20% 80%)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.titulo}</div>
                  </div>
                </div>
                <span className={`badge ${statusProcessoColor[p.status] || 'badge-muted'}`} style={{ flexShrink: 0 }}>{statusProcessoLabel[p.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTRATOS ── */}
      <div className="card-base" style={{ padding: '1.5rem', borderColor: 'hsl(43 30% 22%)' }}>
        <p style={sectionTitle}>Contratos ({contratos.length})</p>
        {contratos.length === 0 ? (
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.85rem' }}>Nenhum contrato cadastrado para este cliente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {contratos.map(c => (
              <div
                key={c.id}
                onClick={() => router.push(`/contratos/${c.id}/editar`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', border: '1px solid hsl(220 10% 20%)', borderRadius: '8px', cursor: 'pointer', gap: '1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <FileText size={16} color="hsl(43 72% 58%)" style={{ flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(43 72% 65%)' }}>{c.numero_contrato}</div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(45 8% 60%)' }}>
                      {tipoContratoLabel?.[c.tipo] || c.tipo} {c.processo_id ? '' : '· Extrajudicial'} — {formatCurrency(Number(c.valor_total))}
                    </div>
                  </div>
                </div>
                <span className={`badge ${statusContratoColor[c.status] || 'badge-muted'}`} style={{ flexShrink: 0 }}>{statusContratoLabel[c.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.7rem', color: 'hsl(45 8% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>{children}</div>
}
function Valor({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.85rem', color: 'hsl(45 20% 85%)' }}>{children}</div>
}
