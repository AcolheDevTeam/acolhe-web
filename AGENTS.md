# Acolhe Web — guia para agentes

Instruções de desenvolvimento válidas para **qualquer harness** (Claude Code,
Codex, opencode, Cursor, Gemini CLI…). Este é o arquivo-fonte; o `CLAUDE.md`
apenas importa este conteúdo.

Frontend do Acolhe (SaaS de psicologia): **Nuxt 3, SSR-first, LGPD-compliant**.
`develop` é a **source of truth** (já adaptada ao design planejado). Faça branches
a partir dela.

## Regra 0 — ler o guia de implementação antes de qualquer tarefa

O arquivo **`docs/guia-implementacao.md`** é a fonte de verdade para o que a
Joyce espera do frontend. Leia-o inteiro antes de começar e siga-o na íntegra:

- **Parte A** — regras obrigatórias em toda entrega: componentes reutilizáveis,
  nenhum controle nativo do browser, dropdowns sempre pesquisáveis, mobile em
  toda alteração, padrão visual sem invenção, erros em português e específicos.
  Termina com o checklist que toda entrega precisa passar.
- **Parte B** — backlog de correções já mapeadas. **Só execute um item quando a
  Joyce pedir explicitamente por ele.** Não implemente nada da Parte B por
  iniciativa própria.

Em caso de conflito entre este `AGENTS.md` e o guia, o guia prevalece.

## Regra 1 — sempre consultar o design antes de mexer em tela

O design de referência, desde 2026-10-09, é o protótipo "Acolhe — novo design"
(41 telas), versionado no repo:

```
docs/design/prototipo/*.dc.html      # uma tela por arquivo (HTML com estilos inline)
docs/design/prototipo/canvas.json    # título de cada tela e as seções
docs/design/novo-design.md           # tokens, componentes e mapa tela × rota
```

Antes de **criar ou alterar qualquer tela/componente visual**, abra o arquivo da
tela correspondente (o título está em `canvas.json`) e o mapa em
`novo-design.md` — layout, textos, hierarquia e navegação devem espelhar o
protótipo. Os `.dc.html` são protótipos: `{{x}}`, `<sc-if>` e `<sc-for>` são
marcação de protótipo, não código a copiar. Para achar a tela:

```bash
grep -l "<termo>" docs/design/prototipo/*.dc.html
```

O PDF antigo (`docs/design/acolhe-telas.pdf`, v0.3) fica só como histórico. Se um
comportamento não estiver no protótipo, siga o padrão das telas irmãs já
implementadas — não invente um layout novo.

## Regra 2 — UI é shadcn-vue + design system editorial

Toda UI usa **shadcn-vue** sobre o design system interno. **Reutilize** o que já
existe antes de criar:

- Primitivos em `components/ui/` (Button, Card, Dialog, Badge, Select…).
- Componentes de app: `PageHeader`, `PatientShell`, `ActivityRow`, `SessionRow`,
  `StatCard`, diálogos em `components/forms/` (`NewSessionDialog`,
  `AssignActivityDialog`), etc.
- Convenções visuais recorrentes: `PageHeader` no topo, rótulos de seção com a
  classe `label-mono`, empty states com borda tracejada, tipografia serif
  (`display-serif`, `font-serif`). Copie o padrão de uma página irmã
  (`pages/sessions/index.vue`, `pages/dashboard.vue`).

Para **adicionar um componente shadcn** que ainda não exista:

- **Claude Code:** use a skill `shadcn`.
- **Outras harnesses:** use o MCP server do shadcn se disponível, ou o CLI:
  `pnpm dlx shadcn-vue@latest add <componente>`.

Não substitua componentes do design system por HTML/Tailwind cru.

## Regra 3 — dados via BFF (o token nunca vai ao browser)

Toda chamada à API Go passa por **server routes** do Nuxt (`server/api/*`), que
injetam `Authorization: Bearer` a partir do cookie `httpOnly acolhe_session`
usando o helper `server/utils/apiFetch.ts`. O token nunca chega ao cliente (LGPD).

- Valide o corpo no servidor com o schema Zod correspondente (`schemas/`).
- Composables (`composables/use*.ts`) usam `useFetch` com **chave de cache por
  contexto** (ex.: `sessions-${patientId}`) para evitar cache cruzado entre
  pacientes — requisito de LGPD.

## Fluxo de trabalho

- Gerenciador de pacotes: **pnpm** (fixado em `packageManager`).
- Antes de considerar uma tarefa pronta, rode **`pnpm run typecheck`** e garanta
  que seus arquivos passam limpos.
- Um PR = um assunto. Não misture mudanças não relacionadas na mesma branch.
- Mensagens de commit e código no idioma e estilo do repositório (pt-BR nos
  textos de UI e comentários; siga a densidade de comentários do código ao redor).
