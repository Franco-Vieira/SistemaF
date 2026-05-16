import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatMonthYear(date: string | Date): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMMM yyyy', { locale: ptBR })
}

export const statusProcessoLabel: Record<string, string> = {
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  suspenso: 'Suspenso',
  arquivado: 'Arquivado',
}

export const statusParcelaLabel: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  pago_parcial: 'Pago Parcial',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

export const statusContratoLabel: Record<string, string> = {
  ativo: 'Ativo',
  quitado: 'Quitado',
  cancelado: 'Cancelado',
  inadimplente: 'Inadimplente',
}

export const tipoContratoLabel: Record<string, string> = {
  avista: 'À Vista',
  parcelado: 'Parcelado',
  mensalidade: 'Mensalidade',
}

export const formaPagamentoLabel: Record<string, string> = {
  boleto: 'Boleto',
  pix: 'PIX',
  transferencia: 'Transferência',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  outro: 'Outro',
}

export const categoriaLancamento = [
  'Honorários Contratuais',
  'Honorários Sucumbenciais',
  'Custas Processuais',
  'Repasse Advogado',
  'Aluguel',
  'Salários',
  'Contabilidade',
  'Marketing',
  'Tecnologia',
  'Material de Escritório',
  'Despesas Bancárias',
  'Impostos',
  'Outros',
]
