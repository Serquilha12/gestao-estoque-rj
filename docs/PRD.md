PRD – Sistema de gestão de Stock
Produto: Gestão Avançada de Pedidos, Estoque e Atendimento 
Tipo de negócio: Take Away / Lanchonete 
Versão: MVP 1.0 
Status: Detalhamento Técnico
1. Sobre este documento
Este Documento de Requisitos de Produto (PRD) detalha um sistema completo de gestão para lanchonetes/take away. O documento descreve o que será construído (funcionalidades), para quem (público-alvo), por que será construído (objetivos) e como o produto deverá funcionar (fluxos).
2. Resumo Executivo
A lanchonete precisa de uma solução digital completa que permita à equipa gerenciar operações diárias com eficiência e ao gerente ter visibilidade de estoque, vendas e finanças. O sistema foi desenhado em dois módulos isolados para garantir segurança:
Módulo Atendente: Interface de balcão para registrar vendas e gerenciar o atendimento de forma rápida, além de processar rotinas físicas de stock (quebras e contagens).
Painel Gerente: Dashboard administrativo focado no controlo de custos, auditoria do inventário e proteção das margens de lucro.
3. Problema que queremos resolver
O negócio sofre com perdas financeiras invisíveis e ineficiência devido aos seguintes fatores:
Estoque descontrolado e vendas não registradas.
Falta de organização de pedidos e atendimento manual com erros.
Sem visibilidade da operação financeira (Custo da Mercadoria Vendida e Margens).
Desperdício não documentado na cozinha e furos de inventário.
4. Objetivos do Projeto
4.1 Objetivo Principal Criar uma plataforma digital intuitiva que facilite o atendimento no balcão com interface rápida e permita à equipa gerenciar operações diárias com eficiência, controlando o estoque automaticamente.
4.2 Objetivos Específicos
Controlar estoque automaticamente em tempo real a cada venda.
Registar todas as vendas para análise financeira rigorosa.
Fornecer relatórios e dashboards com dados de CMV e lucros.
Reduzir erros operacionais e estancar desvios através de auditorias (contagens cegas).
5. Público-alvo (Perfis de Acesso)
5.1 Atendentes (Equipa Operacional / Cozinha) Responsáveis por receber e registrar pedidos no balcão e atualizar a disponibilidade de produtos. Têm acesso restrito: não visualizam dados financeiros, custo de insumos ou relatórios de margens. O seu foco é a velocidade de serviço e o registo físico de ocorrências.
5.2 Gerente (Administrador / Proprietário) Possui visão geral de todos os pedidos, gere o estoque completo e executa análises financeiras. Responsável por configurar produtos, preços, Fichas Técnicas (BOM) e auditar o trabalho da equipa.
6. Escopo do MVP 2.0 (Módulos Integrados)
Este MVP expande o sistema focando estritamente em Atendimento no Balcão, Estoque e Finanças. A gestão de clientes e pagamentos automáticos foram removidas para garantir máxima agilidade.
Módulo
Funcionalidades Principais
Atendimento Balcão (POS)
Buscar produto, registrar venda e selecionar o método de pagamento manual. Registo simplificado de quebras e contagem física.
Gestão Estoque
Entrada/saída imutável, alertas de limite e gestão da disponibilidade em tempo real. Fichas Técnicas paramétricas.
Gestão Finanças
Receitas, despesas, margem de lucro por produto, fluxo de caixa e Análise ABC.
Painel Gerente
Dashboard administrativo, gestão completa, auditorias de contagem e relatórios gerenciais.
7. Módulo de Atendimento (Frente de Loja / POS)
Este é o módulo mais importante para a operação diária no balcão. Foi refinado para ser extremamente rápido, sem etapas de recolha de dados do cliente.
7.1 Fluxo de Atendimento
O cliente chega e o atendente abre um novo pedido.
Buscar/adicionar produtos (via pesquisa com autocompletar ou filtro por categoria). O sistema cruza a escolha com o stock disponível.
Revisar itens e aplicar observações especiais (ex: modificações na receita).
Escolher a forma de pagamento (registo manual para controlo financeiro).
Finalizar venda: O sistema envia a ordem (apenas com os produtos e observações, sem valores financeiros) para a impressora térmica da cozinha ou para um ecrã de preparação (KDS - Kitchen Display System) ou o antedente anota o pedido com ID ou nome do cliente (opcional), a cozinha e o sistema deduz o stock instantaneamente.
7.2 Funcionalidades do POS
Catálogo & Carrinho: Foto, preço, disponibilidade em tempo real, cálculo de subtotal automático e edição rápida de quantidades.
Pagamento: Registo de Dinheiro, Débito/Crédito e carteiras móveis como M-Pesa ou e-Mola. Apenas para registro no sistema, sem processamento de pagamento.
Operações de Cozinha: Botões na interface para registar quebras (comida caída, queimada) e formulário de "Contagem Cega" de fecho de turno.
8. Gestão de Estoque (Motor Central)
8.1 Fichas Técnicas e Baixa Automática
Cada venda desconta automaticamente do estoque as quantidades exatas de ingredientes e embalagens definidas na Ficha Técnica.
Sincronização em tempo real com alerta quando o estoque está baixo, impedindo vendas de produtos esgotados.
8.2 Movimentação e Auditoria
O sistema regista entradas (compras de fornecedores), saídas (vendas) e ajustes (quebras, perdas) num livro de registos inalterável.
Contagem Cega: O atendente submete o inventário físico sem ver o saldo do sistema. O Gerente compara os dados e o sistema destaca desvios não justificados.
9. Gestão Financeira e Inteligência de Negócio (Gerência)
O painel do Gerente cruza dados operacionais com indicadores financeiros de alto nível:
Lucratividade e Receitas: Total por hora, dia, mês; ticket médio e cálculo exato da margem de lucro por produto (Custo vs. Preço de Venda).
Alertas Dinâmicos de Margem: O sistema recalcula o Custo Médio Ponderado (CMP) a cada entrada e alerta o gestor se a margem de um prato cair para níveis críticos devido ao aumento dos insumos.
Valorização do Capital Imobilizado: O dashboard exibe o valor em dinheiro trancado no armazém/câmara fria em tempo real.
Matriz e Análise ABC: Classifica produtos e insumos por impacto no lucro para focar as auditorias nos itens mais críticos.
Fluxo de Caixa e Despesas: Registo de todas as despesas categorizadas e análise da entrada/saída diária.
10. Requisitos Funcionais
Código
Requisito Funcional
RF-01
O sistema deve ter um menu com categorias, fotos e preços.
RF-02
O sistema deve permitir adicionar/remover produtos do carrinho e calcular o total com descontos automaticamente.
RF-03
O sistema deve efetuar o checkout registando a forma de pagamento selecionada, gerando um número único para cada pedido.
RF-04
O sistema deve atualizar o estoque automaticamente a cada venda baseando-se nas Fichas Técnicas e alertar quando o estoque for baixo.
RF-05
O sistema deve registar a movimentação de estoque (entradas, saídas, quebras) num histórico imutável com "Audit Trail".
RF-06
O sistema deve fornecer um módulo de contagem cega para os atendentes.
RF-07
O Dashboard do gerente deve permitir gerir produtos e exibir métricas financeiras, relatórios de desvios e alertas de margem de CMV.
RF-08
O sistema deve guardar o método de pagamento (Dinheiro, M-Pesa, e-Mola, Cartão, Outro) no pedido para fecho de caixa.
11. Requisitos Não Funcionais
Responsividade: O sistema deve funcionar em smartphones, tablets e computadores.
Performance: Busca instantânea, sincronização em tempo real e tempo de carregamento inferior a 2 segundos.
Segurança: Proteção de acesso com login, controlo de permissões isolado por perfil (Gerente/Atendente) e senhas criptografadas.
Usabilidade: Interface intuitiva e simples com atalhos para ações frequentes e autocompletar em buscas.
12. Fora do Escopo do MVP 2.0
As seguintes ferramentas não farão parte deste MVP para garantir o foco no stock e finanças:
Integração automática com terminais ou APIs do M-Pesa / e-Mola.
Gestão de clientes e programas de fidelização.
Aplicação mobile nativa e delivery avançado com rastreamento.
Nota Fiscal Eletrônica, Inteligência Artificial, folha de pagamento e contabilidade completa.
13. Métricas de Sucesso
Após o lançamento, o sistema será medido pelos seguintes indicadores:
Erros operacionais e desvios: Reduzir erros em pedidos em 80% e justificar 100% das quebras de cozinha.
Agilidade no Balcão: Reduzir o tempo de atendimento no balcão em 40%.
Rentabilidade: Aumentar o ticket médio em 15% e estabilizar as margens de lucro dos produtos mais vendidos.
Auditoria: 100% dos turnos devem apresentar registos da rotina de contagem cega de inventário.
