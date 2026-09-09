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

**Shell feito em 2026-09-09** (branch `feat/mobile-shell`): abaixo de `md` a sidebar vira um
menu lateral (`Sheet`) aberto por botão numa barra superior; `PageHeader` e os containers de
página usam `px-4` no celular e `px-8` a partir de `md`; `DialogContent` cabe na tela
(`w-[calc(100%-2rem)]`, altura máxima com rolagem); ações da ficha do paciente ficam só com
ícone abaixo de `sm`. Conferido em 390px: dashboard, pacientes, ficha, sessões, atividades,
`/invite`, `/patient`; sem rolagem horizontal.

Pendente de auditoria fina: `pages/sessions/[id]`, `pages/activities/[id]`, tela de aceite com
muitos documentos, e comportamento dos popovers (calendário/dropdown) em telas muito estreitas
(&lt; 360px).

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

### C3. Fluxo de atividades confuso: "template" vs. "atividade" e Templates sem tela — apontado em 2026-09-09

Diagnóstico (develop de 2026-09-09):

- O item "Diário de pensamentos (RPD)" que aparece no dropdown do diálogo "Atribuir atividade"
  **não é uma atividade registrada**: é um *template* da biblioteca, vindo de
  `GET /activities/templates`. Ele não está em nenhuma migration ou seed do repositório da API;
  foi inserido direto no banco (linha criada em 2026-09-09 15:58 UTC, ligada à organização e ao
  usuário da Joyce, versão 1, **zero campos** em `activity_field`). Como a API não tem endpoint
  de criação de template, só pode ter sido SQL manual ou script de teste. Sem campos, a paciente
  não teria o que responder. Por isso a página `/activities` mostra "Nenhuma atividade no
  momento": ainda não existe nenhuma *atribuição*, só esse template de teste.
- Não é um seed: não existe seed de template no repositório, o que é coerente com a
  funcionalidade ainda não estar pronta.
- Junto com o template, a mesma inserção (mesmo segundo) criou **3 atribuições** para a paciente
  Mariana Costa, todas `pending`, duas já vencidas (06/08 e 20/08) e uma para 13/09, atribuídas
  por `psi@acolhe.dev`. Elas existiam no banco e a API as devolvia, mas `/activities` mostrava
  "Nenhuma atividade no momento". Ver bug abaixo.
- **Removido em 2026-09-09** (a pedido da Joyce): template, 3 atribuições e campos (zero)
  apagados do banco local numa transação. Banco ficou com 0 templates e 0 atribuições.

**Bug real encontrado no caminho** — `pages/activities/index.vue` agrupa a fila pelos status
`responded`, `overdue`, `assigned` e `reviewed` (vocabulário do design), mas a API e o próprio
tipo `ActivityStatus` em `types/index.ts` usam `pending`, `in_progress`, `submitted`, `reviewed`,
`expired`, `canceled`. Só `reviewed` coincide. Qualquer atividade pendente ou respondida some da
página e ela cai no vazio. Correção sugerida: mapear no web (`submitted` → "Aguardando revisão",
`pending`/`in_progress` com `dueAt` no passado → "Atrasadas", `pending`/`in_progress` →
"Atribuídas", `reviewed` → "Revisadas"), sem criar status novo na API. A página da paciente
(`pages/patients/[id]/activities.vue`) não filtra por status, por isso lá elas apareceriam.
- A parte de Templates **não está pronta**: o item "Templates" da sidebar está com
  `disabled: true` (`components/AppSidebar.vue`), não existe `pages/templates`, e a API só expõe
  listagem (`GET /activities/templates`). Não há endpoint nem tela para criar, editar ou arquivar
  templates, nem para definir os campos (`activity_field`). O schema do banco já prevê tudo isso
  (`activity_template`, `activity_field`, versionamento por `parent_template_id`).
- Fonte da confusão: o diálogo fala em "template da biblioteca", mas a psicóloga não tem
  nenhuma tela onde essa biblioteca exista. Do ponto de vista dela, o template aparece "do nada"
  e a lista de atividades fica vazia depois, sem ligação visível entre as duas coisas.

Sugestões para quando for atacar (a decidir com a Joyce):

- Curto prazo, sem código novo de template: incluir na API um seed oficial com 2 ou 3 templates
  globais (`organization_id IS NULL`), com campos definidos, para o ambiente não depender de
  inserção manual. Deixar claro no diálogo que o prazo e a paciente geram a *atividade*, e que o
  template é só o modelo.
- Médio prazo: entregar a tela `/templates` (listar, criar, editar campos, arquivar) e destravar
  o item da sidebar. Isso fecha o ciclo: biblioteca → atribuir → fila em `/activities` →
  paciente responde → revisão.
- Vazio de `/activities`: quando não há atribuição nenhuma, a mensagem poderia orientar
  ("Nenhuma atividade atribuída. Atribua um template pelo perfil da paciente."), em vez de só
  "Nenhuma atividade no momento".

---

## Parte D — Ambientes e como testar (decisão de 2026-09-09)

| Ambiente | Web | API | Login de psicóloga |
|---|---|---|---|
| Local | http://localhost:3000 | http://localhost:8080 | `psi@acolhe.dev` / `acolhe123` (seed do compose) |
| Staging (`develop`) | https://develop.acolhe-web.pages.dev | https://136.248.118.237.nip.io | `psi@acolhe.dev` / `acolhe123` (seed já rodado) |
| Produção (`main`) | https://acolhe-web.pages.dev | https://163.176.228.171.nip.io | **nenhum usuário ainda** |

- **Testes manuais acontecem em staging**, com o login acima. Produção só recebe os merges
  de `main` e fica sem uso até existir cadastro de psicóloga.
- Produção não tem psicóloga porque o seed nunca rodou lá (a imagem de produção leva só
  `api`, `worker` e `atlas`) e o `/signup` (ACO-54/ACO-59) ainda está em desenvolvimento.
  Quando o signup entrar, a primeira conta de produção é criada por ele; rodar seed em
  produção fica descartado a menos que a Joyce peça.
- E-mail (Brevo) está configurado em staging e produção via GitHub Environments da
  `acolhe-api`; o deploy grava as chaves no `.env` da VM (ver PR #22 da API). Para trocar
  provedor ou remetente, alterar os secrets `SMTP_*` e a variável `FRONTEND_URL` no
  Environment e rodar um deploy.
- O Claude Code não tem acesso SSH às VMs (bloqueado pela política de permissões). Se algo
  precisar ser feito direto na VM, a Joyce roda o comando na sessão com o prefixo `!`, por
  exemplo `! ssh ubuntu@163.176.228.171 '...'`.
