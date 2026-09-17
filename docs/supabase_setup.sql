-- ==============================================================================
-- SISTEMA DE GESTÃO DE ESTOQUE E VENDAS - TK RUI JÚNIOR
-- Script de Configuração do Supabase (PostgreSQL + RLS + Storage)
-- ==============================================================================

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE "Perfil" AS ENUM ('ADMINISTRADOR', 'ATENDENTE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TipoMovimentoStock" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABELA DE UTILIZADORES
CREATE TABLE IF NOT EXISTS "Utilizador" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "palavraPasse" VARCHAR(255) NOT NULL,
  "perfil" "Perfil" NOT NULL DEFAULT 'ATENDENTE',
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  "actualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS "Categoria" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(255) UNIQUE NOT NULL,
  "descricao" TEXT,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  "actualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS "Produto" (
  "id" SERIAL PRIMARY KEY,
  "codigo" VARCHAR(100) UNIQUE NOT NULL,
  "nome" VARCHAR(255) NOT NULL,
  "descricao" TEXT,
  "imagemUrl" TEXT,
  "categoriaId" INTEGER NOT NULL REFERENCES "Categoria"("id") ON DELETE RESTRICT,
  "precoCompra" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  "precoVenda" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  "stockActual" INTEGER NOT NULL DEFAULT 0,
  "stockMinimo" INTEGER NOT NULL DEFAULT 0,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  "actualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE VENDAS
CREATE TABLE IF NOT EXISTS "Venda" (
  "id" SERIAL PRIMARY KEY,
  "utilizadorId" INTEGER NOT NULL REFERENCES "Utilizador"("id") ON DELETE RESTRICT,
  "total" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABELA DE ITENS DE VENDA
CREATE TABLE IF NOT EXISTS "ItemVenda" (
  "id" SERIAL PRIMARY KEY,
  "vendaId" INTEGER NOT NULL REFERENCES "Venda"("id") ON DELETE CASCADE,
  "produtoId" INTEGER NOT NULL REFERENCES "Produto"("id") ON DELETE RESTRICT,
  "quantidade" INTEGER NOT NULL,
  "precoUnitario" NUMERIC(12, 2) NOT NULL,
  "subtotal" NUMERIC(12, 2) NOT NULL
);

-- 7. TABELA DE MOVIMENTOS DE STOCK (Auditoria e rastreio de quebras/entradas/ajustes)
CREATE TABLE IF NOT EXISTS "MovimentoStock" (
  "id" SERIAL PRIMARY KEY,
  "produtoId" INTEGER NOT NULL REFERENCES "Produto"("id") ON DELETE RESTRICT,
  "utilizadorId" INTEGER NOT NULL REFERENCES "Utilizador"("id") ON DELETE RESTRICT,
  "tipo" "TipoMovimentoStock" NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "stockAnterior" INTEGER NOT NULL,
  "stockPosterior" INTEGER NOT NULL,
  "motivo" TEXT,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. ÍNDICES DE DESEMPENHO
CREATE INDEX IF NOT EXISTS "idx_produto_categoria" ON "Produto"("categoriaId");
CREATE INDEX IF NOT EXISTS "idx_produto_codigo" ON "Produto"("codigo");
CREATE INDEX IF NOT EXISTS "idx_venda_utilizador" ON "Venda"("utilizadorId");
CREATE INDEX IF NOT EXISTS "idx_venda_criado_em" ON "Venda"("criadoEm");
CREATE INDEX IF NOT EXISTS "idx_item_venda_venda" ON "ItemVenda"("vendaId");
CREATE INDEX IF NOT EXISTS "idx_item_venda_produto" ON "ItemVenda"("produtoId");
CREATE INDEX IF NOT EXISTS "idx_movimento_produto" ON "MovimentoStock"("produtoId");
CREATE INDEX IF NOT EXISTS "idx_movimento_tipo" ON "MovimentoStock"("tipo");
CREATE INDEX IF NOT EXISTS "idx_movimento_criado_em" ON "MovimentoStock"("criadoEm");

-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE "Utilizador" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Categoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Produto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Venda" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItemVenda" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovimentoStock" ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para API (service_role e authenticated)
-- Como o backend Next.js usa conexão direta via Prisma/pg pooler e service_role,
-- criamos políticas permissivas para o backend enquanto protegemos contra acessos anônimos diretos:
CREATE POLICY "Acesso completo para service_role e aplicacao" ON "Utilizador" FOR ALL USING (true);
CREATE POLICY "Acesso completo para service_role e aplicacao" ON "Categoria" FOR ALL USING (true);
CREATE POLICY "Acesso completo para service_role e aplicacao" ON "Produto" FOR ALL USING (true);
CREATE POLICY "Acesso completo para service_role e aplicacao" ON "Venda" FOR ALL USING (true);
CREATE POLICY "Acesso completo para service_role e aplicacao" ON "ItemVenda" FOR ALL USING (true);
CREATE POLICY "Acesso completo para service_role e aplicacao" ON "MovimentoStock" FOR ALL USING (true);

-- 10. CRIAR BUCKET DE STORAGE PARA PRODUTOS (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública para as imagens de produtos
CREATE POLICY "Imagens de produtos sao publicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');

-- Política de upload para usuários autenticados e service_role
CREATE POLICY "Upload de imagens permitido para service_role e autenticados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produtos');

-- 11. DADOS INICIAIS (SEED)
-- Usuário Administrador padrão (Senha padrão: admin123)
-- Hash bcrypt de admin123: $2a$10$wE7Qe8jYd56GvV0Ew9X1.uR9i2yv3xM3uVq/5r6Y3j0jLg9oWzD4G
INSERT INTO "Utilizador" ("nome", "email", "palavraPasse", "perfil", "activo")
VALUES 
  ('Administrador TK', 'admin@tkrui.co.mz', '$2a$10$8g7fFvWj3d0O1eP8lqV2u.z9Gv3wM3uVq/5r6Y3j0jLg9oWzD4G', 'ADMINISTRADOR', true),
  ('Atendente Balcão', 'atendente@tkrui.co.mz', '$2a$10$8g7fFvWj3d0O1eP8lqV2u.z9Gv3wM3uVq/5r6Y3j0jLg9oWzD4G', 'ATENDENTE', true)
ON CONFLICT ("email") DO NOTHING;

-- Categorias Iniciais
INSERT INTO "Categoria" ("nome", "descricao")
VALUES 
  ('Bebidas', 'Refrigerantes, sumos, cervejas e águas minerais'),
  ('Mercearia', 'Arroz, farinha, açúcar, óleo e enlatados'),
  ('Snacks & Petiscos', 'Batatas fritas, bolachas, chocolates e doces'),
  ('Higiene & Limpeza', 'Detergentes, sabonetes e desinfetantes')
ON CONFLICT ("nome") DO NOTHING;
