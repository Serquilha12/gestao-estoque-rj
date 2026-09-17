import { z } from 'zod';

export const userProfileSchema = z.enum(['ADMINISTRADOR', 'ATENDENTE']);

export const loginSchema = z.object({
  email: z.string().trim().email('Email inválido.'),
  password: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres.'),
});

export const userCreateSchema = z.object({
  nome: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().trim().email('Email inválido.').transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres.'),
  perfil: userProfileSchema,
  activo: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().trim().email('Email inválido.').transform((value) => value.toLowerCase()),
  perfil: userProfileSchema,
  activo: z.boolean(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'A palavra-passe actual é obrigatória.'),
  newPassword: z.string().min(8, 'A nova palavra-passe deve ter pelo menos 8 caracteres.'),
  confirmPassword: z.string().min(8, 'A confirmação da palavra-passe é obrigatória.'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As palavras-passe não coincidem.',
  path: ['confirmPassword'],
});

export const categoryCreateSchema = z.object({
  nome: z.string().trim().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres.').max(120, 'O nome da categoria é demasiado longo.'),
  descricao: z.string().trim().nullish().transform((value) => (value && value.trim().length > 0 ? value.trim() : null)),
});

export const categoryUpdateSchema = z.object({
  id: z.number().int().positive('O identificador da categoria é inválido.'),
  nome: z.string().trim().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres.').max(120, 'O nome da categoria é demasiado longo.'),
  descricao: z.string().trim().nullish().transform((value) => (value && value.trim().length > 0 ? value.trim() : null)),
  activo: z.boolean(),
});

export const productCreateSchema = z.object({
  codigo: z.string().trim().min(2, 'O código deve ter pelo menos 2 caracteres.').max(60, 'O código é demasiado longo.'),
  nome: z.string().trim().min(2, 'O nome do produto deve ter pelo menos 2 caracteres.').max(160, 'O nome do produto é demasiado longo.'),
  descricao: z.string().trim().nullish().transform((value) => (value && value.trim().length > 0 ? value.trim() : null)),
  categoriaId: z.coerce.number().int().positive('A categoria é obrigatória.'),
  precoCompra: z.coerce.number().refine((value) => Number.isFinite(value) && value >= 0, 'O preço de compra não pode ser negativo.'),
  precoVenda: z.coerce.number().refine((value) => Number.isFinite(value) && value >= 0, 'O preço de venda não pode ser negativo.'),
  stockActual: z.coerce.number().int('O stock actual deve ser um número inteiro.').refine((value) => Number.isFinite(value) && value >= 0, 'O stock actual não pode ser negativo.'),
  stockMinimo: z.coerce.number().int('O stock mínimo deve ser um número inteiro.').refine((value) => Number.isFinite(value) && value >= 0, 'O stock mínimo não pode ser negativo.'),
  activo: z.boolean().default(true),
});

export const productUpdateSchema = z.object({
  id: z.number().int().positive('O identificador do produto é inválido.'),
  codigo: z.string().trim().min(2, 'O código deve ter pelo menos 2 caracteres.').max(60, 'O código é demasiado longo.'),
  nome: z.string().trim().min(2, 'O nome do produto deve ter pelo menos 2 caracteres.').max(160, 'O nome do produto é demasiado longo.'),
  descricao: z.string().trim().nullish().transform((value) => (value && value.trim().length > 0 ? value.trim() : null)),
  categoriaId: z.coerce.number().int().positive('A categoria é obrigatória.'),
  precoCompra: z.coerce.number().refine((value) => Number.isFinite(value) && value >= 0, 'O preço de compra não pode ser negativo.'),
  precoVenda: z.coerce.number().refine((value) => Number.isFinite(value) && value >= 0, 'O preço de venda não pode ser negativo.'),
  stockMinimo: z.coerce.number().int('O stock mínimo deve ser um número inteiro.').refine((value) => Number.isFinite(value) && value >= 0, 'O stock mínimo não pode ser negativo.'),
  activo: z.boolean(),
});

export const categoryStatusSchema = z.object({
  activo: z.boolean(),
});

export const productStatusSchema = z.object({
  activo: z.boolean(),
});

export const metodoPagamentoSchema = z.enum(['DINHEIRO', 'MPESA', 'EMOLA', 'CARTAO', 'OUTRO']);

export const saleCreateSchema = z.object({
  itens: z.array(z.object({
    produtoId: z.coerce.number().int().positive('O produto é inválido.'),
    quantidade: z.coerce.number().int('A quantidade deve ser um número inteiro.').positive('A quantidade deve ser maior que zero.'),
    notas: z.string().trim().nullish().transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  })).min(1, 'O carrinho está vazio.'),
  metodoPagamento: metodoPagamentoSchema.default('DINHEIRO'),
  valorRecebido: z.coerce.number().refine((v) => Number.isFinite(v) && v >= 0, 'Valor recebido inválido.').optional(),
  troco: z.coerce.number().refine((v) => Number.isFinite(v) && v >= 0, 'Troco inválido.').optional(),
  referenciaPagamento: z.string().trim().nullish().transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  observacoes: z.string().trim().nullish().transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
});

export type SaleCreateInput = z.infer<typeof saleCreateSchema>;

export const stockEntrySchema = z.object({
  produtoId: z.coerce.number().int().positive('O produto é obrigatório.'),
  quantidade: z.coerce.number().int('A quantidade deve ser um número inteiro.').positive('A quantidade deve ser maior que zero.'),
  motivo: z.string().trim().nullish().transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
});

export type StockEntryInput = z.infer<typeof stockEntrySchema>;

export const stockExitSchema = z.object({
  produtoId: z.coerce.number().int().positive('O produto é obrigatório.'),
  quantidade: z.coerce.number().int('A quantidade deve ser um número inteiro.').positive('A quantidade deve ser maior que zero.'),
  motivo: z.string().trim().nullish().transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
});

export type StockExitInput = z.infer<typeof stockExitSchema>;

export const stockAdjustmentSchema = z.object({
  produtoId: z.coerce.number().int().positive('O produto é obrigatório.'),
  novoStock: z.coerce.number().int('O novo stock deve ser um número inteiro.').min(0, 'O stock não pode ser negativo.'),
  motivo: z.string().trim().min(3, 'O motivo do ajuste é obrigatório (mínimo 3 caracteres).'),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

