import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak
} from 'docx';

// Dimensões A4: 11906 x 16838 DXA. Margens: 1440 DXA (1 polegada).
// Largura útil de conteúdo: 11906 - 2880 = 9026 DXA.
const CONTENT_WIDTH = 9026;
const BORDER_COLOR = 'CBD5E1';
const PRIMARY_COLOR = '047857'; // Emerald 700
const SECONDARY_COLOR = '0F172A'; // Slate 900
const BG_HEADER = 'F1F5F9'; // Slate 100
const BG_CARD = 'F8FAFC';

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const tableBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function createParagraph(text, options = {}) {
  const { bold = false, size = 22, color = '334155', spacing = { after: 120 }, alignment = AlignmentType.LEFT, italics = false } = options;
  return new Paragraph({
    alignment,
    spacing,
    children: [
      new TextRun({
        text,
        bold,
        size,
        color,
        italics,
        font: 'Arial'
      })
    ]
  });
}

function createHeading(text, level = HeadingLevel.HEADING_1) {
  const sizes = {
    [HeadingLevel.HEADING_1]: 28,
    [HeadingLevel.HEADING_2]: 24,
    [HeadingLevel.HEADING_3]: 22
  };
  const colors = {
    [HeadingLevel.HEADING_1]: PRIMARY_COLOR,
    [HeadingLevel.HEADING_2]: SECONDARY_COLOR,
    [HeadingLevel.HEADING_3]: '1E293B'
  };

  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: sizes[level] || 24,
        color: colors[level] || SECONDARY_COLOR,
        font: 'Arial'
      })
    ]
  });
}

function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', bold: true, size: 21, color: '0F172A', font: 'Arial' }));
  }
  children.push(new TextRun({ text, size: 21, color: '334155', font: 'Arial' }));

  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 80 },
    children
  });
}

// Criação do Documento
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 28, bold: true, color: PRIMARY_COLOR, font: 'Arial' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 24, bold: true, color: SECONDARY_COLOR, font: 'Arial' },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 280 } } }
          }
        ]
      }
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: 'PROPOSTA COMERCIAL & TÉCNICA | TAKE AWAY RUI JÚNIOR',
                  size: 16,
                  color: '94A3B8',
                  font: 'Arial'
                })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100 },
              children: [
                new TextRun({ text: 'Take Away Rui Júnior • Confidencial • Página ', size: 16, color: '94A3B8', font: 'Arial' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '94A3B8', font: 'Arial' })
              ]
            })
          ]
        })
      },
      children: [
        // CAPA / CABEÇALHO PRINCIPAL
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 100 },
          children: [
            new TextRun({
              text: 'PROPOSTA TÉCNICA E COMERCIAL',
              size: 36,
              bold: true,
              color: PRIMARY_COLOR,
              font: 'Arial'
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'Sistema Integrado de Ponto de Venda (POS), Gestão Avançada de Estoque e Inteligência Financeira',
              size: 24,
              bold: true,
              color: SECONDARY_COLOR,
              font: 'Arial'
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: 'Preparado exclusivamente para: ',
              size: 20,
              color: '64748B',
              font: 'Arial'
            }),
            new TextRun({
              text: 'Take Away Rui Júnior (TK Rui Júnior)',
              size: 22,
              bold: true,
              color: '0F172A',
              font: 'Arial'
            })
          ]
        }),

        // Box de Dados do Documento
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [2600, 6426],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2600, type: WidthType.DXA },
                  shading: { fill: BG_HEADER, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Cliente Alvo:', bold: true, size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 6426, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Take Away Rui Júnior (Gerência & Administração)', size: 20, font: 'Arial' })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2600, type: WidthType.DXA },
                  shading: { fill: BG_HEADER, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Equipa de Desenvolvimento:', bold: true, size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 6426, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Ancha Jussa & António Moreira (Desenvolvedores de Soluções Web)', size: 20, font: 'Arial' })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2600, type: WidthType.DXA },
                  shading: { fill: BG_HEADER, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Contactos:', bold: true, size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 6426, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: '+258 86 223 8700 / +258 83 450 8556', size: 20, font: 'Arial' })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2600, type: WidthType.DXA },
                  shading: { fill: BG_HEADER, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Localização & Data:', bold: true, size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 6426, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Pemba, Cabo Delgado, Moçambique • Setembro de 2026', size: 20, font: 'Arial' })] })]
                })
              ]
            })
          ]
        }),

        createParagraph('', { spacing: { after: 200 } }),

        // 1. APRESENTAÇÃO
        createHeading('1. Apresentação e Propósito', HeadingLevel.HEADING_1),
        createParagraph(
          'Somos especialistas e desenvolvedores de Tecnologias de Informação com foco exclusivo em engenharia de software de alta performance e automação inteligente para negócios do ramo gastronómico e retalho local.'
        ),
        createParagraph(
          'A presente proposta foi elaborada especificamente para o Take Away Rui Júnior, com o intuito de solucionar de forma definitiva os maiores desafios da restauração rápida: a perda financeira provocada por desvios de stock não rastreados, a morosidade e falhas humanas no registo manual de vendas no balcão e a carência de relatórios financeiros exatos em tempo real.'
        ),
        createParagraph(
          'Diferente de sistemas genéricos de mercado que cobram mensalidades abusivas e exigem servidores locais pesados, propomos uma plataforma moderna, intuitiva, operando em nuvem com custo fixo de infraestrutura ZERO, permitindo que a gestão do Take Away Rui Júnior controle a sua operação a partir de qualquer dispositivo (telemóvel, tablet ou computador).'
        ),

        // 2. CONTEXTO E DIAGNÓSTICO
        createHeading('2. Diagnóstico Operacional: Problemas que Solucionamos', HeadingLevel.HEADING_1),
        createParagraph(
          'Atualmente, lanchonetes e negócios de Take Away enfrentam gargalos crónicos que corroem silenciosamente a margem de lucro do proprietário. Entre as principais vulnerabilidades identificadas estão:'
        ),
        createBullet('Vendas anotadas em cadernos ou comandas de papel estão sujeitas a erros de cálculo, perda de notas e vendas não registadas.', 'Registo Manual e Vulnerável no Balcão:'),
        createBullet('Falta de conferência rigorosa entre os produtos vendidos e os itens que efetivamente saíram do congelador ou prateleiras, gerando furos de stock recorrentes.', 'Desvios de Stock Invisíveis:'),
        createBullet('Comida queimada, vencida ou caída que não é documentada no momento da ocorrência, impossibilitando identificar quem foi responsável ou o impacto financeiro mensal.', 'Desperdício e Quebras na Cozinha Sem Registo:'),
        createBullet('O proprietário desconhece o Custo da Mercadoria Vendida (CMV) diário e a margem de contribuição líquida real de cada prato, lanche ou bebida comercializada.', 'Falta de Visibilidade Financeira Real:'),
        createBullet('A conferência tradicional de caixa no encerramento do expediente é lenta e sujeita a alterações quando o funcionário sabe de antemão qual valor "deveria" apresentar.', 'Fecho de Turno Sem Auditoria Independente:'),

        // 3. OBJECTIVOS ESTRATÉGICOS
        createHeading('3. Objectivos Estratégicos do Sistema', HeadingLevel.HEADING_1),
        createBullet('Baixa automática e imediata no inventário a cada venda finalizada no balcão.', '1. Eliminação de Desvios:'),
        createBullet('Interface simplificada com teclado numérico e atalhos rápidos para fechar pedidos em menos de 30 segundos.', '2. Agilidade Máxima no Atendimento:'),
        createBullet('Mecanismo de contagem física no fecho de turno sem exibir os saldos teóricos para o operador, destacando discrepâncias para o gerente.', '3. Auditoria Anti-Fraude (Contagem Cega):'),
        createBullet('Painéis com cálculo automático de CMV, lucro bruto estimado e valor financeiro do estoque parado em armazém.', '4. Inteligência Financeira e Margens:'),
        createBullet('Registo explícito de vendas por Dinheiro, M-Pesa, e-Mola e Cartão para conferência exata dos saldos em caixa.', '5. Múltiplos Meios de Pagamento Moçambicanos:'),

        new Paragraph({ children: [new PageBreak()] }),

        // 4. VISÃO GERAL DA SOLUÇÃO E ARQUITETURA
        createHeading('4. Visão Geral da Solução: Dois Módulos Isolados', HeadingLevel.HEADING_1),
        createParagraph(
          'Para garantir máxima segurança operacional e sigilo das informações do negócio, o sistema é arquitetado em dois módulos hermeticamente separados por permissões de acesso:'
        ),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [4513, 4513],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 4513, type: WidthType.DXA },
                  shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'MÓDULO ATENDENTE (BALCÃO / POS)', bold: true, color: 'FFFFFF', size: 21, font: 'Arial' })]
                    })
                  ]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 4513, type: WidthType.DXA },
                  shading: { fill: SECONDARY_COLOR, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'PAINEL GERENCIAL (ADMINISTRADOR)', bold: true, color: 'FFFFFF', size: 21, font: 'Arial' })]
                    })
                  ]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 4513, type: WidthType.DXA },
                  shading: { fill: BG_CARD, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                  children: [
                    createBullet('Catálogo visual com fotos, preços e estoque em tempo real.'),
                    createBullet('Carrinho com cálculo de totais e troco automático.'),
                    createBullet('Registo de formas de pagamento (Dinheiro, M-Pesa, e-Mola, Cartão).'),
                    createBullet('Botão de Registo de Quebras (desperdício documentado).'),
                    createBullet('Rotina de Contagem Cega de fecho de turno.'),
                    createBullet('Acesso restrito: NÃO visualiza lucros nem custos de compra.')
                  ]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 4513, type: WidthType.DXA },
                  shading: { fill: BG_CARD, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                  children: [
                    createBullet('Dashboard com Faturamento, CMV e Lucro Bruto do dia.'),
                    createBullet('Indicador de Capital Imobilizado (valor em Meticais no estoque).'),
                    createBullet('Painel de Auditoria de Contagens Cegas com apuração de desvios.'),
                    createBullet('Gestão de Produtos, preços de compra/venda e margem %.'),
                    createBullet('Histórico auditável de movimentos de stock e vendas.'),
                    createBullet('Relatórios consolidados para tomada de decisão.')
                  ]
                })
              ]
            })
          ]
        }),

        createParagraph('', { spacing: { after: 180 } }),

        // 5. FUNCIONALIDADES DETALHADAS
        createHeading('5. Funcionalidades Detalhadas do Sistema', HeadingLevel.HEADING_1),

        createHeading('5.1 Ponto de Venda Ágil (POS) para Atendentes', HeadingLevel.HEADING_2),
        createBullet('Pesquisa de produtos por código ou nome com autocompletar instantâneo.', 'Busca em Tempo Real:'),
        createBullet('Produtos com estoque zerado são sinalizados visualmente, prevenindo promessas indevidas a clientes.', 'Proteção de Stock Mínimo:'),
        createBullet('Suporte a impressão em impressoras térmicas padrão ou partilha digital de comprovativos.', 'Recibos e Cupons:'),
        createBullet('Possibilidade de registar perdas imediatas na cozinha justificando o motivo (queimado, caiu, prazo de validade).', 'Registo de Quebras:'),

        createHeading('5.2 O Mecanismo Inovador de "Contagem Cega"', HeadingLevel.HEADING_2),
        createParagraph(
          'A "Contagem Cega" é um dos maiores pilares de auditoria do sistema: ao final de cada turno, o atendente acede a um formulário simples onde digita quantas unidades físicas de refrigerantes, cervejas ou carnes existem nas prateleiras e geleiras. O sistema NÃO revela qual é a quantidade teórica esperada. Assim que o atendente submete, o Painel do Gerente compara a contagem física com o histórico de vendas e destaca imediatamente qualquer divergência em Meticais (MT), eliminando adulterações e inibindo desvios.'
        ),

        createHeading('5.3 Gestão Financeira e Relatórios para a Gerência', HeadingLevel.HEADING_2),
        createBullet('Exibição instantânea do total faturado hoje, número de pedidos e ticket médio.', 'Indicadores em Tempo Real:'),
        createBullet('O sistema desconta o preço de compra de cada item vendido e apresenta o lucro líquido operacional gerado no dia.', 'Cálculo de CMV e Lucro Bruto:'),
        createBullet('Visualização exata de quanto dinheiro o Take Away tem investido fisicamente em mercadoria armazenada.', 'Capital Parado no Estoque:'),
        createBullet('Identificação clara de quais artigos trazem mais receita e quais dão margem de lucro baixa.', 'Classificação de Rentabilidade:'),

        new Paragraph({ children: [new PageBreak()] }),

        // 6. DIFERENCIAIS COMPETITIVOS
        createHeading('6. Principais Diferenciais da Nossa Solução', HeadingLevel.HEADING_1),
        createBullet('Não cobramos percentagens ou comissões por venda. 100% da receita gerada pertence ao Take Away.', 'Taxa Zero por Pedido / Transação:'),
        createBullet('Ao contrário de softwares tradicionais (como Primavera ou SAGE) que exigem servidores caros e licenças anuais de milhares de dólares, nosso sistema roda em nuvem com custos de servidor 0,00 MT.', 'Infraestrutura Moderna em Nuvem:'),
        createBullet('Funciona no computador do caixa, no telemóvel do gerente ou no tablet do balcão sem necessidade de instalar aplicativos pesados.', 'Acesso Multi-Dispositivo:'),
        createBullet('Interface desenhada especificamente para a realidade de Moçambique, já adaptada a M-Pesa, e-Mola e moeda Metical (MT).', 'Adaptado ao Mercado Local:'),

        // 7. RECURSOS NECESSÁRIOS
        createHeading('7. Recursos Mínimos Necessários no Local', HeadingLevel.HEADING_1),
        createParagraph(
          'Para implantar o sistema no Take Away Rui Júnior, a infraestrutura exigida é mínima e aproveita equipamentos já existentes no estabelecimento:'
        ),
        createBullet('1 Computador, portátil, tablet ou smartphone para o operador de balcão e outro para o gerente.', 'Dispositivos:'),
        createBullet('Conexão de internet Wi-Fi estável ou dados móveis (3G/4G).', 'Conectividade:'),
        createBullet('Impressora térmica USB/Bluetooth de 58mm ou 80mm para impressão física de cupom ao cliente (Opcional).', 'Impressora de Recibos:'),
        createBullet('Sessão prática presencial de 2 a 3 horas com a gerência e os funcionários para domínio completo das rotinas.', 'Capacitação:'),

        // 8. MODELOS DE CONTRATAÇÃO E CONDIÇÕES COMERCIAIS
        createHeading('8. Modelos de Contratação e Opções Comerciais', HeadingLevel.HEADING_1),
        createParagraph(
          'Com o propósito de oferecer flexibilidade e respeito ao planeamento orçamental do Take Away Rui Júnior, apresentamos 3 opções comerciais competitivas:'
        ),

        // Tabela Comercial
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [2200, 2400, 4426],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2200, type: WidthType.DXA },
                  shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'MODELO', bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2400, type: WidthType.DXA },
                  shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'INVESTIMENTO', bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 4426, type: WidthType.DXA },
                  shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BENEFÍCIOS E CONDIÇÕES', bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })] })]
                })
              ]
            }),
            // Opção A
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2200, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'OPÇÃO A:', bold: true, size: 21, color: PRIMARY_COLOR, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Aquisição Definitiva (Licença Perpétua)', size: 19, font: 'Arial' })] })
                  ]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2400, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: '51.600 MT', bold: true, size: 24, color: SECONDARY_COLOR, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: '(50% na adjudicação / 50% na entrega e homologação)', size: 18, color: '64748B', font: 'Arial' })] })
                  ]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 4426, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    createBullet('Propriedade definitiva do software sem mensalidades obrigatórias.'),
                    createBullet('Setup, parametrização do cardápio e importação de stock inclusos.'),
                    createBullet('12 meses de suporte técnico e atualizações preventivas gratuitas.')
                  ]
                })
              ]
            }),
            // Opção B
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2200, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'OPÇÃO B:', bold: true, size: 21, color: PRIMARY_COLOR, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Assinatura Mensal (SaaS)', size: 19, font: 'Arial' })] })
                  ]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2400, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Setup: 0,00 MT', bold: true, size: 20, color: PRIMARY_COLOR, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: '4.500 MT / mês', bold: true, size: 24, color: SECONDARY_COLOR, font: 'Arial' })] })
                  ]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 4426, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    createBullet('Zero custo inicial de investimento.'),
                    createBullet('Suporte técnico contínuo e manutenção inclusa durante todo o contrato.'),
                    createBullet('Ideal para validação operacional com baixo desembolso inicial.')
                  ]
                })
              ]
            }),
            // Opção C
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2200, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'OPÇÃO C:', bold: true, size: 21, color: PRIMARY_COLOR, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Anual com Desconto (Melhor Valor)', size: 19, font: 'Arial' })] })
                  ]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2400, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: '45.000 MT / ano', bold: true, size: 24, color: SECONDARY_COLOR, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: '(Equivalente a 3.750 MT/mês - economia de 9.000 MT)', size: 18, color: '64748B', font: 'Arial' })] })
                  ]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 4426, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    createBullet('Maior economia financeira a médio e longo prazo.'),
                    createBullet('Garantia de 12 meses ininterruptos de suporte prioritário.'),
                    createBullet('Sem necessidade de controle administrativo mensal de faturas.')
                  ]
                })
              ]
            })
          ]
        }),

        createParagraph('', { spacing: { after: 200 } }),

        // 9. CUSTOS OPERACIONAIS DE INFRAESTRUTURA
        createHeading('9. Custos Operacionais de Infraestrutura (Nuvem)', HeadingLevel.HEADING_1),
        createParagraph(
          'Graças à nossa arquitetura em nuvem Serverless integrada com Supabase PostgreSQL e Vercel, o Take Away Rui Júnior opera sem a necessidade de alugar servidores caros ou manter técnicos no local:'
        ),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [3500, 3500, 2026],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 3500, type: WidthType.DXA },
                  shading: { fill: BG_HEADER, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Componente', bold: true, size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 3500, type: WidthType.DXA },
                  shading: { fill: BG_HEADER, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Especificação Técnica', bold: true, size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2026, type: WidthType.DXA },
                  shading: { fill: BG_HEADER, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Custo Anual', bold: true, size: 20, font: 'Arial' })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 3500, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Hospedagem da Aplicação', bold: true, size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 3500, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Vercel Cloud Serverless (Edge Global com SSL gratuito)', size: 19, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2026, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '0,00 MT', bold: true, color: PRIMARY_COLOR, size: 20, font: 'Arial' })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 3500, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Banco de Dados & Storage', bold: true, size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 3500, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Supabase PostgreSQL com Connection Pooling e Backups', size: 19, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2026, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '0,00 MT', bold: true, color: PRIMARY_COLOR, size: 20, font: 'Arial' })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: tableBorders,
                  width: { size: 3500, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Domínio Web Personalizado', bold: true, size: 20, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 3500, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Endereço próprio oficial na internet (ex: tkruijunior.co.mz)', size: 19, font: 'Arial' })] })]
                }),
                new TableCell({
                  borders: tableBorders,
                  width: { size: 2026, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '~1.500 MT / ano', size: 19, font: 'Arial' })] })]
                })
              ]
            })
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // 10. SEGURANÇA E PROPRIEDADE
        createHeading('10. Confidencialidade e Propriedade de Dados', HeadingLevel.HEADING_1),
        createParagraph(
          'Propriedade Total dos Dados do Cliente: Todas as informações operacionais geradas — histórico de vendas, preços, faturamento diário, fichas técnicas e inventário de mercadorias — pertencem com exclusividade ao Take Away Rui Júnior. A nossa equipa de desenvolvimento garante absoluto sigilo profissional, sem comercialização ou partilha com terceiros sob qualquer pretexto.'
        ),
        createParagraph(
          'Licença de Utilização: O software é concedido mediante licença formal de uso para operação exclusiva do Take Away Rui Júnior, assegurando estabilidade jurídica e proteção do investimento realizado.'
        ),

        // 11. CRONOGRAMA DE IMPLANTAÇÃO
        createHeading('11. Cronograma de Implantação e Entrada em Operação', HeadingLevel.HEADING_1),
        createParagraph(
          'A disponibilização do sistema é rápida, já que o núcleo tecnológico do sistema já se encontra estruturado e funcional:'
        ),
        createBullet('Configuração das contas cloud (Supabase + Vercel) e validação do domínio do Take Away.', 'Semana 1: Configuração do Ambiente:'),
        createBullet('Registo das categorias, produtos, preços de compra, preços de venda e estoque inicial real.', 'Semana 2: Parametrização do Catálogo:'),
        createBullet('Treinamento dos atendentes de balcão e gerência com simulações práticas de vendas e contagem cega.', 'Semana 3: Capacitação da Equipa:'),
        createBullet('Entrada oficial do sistema em produção no balcão com acompanhamento técnico presencial.', 'Semana 4: Go-Live & Homologação:'),

        // 12. CONCLUSÃO E ACEITE
        createHeading('12. Conclusão e Termo de Aceitação', HeadingLevel.HEADING_1),
        createParagraph(
          'O Sistema Integrado de Gestão para o Take Away Rui Júnior não representa um custo operacional, mas sim um investimento com retorno quase imediato. Ao estancar desvios de mercadoria, documentar quebras de cozinha e acelerar as vendas de balcão, o sistema economiza milhares de Meticais mensalmente logo no primeiro trimestre.'
        ),
        createParagraph(
          'Estamos à inteira disposição da administração do Take Away Rui Júnior para agendar uma demonstração prática em tempo real do sistema em funcionamento.'
        ),

        createParagraph('', { spacing: { after: 300 } }),

        // Assinaturas
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [4513, 4513],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  width: { size: 4513, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '______________________________________', color: '94A3B8', size: 20, font: 'Arial' })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Take Away Rui Júnior', bold: true, size: 21, color: SECONDARY_COLOR, font: 'Arial' })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'A Gerência / Direção', size: 19, color: '64748B', font: 'Arial' })] })
                  ]
                }),
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  width: { size: 4513, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '______________________________________', color: '94A3B8', size: 20, font: 'Arial' })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ancha Jussa & António Moreira', bold: true, size: 21, color: PRIMARY_COLOR, font: 'Arial' })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Equipa de Desenvolvimento de Software', size: 19, color: '64748B', font: 'Arial' })] })
                  ]
                })
              ]
            })
          ]
        })
      ]
    }
  ]
});

async function run() {
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve('docs', 'Proposta_Comercial_Take_Away_Rui_Junior.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('DOCX_GENERATED_SUCCESS: ' + outPath);
}

run().catch(console.error);
