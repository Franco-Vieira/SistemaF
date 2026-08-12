'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, RotateCcw } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Props {
  clientes: any[]
}

export default function ClientesInativosClient({ clientes: initialClientes }: Props) {
  const router = useRouter()
  const [clientes, setClientes] = useState(initialClientes)
  const [busca, setBusca] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.email?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca)
  )

  async function handleReativar(cliente: any) {
    setLoadingId(cliente.id)
    const supabase = createClient()
    await supabase.from('clientes').update({ ativo: true }).eq('id', cliente.id)
    setClientes(prev => prev.filter(c => c.id !== cliente.id))
    setLoadingId(null)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Clientes</h1>
          <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} inativo{clientes.length !== 1 ? 's' : ''} / finalizado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(45 8% 40%)' }} />
          <input className="input-base" placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} style={{ paddingLeft: '2.25rem', width: '220px' }} />
        </div>
      </div>

      {/* Abas Ativos / Inativos */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid hsl(var(--border))' }}>
        <button
          onClick={() => router.push('/clientes')}
          style={{ padding: '0.6rem 1rem', background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'hsl(45 8% 50%)', fontWeight: '500', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Ativos
        </button>
        <button
          onClick={() => router.push('/clientes/inativos')}
          style={{ padding: '0.6rem 1rem', background: 'none', border: 'none', borderBottom: '2px solid hsl(43 72% 58%)', color: 'hsl(45 20% 88%)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Inativos / Finalizados
        </button>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'hsl(45 8% 40%)', padding: '3rem' }}>
                {busca ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente inativo no momento.'}
              </td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'hsl(0 0% 20%)', border: '1px solid hsl(0 0% 30%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(45 8% 55%)', flexShrink: 0 }}>
                      {c.nome?.charAt(0)?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '500', color: 'hsl(45 8% 65%)' }}>{c.nome}</span>
                  </div>
                </td>
                <td style={{ color: 'hsl(45 8% 50%)' }}>{c.telefone || '-'}</td>
                <td style={{ color: 'hsl(45 8% 50%)' }}>{c.email || '-'}</td>
                <td style={{ color: 'hsl(45 8% 50%)' }}>{c.cidade ? `${c.cidade}/${c.estado}` : '-'}</td>
                <td>
                  <span className="badge" style={{ opacity: 0.7 }}>
                    {c.origem === 'escritorio' ? 'Escritório' : c.advogado_origem?.nome || 'Advogado Assoc.'}
                  </span>
                </td>
                <td style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem' }}>{formatDate(c.created_at)}</td>
                <td>
                  <button
                    onClick={() => handleReativar(c)}
                    disabled={loadingId === c.id}
                    style={{ padding: '0.25rem 0.6rem', background: 'none', border: '1px solid hsl(43 40% 30%)', borderRadius: '6px', cursor: 'pointer', color: 'hsl(43 72% 58%)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                  >
                    <RotateCcw size={12} /> {loadingId === c.id ? 'Reativando...' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
