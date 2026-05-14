'use client'

import { formatDate, formatCurrency, statusProcessoLabel } from '@/lib/utils'
import { FolderOpen } from 'lucide-react'

export default function MeusProcessosClient({ processos }: { processos: any[] }) {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>
          Meus Processos
        </h1>
        <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
          {processos.length} processo{processos.length !== 1 ? 's' : ''} ativo{processos.length !== 1 ? 's' : ''} vinculado{processos.length !== 1 ? 's' : ''} a você
        </p>
      </div>

      <div className="card-base" style={{ overflowX: 'auto' }}>
        <table className="table-base">
          <thead>
            <tr>
              <th>Nº Processo</th>
              <th>Título</th>
              <th>Cliente</th>
              <th>Papel</th>
              <th>Status</th>
              <th>Abertura</th>
              <th>Valor Contrato</th>
            </tr>
          </thead>
          <tbody>
            {processos.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'hsl(45 8% 40%)', padding: '3rem' }}>
                  <FolderOpen size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
                  Nenhum processo ativo vinculado a você
                </td>
              </tr>
            ) : processos.map((pa: any) => {
              const p = pa.processo
              return (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(43 72% 58%)' }}>
                      {p.numero_processo}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500', maxWidth: '240px' }}>{p.titulo}</td>
                  <td style={{ color: 'hsl(45 8% 65%)' }}>{p.cliente?.nome || '—'}</td>
                  <td>
                    <span className={`badge ${pa.papel === 'responsavel' ? 'badge-gold' : 'badge-info'}`}>
                      {pa.papel === 'responsavel' ? 'Responsável' : 'Auxiliar'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-success">{statusProcessoLabel[p.status] || p.status}</span>
                  </td>
                  <td style={{ color: 'hsl(45 8% 55%)', fontSize: '0.8rem' }}>
                    {formatDate(p.data_abertura)}
                  </td>
                  <td style={{ fontWeight: '500' }}>
                    {p.valor_total_contrato > 0 ? formatCurrency(p.valor_total_contrato) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
