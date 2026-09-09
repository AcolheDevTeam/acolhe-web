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
- [ ] Mensagens de validação em português nos campos que toquei (A6).
- [ ] Erros da API que meu fluxo pode receber viram mensagens específicas para o usuário (A6).
- [ ] `pnpm typecheck` passa.

---

## Parte B — Backlog de correções (executar somente quando a Joyce pedir)

Cada item lista a regra que ele corrige e onde o problema está hoje. As localizações são um
levantamento de 2026-09-09; reconfira as linhas antes de editar.

### B1. Criar os componentes base que faltam — regras A1, A2, A3

**Status: parcialmente feito** na branch `feat/componentes-base-formulario` (2026-09-09).

| Componente | Substitui | Situação |
|---|---|---|
| `components/ui/custom-dropdown/` (`CustomDropdown`) | `Select` nos formulários | **Feito.** Popover + Command; busca por digitação, teclado, estado vazio, descrição opcional por item, funciona dentro de `FormControl`. |
| `components/ui/date-picker/` (`DatePicker`) | `<Input type="date">` | **Feito.** Calendário próprio pt-BR, mês e ano por `CustomDropdown` pesquisável, `minDate`/`maxDate`, valor `YYYY-MM-DD`. |
| `components/ui/date-time-picker/` (`DateTimePicker`) | `<Input type="datetime-local">` | **Feito.** `DatePicker` + hora e minuto em `CustomDropdown`; valor ISO UTC; empilha no mobile. |
| `components/ui/checkbox/` (`Checkbox`) | `<input type="checkbox">` | **Feito** (shadcn-vue sobre reka-ui; acessível, `model-value` booleano, usado com `<label for>`). |

Primitivos shadcn-vue adicionados para isso: `popover`, `command`, `calendar`. Dependência
`@internationalized/date` fixada na mesma versão usada pelo `reka-ui` (evita erro de tipos).

Uso dentro de formulários vee-validate: usar `v-slot="{ value, handleChange }"` e ligar
`:model-value="value ?? ''"` + `@update:model-value="handleChange"`. Não usar
`v-bind="componentField"` nesses componentes: o `onBlur` do gatilho dispara validação antes
do usuário terminar de escolher.

### B2. Remover controles nativos das telas — regra A2

| Arquivo | Controle nativo | Situação |
|---|---|---|
| `components/forms/NewSessionDialog.vue` | `<Input type="datetime-local">` | **Feito**, usa `DateTimePicker` com `maxDate` = hoje. |
| `components/forms/AssignActivityDialog.vue` | `<Input type="datetime-local">` | **Feito**, usa `DateTimePicker` com `minDate` = hoje. |
| `components/forms/NewPatientDialog.vue` | `<Input type="date">` | **Feito**, usa `DatePicker` com `maxDate` = hoje (nascimento nunca é futuro). |
| `pages/invite/[token].vue` | `<input type="checkbox">` nos consentimentos | **Feito**, usa `Checkbox` com label associado e descrição via `aria-describedby`. |

Não há `<select>` nativo hoje.

### B3. Trocar os Selects por combobox pesquisável — regra A3

**Feito** na branch `feat/componentes-base-formulario`: paciente em `NewSessionDialog`,
paciente e template em `AssignActivityDialog` usam `CustomDropdown`. `components/ui/select/`
continua no repo, mas não é mais usado em formulários; não reintroduzir.

### B4. Mensagens de validação em português — regra A6

Estado atual:

- Os schemas em `schemas/*.ts` não definem mensagens e não há `setErrorMap` nem locale
  configurado. As mensagens saem em inglês ("Required", "Invalid email", "String must contain
  at least 2 character(s)").

**Feito em 2026-09-09.** `utils/zod-pt-br.ts` define o error map global em português e
`plugins/validation.ts` o registra com `z.setErrorMap` (junto da configuração do vee-validate).
Qualquer schema novo já sai em português; mensagens específicas por campo continuam tendo
prioridade e devem ser usadas quando o texto genérico não explica o suficiente.

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

**Feito em 2026-09-09.** `utils/api-error.ts` expõe `apiErrorMessage(err, overrides)` com textos
padrão por status (400, 401, 403, 404, 409, 410, 429, 5xx, sem rede). Cada formulário
sobrescreve só os status com significado próprio no seu contexto (ex.: 403 em "Nova sessão" é
vínculo não ativo; 401 no login é credencial errada). Todos os `catch` de `components/forms` e
`pages` usam o helper. Regra para código novo: nunca `catch {}` com texto fixo; sempre
`apiErrorMessage` com overrides do contexto.

### B6. Auditoria de mobile nas telas existentes — regra A4

Ainda sem levantamento. Todas as telas em `pages/` precisam ser conferidas em viewport de
celular quando este item for pedido.

---

## Parte C — Itens ainda não registrados

### C1. Paciente não consegue entrar após aceitar o convite — apontado em 2026-09-09

Diagnóstico (main/develop de 2026-09-09): link, aceite e login funcionam. O que quebra é o
pós-login: `pages/login.vue` sempre navega para `/dashboard`, e o middleware
`psychologist-only` redireciona quem não é psicólogo para `/dashboard` de novo, gerando loop
de redirecionamento e erro 500. Como o `navigateTo` está dentro do mesmo `try` da chamada de
login, a falha de navegação cai no `catch` e a tela mostra "E-mail ou senha inválidos", mesmo
com a senha correta (login na API responde 200). Exemplo concreto da regra A6: mensagem
genérica escondendo a causa real. Não corrigir em `pages/login.vue` fora do PR #16, que já
altera esse arquivo (evitar conflito).

**Resolvido em 2026-09-09** com o merge do PR #17 (acolhe-api, contexto e endpoints do
paciente) e do PR #16 (acolhe-web, redirecionamento por papel, layout e home em `/patient`).
Verificado localmente: criar paciente, aceitar convite, logar pela tela e cair em `/patient`;
paciente barrada em `/api/patients` (403) e em `/dashboard` (redireciona para `/patient`).

### C2. Substituir o envio manual do convite por e-mail transacional — apontado em 2026-09-09

- Hoje o diálogo "Novo paciente" só mostra o link para copiar ("mock" de envio).
- Requisito: serviço gratuito por enquanto, usando o e-mail pessoal da Joyce como remetente, e
  depois trocar por um domínio pago sem reescrever o envio.
- Implementação já em andamento: PR #18 da acolhe-api (ACO-55, entrega por SMTP com
  `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `FRONTEND_URL`) e
  PR #15 do acolhe-web (ACO-57, status real de entrega e fallback de cópia).
- Provedor escolhido: **Brevo** via SMTP (`smtp-relay.brevo.com:587`, STARTTLS), remetente
  pessoal verificado; depois troca para domínio próprio só mudando `SMTP_FROM`.
- Revisão de 2026-09-09: PR #18 (API) devolvia 503 e fazia rollback do paciente quando o
  e-mail falhava, sem link de fallback, e não enviava no reenvio; PR #15 (web) chamava rotas
  `/invites` inexistentes e removia a lista de documentos de consentimento (quebra o aceite e a
  tela da Figura 3). Ambos fechados; refeitos em novos PRs a partir de `develop`.
- Regras para a implementação: criar o paciente sempre; tentar enviar; devolver
  `deliveryStatus` (`sent`/`failed`/`disabled`) e manter o link copiável; enviar também no
  reenvio; texto do e-mail em português com nome da psicóloga, validade e link; nunca registrar
  o token em log.
- **Feito em 2026-09-09**: PR #20 da acolhe-api (pacote `internal/mailer`, envio na criação e no
  reenvio, `FRONTEND_URL`) e PR do acolhe-web na branch `feat/aco-57-convite-email-web`
  (`deliveryStatus` no BFF, textos únicos em `utils/invitation.ts`, entrada `/invite`). Envio real
  verificado com Brevo. Observação operacional: usar `smtp-relay.sendinblue.com:587`, porque o
  certificado TLS do Brevo é emitido para esse nome.
