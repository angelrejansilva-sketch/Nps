# Análise de NPS

Painel para análise detalhada das respostas de NPS (assistência técnica), pensado
como evolução do relatório em Power BI existente. Os dados ficam num banco
Supabase (não mais só num CSV local) e o acesso exige login.

## Arquitetura

- **Banco de dados:** projeto Supabase existente (`angelrejansilva-sketch's
  Project`), que já roda um outro sistema em produção (automação de
  WhatsApp/CRM). O NPS usa tabelas próprias e isoladas — `nps_responses` e
  `nps_imports` — sem tocar nas tabelas do outro sistema.
- **Autenticação:** reaproveita o login que já existe (tabela `profiles` /
  Supabase Auth) para essa mesma organização. Não é preciso criar conta nova
  para quem já acessa o outro sistema.
- **Permissões (RLS):**
  - Qualquer usuário autenticado (com linha em `profiles`) pode **ver** os
    dados de NPS.
  - Só perfis com `role` = `admin` ou `analista` podem **importar/atualizar**
    dados (perfis `atendente` só visualizam).
- **Importação:** o CSV é lido e normalizado no navegador (nada de dado bruto
  vai para o Git) e depois enviado ao Supabase em lotes, via
  `src/lib/supabase/queries.ts`. Reimportar o mesmo arquivo atualiza
  (`upsert`) as respostas já existentes pelo `id` original — não duplica.

## Como usar

1. Rode o app (`npm install && npm run dev`) e acesse
   [http://localhost:3000](http://localhost:3000).
2. Faça login com um e-mail/senha já cadastrado em `profiles`.
3. Se for a primeira vez (base vazia) e seu perfil for admin/analista, a tela
   pede para importar o CSV (mesmo formato do `nps_export.csv` usado hoje no
   Power BI: `id, created_at, contact_name, contact_phone, chamado,
   tipo_equipamento, problema_solucionado, recomendar_servico, motivo_nota,
   satisfacao_atp, avaliacao_produto, coment_adicional, data_do_chamado,
   status`).
4. Depois disso, o painel carrega direto do Supabase — não precisa reimportar
   toda vez. Use "Atualizar base" quando tiver um export mais recente.

## Variáveis de ambiente

Crie `.env.local` (já no `.gitignore`, nunca commitar) com:

```
NEXT_PUBLIC_SUPABASE_URL=https://ytnldgaycehvgpbhnras.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key do projeto>
```

Essas são as mesmas variáveis que devem ser configuradas no ambiente de
deploy (ex: Vercel). A chave é a `anon`/`publishable` — pública por design,
protegida pelas políticas de RLS descritas acima. **A `service_role` key
nunca deve ser usada no app** (não é necessária, já que toda leitura/escrita
passa pela sessão do usuário logado + RLS).

Para a "Análise por IA" (seção abaixo), é preciso também definir
`ANTHROPIC_API_KEY` — essa é uma chave secreta de verdade (não
`NEXT_PUBLIC_`), então **nunca vai para o Git**, nem no `.env.production`.
Defina em `.env.local` para rodar localmente, e no Vercel em Project →
Settings → Environment Variables para produção. Veja `.env.example`.

## Análise por IA

Seção "Análise por IA" no painel: um chat que responde perguntas em
linguagem natural sobre os dados atualmente filtrados (ex: "quais os
principais motivos de detrator?", "como está o NPS por segmento?").

Como funciona (`src/app/api/ask-ai/route.ts`):

- É uma rota server-side do Next.js, protegida por login (verifica a sessão
  Supabase antes de responder — mesmo controle de acesso do resto do app).
- O navegador monta um **resumo agregado** dos dados já filtrados no painel
  (`src/lib/aiSummary.ts`) — NPS, taxas, rankings por segmento/marca/modelo/
  motivo, evolução mensal e uma amostra de comentários — e manda esse JSON
  junto com a pergunta para a rota.
- A rota chama a API da Claude (`claude-opus-5`, streaming) com esse JSON de
  contexto. **Nunca envia nome, telefone ou número de chamado** — só
  agregados e comentários anonimizados.
- A resposta é transmitida em streaming de volta para o navegador (efeito de
  "digitando").

Essa abordagem (mandar um resumo agregado, em vez de dar à IA acesso direto
ao banco) foi escolhida de propósito: é mais simples, mais barata, mais
rápida, e elimina qualquer risco de a IA gerar/rodar consultas SQL abertas
contra o Supabase.

## O que o painel calcula (e por quê é diferente do Power BI atual)

O Power BI atual tem alguns problemas conhecidos (documentados em
`ANALISE_TECNICA_NPS.md` na pasta de origem dos dados): erro de precedência em
`QTD NPS`, denominador do NPS que não exclui explicitamente respostas
inválidas, classificação de equipamento frágil (centenas de comparações
exatas), e ranking de detratores ordenado na direção errada.

Este painel resolve isso na camada de normalização (`src/lib/normalize.ts`),
aplicada tanto na importação quanto na leitura dos dados do Supabase:

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
- **Telefone limpo** — o export original tinha `contact_phone` salvo como
  número (ex: `553188000000.0`); isso é corrigido na importação.

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

## Estado atual dos dados

A base do Supabase (`nps_responses`) está **vazia** neste momento — o schema
e as políticas de RLS já foram aplicados, mas a carga histórica do
`nps_export.csv` (42.690 linhas) ainda precisa ser feita por um perfil
admin/analista pela própria tela de importação do app (rodando localmente ou
já publicado). Isso não pôde ser feito a partir deste ambiente de
desenvolvimento porque o acesso de rede aqui é restrito a chamadas via
ferramentas MCP — não alcança diretamente `*.supabase.co` a partir de
processos locais (browser/Node), então a importação real precisa acontecer
num ambiente com rede normal (sua máquina ou o deploy).
