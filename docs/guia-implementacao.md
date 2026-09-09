# Guia de implementação do frontend (acolhe-web)

> Referenciado pelo `AGENTS.md` do repositório. Caminhos abaixo são relativos à raiz do `acolhe-web`.

> **Para o Claude:** este arquivo é a fonte de verdade para qualquer trabalho no `acolhe-web`.
> Leia-o inteiro antes de implementar. As regras da Parte A são obrigatórias em toda entrega.
> A Parte B é o backlog de correções: só execute um item quando a Joyce pedir explicitamente
> por ele. Não implemente nada deste arquivo por iniciativa própria.

Origem: revisão da Joyce no app rodando localmente (main de 2026-09-09). Atualizado conforme
ela aponta novos itens.

---

## Parte A — Regras permanentes (valem para toda implementação)

### A1. Componentes reutilizáveis primeiro

- Toda UI é composta a partir de componentes compartilhados. Páginas não devem repetir
  estrutura ou markup que já exista como componente.
- **Antes de criar qualquer componente novo, procure um existente.** Ordem de busca:
  1. `components/ui/` (base, shadcn-vue)
  2. `components/` e `components/forms/` (compostos do projeto)
  3. Só então crie um novo, em `components/ui/` se for primitivo, em `components/` se for composto.
- Um componente novo nasce já genérico e reutilizável, nunca acoplado a uma tela.

### A2. Nunca usar controles nativos do browser

- **Proibido** em qualquer tela: `<select>`, `<input type="date">`, `<input type="time">`,
  `<input type="datetime-local">`, `<input type="checkbox">`, `<input type="radio">` e
  qualquer calendário, dropdown ou picker nativo.
- Use sempre o componente próprio do projeto. Se ele ainda não existir, crie-o como componente
  base reutilizável (regra A1) e use-o em todos os lugares que precisarem dele.
- Motivo registrado: o picker nativo do Chrome apareceu no campo "Data e hora" de "Nova sessão"
  e foge completamente do visual do produto.

### A3. Dropdowns são sempre pesquisáveis

- Todo dropdown de seleção é um **combobox**: o usuário digita e a lista filtra pelo texto.
- Um `Select` fechado, sem campo de busca, não é aceitável em formulários.
- O combobox pesquisável é o componente base de dropdown do projeto. Depois de criado, ele
  substitui o `Select` simples nos formulários.

### A4. Mobile em toda alteração

- Qualquer tela ou componente alterado deve ser conferido em viewport de celular, não só desktop.
- Considere "conferido" apenas depois de olhar o resultado (screenshot ou navegador) em largura
  de celular.

### A5. Padrão visual: seguir o que existe, sem inventar

- Use exclusivamente as fontes, cores, tamanhos e espaçamentos já definidos no projeto.
- **Não** use emojis. **Não** use cores fortes, gradientes, sombras exageradas, ícones
  chamativos ou qualquer elemento fora do escopo visual do produto.
- O design pode mudar no futuro, mas será tudo de uma vez. Portanto **não gaste esforço em
  refinamento visual nem antecipe redesign**: siga o padrão atual como está.

Referência do padrão atual (já está no código, não é decisão nova):

| Aspecto | Onde / valor |
|---|---|
| Tokens | `assets/css/main.css` e `tailwind.config.ts` |
| Título / display | serif, Newsreader (`font-serif`) |
| Corpo | sans, Inter (`font-sans`) |
| Rótulos | mono maiúsculo, JetBrains Mono, classe `label-mono` |
| Paleta | fundo creme quente, tinta quase-preta, botões pretos, cinza quente em rótulos |
| Semânticas | vermelho discreto (erro), verde discreto (sucesso), laranja contido (aviso) |
| Raio | `--radius: 0.5rem` |
| Tema escuro | existe e deve continuar funcionando |

### A6. Erros sempre em português e compreensíveis para o usuário

- **Validação de formulário:** toda mensagem de campo obrigatório, formato inválido, tamanho
  mínimo/máximo etc. aparece em português. Nunca o texto padrão em inglês do Zod.
- **Erros de backend:** quando a API responde com erro, o usuário vê uma mensagem em português
  que explica o que aconteceu e, se possível, o que fazer. Nunca um erro técnico, nunca um toast
  genérico que esconde a causa real.
- Erros diferentes geram mensagens diferentes. Exemplo: conflito de horário (409), vínculo não
  ativo (403) e dado inválido (400) não podem virar a mesma frase.

### A7. Checklist antes de dar uma entrega como pronta

Percorra e confirme cada item. Se algum falhar, a entrega não está pronta.

- [ ] Reaproveitei componentes existentes; o que criei é reutilizável (A1).
- [ ] Nenhum controle nativo do browser (A2).
- [ ] Todo dropdown é pesquisável (A3).
- [ ] Conferido em viewport de celular (A4).
- [ ] Sem emojis, sem cores ou elementos fora do padrão; só tokens do projeto (A5).
- [ ] Mensagens de validação em português (A6).
- [ ] Erros da API traduzidos em mensagens específicas para o usuário (A6).
- [ ] `pnpm typecheck` passa.

---

## Parte B — Backlog de correções (executar somente quando a Joyce pedir)

Cada item lista a regra que ele corrige e onde o problema está hoje. As localizações são um
levantamento de 2026-09-09; reconfira as linhas antes de editar.

### B1. Criar os componentes base que faltam — regras A1, A2, A3

Componentes que não existem hoje e são pré-requisito para os demais itens:

| Componente | Substitui | Requisitos |
|---|---|---|
| Combobox pesquisável | `components/ui/select/` nos formulários | digitar e filtrar, teclado, estado vazio, mobile |
| Date picker | `<Input type="date">` | calendário próprio, pt-BR, mobile |
| DateTime picker (ou Date + Time) | `<Input type="datetime-local">` | idem, com seleção de hora |
| Checkbox | `<input type="checkbox">` | acessível, com label e descrição |

Antes de criar, verificar o que já existe em `components/ui/`: avatar, badge, button, card,
dialog, dropdown-menu, form, input, label, progress, select, separator, skeleton, sonner,
table, tabs, textarea.

### B2. Remover controles nativos das telas — regra A2

| Arquivo | Linha | Controle nativo hoje |
|---|---|---|
| `components/forms/NewSessionDialog.vue` | 110 | `<Input type="datetime-local">` (campo "Data e hora") |
| `components/forms/AssignActivityDialog.vue` | 132 | `<Input type="datetime-local">` |
| `components/forms/NewPatientDialog.vue` | 94 | `<Input type="date">` |
| `pages/invite/[token].vue` | 141 | `<input type="checkbox">` nos consentimentos |

Não há `<select>` nativo hoje.

### B3. Trocar os Selects por combobox pesquisável — regra A3

| Arquivo | Linha | Situação hoje |
|---|---|---|
| `components/forms/NewSessionDialog.vue` | 88 | `Select` para paciente, sem busca |
| `components/forms/AssignActivityDialog.vue` | 89 | `Select` para paciente e para template, sem busca |

### B4. Mensagens de validação em português — regra A6

Estado atual:

- Os schemas em `schemas/*.ts` não definem mensagens e não há `setErrorMap` nem locale
  configurado. As mensagens saem em inglês ("Required", "Invalid email", "String must contain
  at least 2 character(s)").

Direção esperada: configurar um error map global do Zod em português e, onde fizer sentido,
mensagens específicas por campo nos schemas.

### B5. Erros da API traduzidos para o usuário — regra A6

Estado atual:

- Os formulários fazem `catch` sem ler o erro e mostram um toast genérico fixo. Ocorre em
  `components/forms/NewPatientDialog.vue:35`, `NewSessionDialog.vue:65`,
  `AssignActivityDialog.vue:66`, `pages/login.vue:30`, `pages/invite/[token].vue:58` e `:72`,
  `pages/activities/[id].vue:56`, `pages/patients/[id]/index.vue:47`.
- O BFF (`server/utils/apiFetch.ts`) só repassa a resposta da API; não normaliza nem traduz o
  corpo do erro.
- A API Go responde em português, mas com texto técnico ("id inválido", "corpo inválido",
  "não autenticado", "convite pendente não encontrado") que hoje nem chega à tela.

Direção esperada: um ponto único que converta status e código de erro da API em mensagem de
usuário em português, usado por todos os formulários. Casos a distinguir no mínimo: 400
validação, 401 sessão expirada, 403 sem vínculo ativo, 404 não encontrado, 409 conflito de
horário, 5xx indisponível.

### B6. Auditoria de mobile nas telas existentes — regra A4

Ainda sem levantamento. Todas as telas em `pages/` precisam ser conferidas em viewport de
celular quando este item for pedido.

---

## Parte C — Itens ainda não registrados

_(a preencher conforme a revisão da Joyce continuar)_
