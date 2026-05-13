export type Role = 'admin' | 'advogado'

export interface Profile {
  id: string
  nome: string
  email: string
  telefone?: string
  role: Role
  ativo: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  nome: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  origem: 'escritorio' | 'advogado_associado'
  advogado_origem_id?: string
  advogado_origem?: Profile
  observacoes?: string
  ativo: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Processo {
  id: string
  numero_processo: string
  titulo: string
  cliente_id: string
  cliente?: Cliente
  descricao?: string
  status: 'ativo' | 'encerrado' | 'suspenso' | 'arquivado'
  data_abertura: string
  data_encerramento?: string
  valor_total_contrato: number
  advogados?: Profile[]
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ProcessoAdvogado {
  id: string
  processo_id: string
  advogado_id: string
  papel: 'responsavel' | 'auxiliar'
  created_at: string
}

export interface Contrato {
  id: string
  numero_contrato: string
  processo_id: string
  processo?: Processo
  tipo: 'avista' | 'parcelado' | 'mensalidade'
  valor_total: number
  numero_parcelas: number
  data_inicio: string
  data_fim?: string
  dia_vencimento?: number
  status: 'ativo' | 'quitado' | 'cancelado' | 'inadimplente'
  observacoes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Parcela {
  id: string
  contrato_id: string
  contrato?: Contrato
  processo_id: string
  processo?: Processo
  numero_parcela: number
  valor_previsto: number
  valor_pago: number
  data_vencimento: string
  data_pagamento?: string
  status: 'pendente' | 'pago' | 'pago_parcial' | 'atrasado' | 'cancelado'
  forma_pagamento?: 'boleto' | 'pix' | 'transferencia' | 'dinheiro' | 'cartao' | 'outro'
  referencia?: string
  observacoes?: string
  baixa_por?: string
  created_at: string
  updated_at: string
}

export interface Lancamento {
  id: string
  tipo: 'entrada' | 'saida'
  categoria: string
  descricao: string
  valor: number
  data_competencia: string
  data_pagamento?: string
  status: 'previsto' | 'realizado' | 'cancelado'
  forma_pagamento?: string
  processo_id?: string
  processo?: Processo
  parcela_id?: string
  advogado_id?: string
  advogado?: Profile
  referencia?: string
  observacoes?: string
  created_by?: string
  baixa_por?: string
  created_at: string
  updated_at: string
}

export interface Alerta {
  id: string
  tipo: 'parcela_vencida' | 'parcela_proxima' | 'contrato_vencendo'
  parcela_id?: string
  contrato_id?: string
  processo_id?: string
  mensagem: string
  lido: boolean
  lido_por?: string
  lido_em?: string
  created_at: string
}

export interface ResumoMensal {
  mes: string
  entradas_realizadas: number
  saidas_realizadas: number
  entradas_previstas: number
  saidas_previstas: number
  total_entradas: number
  total_saidas: number
  total_lancamentos: number
}

export interface ComparativoAnual {
  ano: number
  mes: number
  mes_nome: string
  entradas_realizadas: number
  saidas_realizadas: number
  entradas_total: number
  saidas_total: number
  saldo_realizado: number
}

export interface AdvogadoFinanceiro {
  profile_id: string
  advogado_nome: string
  processo_id: string
  numero_processo: string
  processo_titulo: string
  processo_status: string
  cliente_nome: string
  valor_total_previsto: number
  valor_total_pago: number
  valor_a_receber: number
}

export interface PagamentoAdvogado {
  advogado_id: string
  advogado_nome: string
  processo_id: string
  numero_processo: string
  processo_titulo: string
  cliente_nome: string
  parcela_id: string
  numero_parcela: number
  valor_pago: number
  valor_previsto: number
  data_pagamento: string
  forma_pagamento?: string
  referencia?: string
  parcela_status: string
}
