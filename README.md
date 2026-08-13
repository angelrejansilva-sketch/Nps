# Análise de NPS

Painel para análise detalhada das respostas de NPS (assistência técnica), pensado
como evolução do relatório em Power BI existente.

## Como funciona

- Abra o app e importe o CSV de respostas de NPS (mesmo formato do
  `nps_export.csv` usado hoje no Power BI: `id, created_at, contact_name,
  contact_phone, chamado, tipo_equipamento, problema_solucionado,
  recomendar_servico, motivo_nota, satisfacao_atp, avaliacao_produto,
  coment_adicional, data_do_chamado, status`).
- **O arquivo é processado inteiramente no navegador.** Nada é enviado para
  nenhum servidor — por isso os dados (que têm nome e telefone reais de
  clientes) nunca devem ser commitados neste repositório. O `.gitignore` já
  bloqueia `*.csv` e a pasta `/data/` por segurança.
- Depois de importar, use os filtros de data, equipamento e busca no topo —
  todos os gráficos e tabelas abaixo reagem ao filtro.

## O que o painel calcula (e por quê é diferente do Power BI atual)

O Power BI atual tem alguns problemas conhecidos (documentados em
`ANALISE_TECNICA_NPS.md` na pasta de origem dos dados): erro de precedência em
`QTD NPS`, denominador do NPS que não exclui explicitamente respostas
inválidas, classificação de equipamento frágil (centenas de comparações
exatas), e ranking de detratores ordenado na direção errada.

Este painel resolve isso na camada de normalização (`src/lib/normalize.ts`):

- **NPS só conta notas válidas (0-10).** Valores fora da faixa, com vírgula
  decimal ou texto não reconhecido são excluídos do cálculo e aparecem no
  painel "Qualidade dos dados", com o valor original visível.
- **"Não respondeu" é tratado à parte** da nota para calcular a taxa de
  resposta separadamente do NPS.
- **Classificação de equipamento por regras simples e visíveis**
  (`src/lib/classify.ts`), com um bucket "Outros" explícito em vez de
  "NÃO ENCONTRADO" silencioso.
- **Motivo da nota ordenado pela maior taxa de detratores primeiro**, para
  indicar onde agir.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Build de produção

```bash
npm run build
npm run start
```
