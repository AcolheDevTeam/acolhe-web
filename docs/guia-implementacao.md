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
- **Confirmado em staging pela Joyce (2026-09-09)**: convite criado em
  https://develop.acolhe-web.pages.dev chegou por e-mail via Brevo. C2 encerrado.

### C3. Fluxo de atividades confuso: "template" vs. "atividade" e Templates sem tela — apontado em 2026-09-09

Issues no Linear (2026-09-09): ACO-65 (bug dos status na fila `/activities`), ACO-66 (biblioteca de
templates, API + tela) e ACO-67 (seed de templates globais).

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
  **Feito em 2026-09-09** (ACO-65, branch `fix/aco-65-fila-atividades`): `utils/activity-queue.ts`
  faz o mapeamento acima e ainda agrupa `expired`/`canceled` em "Encerradas sem resposta", para
  nenhuma atividade da API sumir; a API nunca marca atraso sozinha, então "Atrasadas" é
  calculado pelo `dueAt`. `ActivityRow` ganhou linha secundária derivada (prazo, respondida em…)
  porque a API não manda `summary`. Vazio de `/activities` passou a orientar a psicóloga.
  Testes unitários em `tests/activity-queue.test.ts`.
- A parte de Templates **não está pronta**: o item "Templates" da sidebar está com
  `disabled: true` (`components/AppSidebar.vue`), não existe `pages/templates`, e a API só expõe
  listagem (`GET /activities/templates`). Não há endpoint nem tela para criar, editar ou arquivar
  templates, nem para definir os campos (`activity_field`). O schema do banco já prevê tudo isso
  (`activity_template`, `activity_field`, versionamento por `parent_template_id`).
- Fonte da confusão: o diálogo fala em "template da biblioteca", mas a psicóloga não tem
  nenhuma tela onde essa biblioteca exista. Do ponto de vista dela, o template aparece "do nada"
  e a lista de atividades fica vazia depois, sem ligação visível entre as duas coisas.

**Ordem decidida com a Joyce em 2026-09-09**: (1) ACO-65 agora, bug independente; (2) ACO-66
como próxima feature, porque sem template não existe atividade e a tela permite à psicóloga criar os
modelos reais; (3) ACO-67 só depois, se algum template criado pela tela merecer virar padrão do
sistema (prioridade Low, bloqueado por ACO-66). Motivo: um seed agora exigiria inventar campos
clínicos sem validação.

Sugestões originais (anteriores à decisão acima):

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

### C4. Requisitos para a biblioteca de templates (ACO-66) — levantamento de 2026-09-09

Base para o desenho antes de codar. Nada aqui foi implementado; a Joyce valida escopo e responde
as perguntas do fim antes de abrir branch.

**Fontes consultadas**

| Fonte | Onde | O que traz |
|---|---|---|
| Design v0.3 | `docs/design/acolhe-telas.pdf` (mesmo arquivo de `../docs/telas.pdf`): tela 11 "Biblioteca de templates" (pág. 25), tela 12 "Form builder" (págs. 27–28), tela 13 "Atribuir atividade" (págs. 29–30), tela 14 "Revisar resposta" (págs. 31–32), tela 19 "Respondendo atividade" (págs. 43–44) | Comportamento e vocabulário esperados pela psicóloga e pela paciente |
| ERD | `../docs/erd-e-modelo-banco.md` §1.3, regra 3 da §4, decisão 4 da §10 | Invariantes: versão imutável após atribuição; tracker/check-in são templates com `recurrence_config` |
| ADR 0001 | `acolhe-api/docs/architecture/0001-…` | Resposta tipada por campo, versão pinada, template imutável depois de atribuído |
| Schema real | `acolhe-api/internal/db/schema.sql` (`activity_type`, `activity_template`, `activity_field`, `activity_assignment`) | Tudo que a biblioteca precisa já existe no banco |
| Fixture de teste | `acolhe-api/internal/app/app_integration_test.go` | Único lugar do código com `field_type` concretos: `long_text`, `scale {min,max}`, `boolean`, `datetime`, `multiple_choice {options}` |
| Issue | ACO-66 | Escopo inicial (API + tela), fora: seed (ACO-67) |

**O que o design pede**

- Tela 11 (biblioteca): cards com tipo base ("Escala 1–10", "Formulário", "Checklist", "Pergunta
  aberta", "Multi-campo", "Escala pontuada", "Upload + texto"), versão (v1…v3), resumo dos campos,
  escopo (Pessoal / Organização / Acolhe curado global), "Em uso · N pacientes"; filtros Todos /
  Meus / Da organização / Biblioteca Acolhe; busca; grade ou lista; botão "Novo template".
- Tela 12 (form builder): dropdown "Tipo base"; 11 tipos de campo para adicionar: Texto curto,
  Texto longo, Escala 1–10, Escala 1–5, Múltipla escolha, Múltiplas opções, Sim/não, Data, Hora,
  Arquivo, Tags. Cada campo tem ordem, tipo, obrigatório, pergunta (label), texto de apoio,
  opções (nas escolhas), arrastar para reordenar e excluir. Título e instrução editáveis.
  Configurações: Escopo (Pessoal/Organização), Recorrência padrão, Pontuação ("Sem score";
  o score é descritivo e nunca classifica a paciente). Pré-visualização "Como o paciente verá".
  Ações: Descartar, Salvar rascunho, Publicar v1.
- Tela 13 (atribuir): template com versão e escopo visíveis, recorrência, início, prazo por
  instância, fim, mensagem opcional, aviso de notificação, contagem de instâncias.
- Tela 19 (paciente): responde pergunta a pergunta, com progresso, rascunho e "Continuar".

**O que já existe no código**

- Banco: `activity_type (code, name)`, `activity_template (type_id, organization_id nulo =
  global, author_id, parent_template_id, title, description, instructions, recurrence_config,
  scoring_config, version, is_archived)`, `activity_field (code, label, field_type, config jsonb,
  display_order)`; `activity_assignment` pina `template_version`.
- API: só `GET /activities/templates` (id, título, tipo, descrição, versão; exclui arquivados;
  inclui globais). `POST /activities` atribui e pina a versão. `GET /activities/:id` devolve a
  revisão com valores tipados (`text`, `number`, `boolean`, `datetime`, `json`, `attachment`).
- Web: `AssignActivityDialog` já usa `CustomDropdown` para o template; item "Templates" da
  sidebar com `disabled: true`; `schemas/activity.ts` valida os campos da revisão;
  `types/index.ts` tem `ActivityType = 'record' | 'scale' | 'checklist' | 'checkin'`.

**Lacunas encontradas (mudam a decisão)**

- (a) **A paciente não consegue responder hoje.** `POST /activities/assignments/:id/responses`
  (`Submit` em `internal/activity/service.go`) cria uma resposta vazia, sem valores; a validação
  tipada do ADR 0001 só foi implementada no lado da leitura/revisão. No web da paciente,
  `pages/patient/index.vue` apenas lista as pendências; não existe a tela 19. Ou seja, mesmo com
  a biblioteca pronta o ciclo para em "paciente responde". Precisa de issue própria (API tipada +
  tela de resposta responsiva, como toda view do projeto), sugerida logo depois de ACO-66.
- (b) **`activity_type` está vazia** em qualquer ambiente novo (a fixture de teste insere
  `record` na mão). Criar template exige `type_id NOT NULL`. Um seed de `activity_type` é
  vocabulário do sistema, não conteúdo clínico, e por isso não entra em ACO-67: entra em ACO-66.
- (c) **Não há vocabulário fechado de `field_type`** na API nem no ADR; só a fixture. A lista
  precisa ser fixada e validada na API para builder, revisão e futura tela da paciente falarem
  a mesma língua.
- (d) Recorrência, pontuação, rascunho de template, "Em uso · N", filtro "Biblioteca Acolhe" e
  escopo Organização não existem na API. `recurrence_config`/`scoring_config` são só colunas;
  nenhum job materializa instâncias.
- (e) O design pressupõe clínica (escopo Organização); hoje toda organização é "solo" (ERD §3.1)
  e workspaces são ACO-64, em backlog.

**Proposta de escopo MVP para ACO-66 (a validar)**

Dentro:

1. Migration com seed de `activity_type`: `record` (Formulário), `scale` (Escala),
   `checklist` (Checklist), `checkin` (Check-in). São os quatro que o web já conhece.
2. Vocabulário de `field_type` fechado e validado na API, com `config` por tipo:
   `short_text {maxLength}`, `long_text {maxLength}`, `scale {min, max, minLabel?, maxLabel?}`,
   `single_choice {options[]}`, `multiple_choice {options[]}`, `boolean`, `date`, `datetime`.
   Todo campo tem `code` (gerado a partir do label), `label`, `helpText?` (em `config`),
   `required` (em `config`), `display_order`. Cobre 9 dos 11 tipos do design (Escala 1–10 e 1–5
   são `scale` com `max` diferente; "Hora" vira `datetime`). Ficam de fora por enquanto
   **Arquivo** (exige upload) e **Tags**.
3. API: `POST /activities/templates` (título, descrição, instruções, `typeCode`, campos);
   `GET /activities/templates/:id` (com campos); `PUT /activities/templates/:id` (se o template
   já foi atribuído, cria nova versão com `parent_template_id` e a lista passa a mostrar só a
   versão mais recente da linhagem; se nunca foi atribuído, edita no lugar);
   `POST /activities/templates/:id/archive`. Só a autora edita ou arquiva; templates globais
   (`organization_id IS NULL`) são somente leitura. Isolamento por organização e testes
   multi-tenant como nos outros domínios.
4. Web: `/templates` (cards como na tela 11: tipo, versão, resumo dos campos, origem
   "Meu"/"Acolhe"; busca; filtros Todos / Meus / Biblioteca Acolhe), `/templates/novo` e
   `/templates/:id/editar` com o builder da tela 12 (título, instrução, adicionar campo por tipo,
   reordenar, obrigatório, opções, excluir), arquivar com confirmação, item da sidebar
   destravado. Dropdown de "Atribuir atividade" passa a mostrar a versão. Tudo com componentes
   de `components/ui/` (A1–A3), mobile (A4), erros em português (A6).

Fora (por agora): recorrência e "N instâncias", pontuação, rascunho de template (publica
direto), "Em uso · N pacientes", escopo Organização (até ACO-64), campos Arquivo e Tags,
pré-visualização (opcional, se sobrar tempo).

**Entregue em 2026-09-09**

- API: PR #24 da acolhe-api (merged em `develop`, publicado em staging). Contrato em
  `acolhe-api/docs/activity-templates.md`.
- Web: branch `feat/aco-66-templates-web`. Rotas `/templates` (lista com busca e filtros Todos /
  Meus / Biblioteca Acolhe), `/templates/new` e `/templates/:id` (builder; abre em leitura quando
  não editável, com o motivo explicado). Caminhos em inglês seguem a convenção das rotas
  existentes (`/patients`, `/sessions`). Componentes novos e reutilizáveis: `TemplateCard`,
  `forms/TemplateForm`, `forms/TemplateFieldEditor`, `forms/ArchiveTemplateDialog`. Sidebar
  destravada; dropdown de "Atribuir atividade" mostra "vN · Meu". Validação Zod em português
  espelhando os limites da API; os 400 da API (já em português e com a posição do campo) são
  exibidos como vieram. Conferido em 390px e 1280px contra a API de staging; RPD de exemplo
  criado em staging (7 campos) para testes.
- Reordenação de campos por setas (subir/descer) em vez de arrastar: funciona no celular e não
  exige biblioteca nova. Arrastar pode entrar depois, se fizer falta.

**Decisões da Joyce (2026-09-09)**

1. Os 8 tipos de campo bastam para o MVP. Arquivo e Tags ficam para depois.
2. Editar template: nova versão só quando já houver atribuição; sem atribuição, edita no lugar.
3. "Tipo base" continua obrigatório, como no design (decisão de rotina, sem pergunta).
4. Criar a issue "Paciente responde atividade (API tipada + tela 19)" e priorizá-la logo depois
   de ACO-66. Criada como ACO-68. A tela é uma view web responsiva, não uma tela "mobile" à parte;
   o design só a desenha em moldura de celular.
5. Entrega: API primeiro (PR na acolhe-api com endpoints e testes), depois web.

---

### C5. Cadastro do psicólogo (ACO-54/59): entregue, mas não funcionava — apontado em 2026-09-12

O `/signup` foi mergeado em 11/09 (PR #15 da API, PR #14 do web) e as duas issues foram para
Done. Nenhum cadastro jamais concluiu: havia **dois** defeitos em série, um em cada lado, e
nenhum dos dois era visível em revisão de arquivo isolado.

**Defeito do web (ACO-70).** `pages/signup.vue:51` remove `confirmPassword` antes do `$fetch`,
mas `server/api/signup.post.ts` validava o corpo com o **mesmo** `signupSchema` do formulário,
que exige o campo. O parse falhava sempre → 400 no BFF → "Não foi possível concluir o cadastro
agora" na tela, **sem nunca chamar a API Go**. Junto vinha um segundo problema: `cpf` era
obrigatório no schema, mas a API documenta CPF como opcional e a página não define
`initialValues` para ele — quem não preenchesse ficava com `undefined` e era barrado no passo
"CRP", num campo opcional.

**Feito em 2026-09-12** (PR #28 do web): `signupPayloadSchema` passa a ser o contrato de
`POST /signup` — o que a página envia e o BFF valida — e `signupSchema` é ele estendido com
`confirmPassword` e a checagem de igualdade, que só existem na tela. `cpf` vira opcional.
`tests/signup-contract.test.ts` valida o payload exato que a página envia; não havia **nenhum**
teste de signup no repositório.

**Regra que fica:** rota do BFF nunca valida com o schema do formulário. Campo que só existe na
tela (confirmação de senha, aceite visual, máscara) fica fora do contrato, e o contrato é o que
o BFF e a API compartilham. `confirmPassword` era o único campo só-de-UI nos `schemas/`, e
nenhuma outra rota do BFF reusa schema de formulário com campo extra — mas vale conferir ao
criar rota nova.

**Defeito da API (ACO-71).** Com o BFF corrigido, a API respondia **503**. `Service.Signup`
mandava os quatro `INSERT` do cadastro num único `tx.Exec` com parâmetros, e o pgx usa o
protocolo estendido, que recusa múltiplos comandos num statement preparado
(`cannot insert multiple commands into a prepared statement`, SQLSTATE 42601). O erro caía no
`default` do handler e virava "cadastro indisponível". **Feito em 2026-09-12** (PR #26 da API):
um `Exec` por comando, na mesma transação — a atomicidade vem da transação, não do agrupamento.

Verificado ponta a ponta com API e web locais: `POST /signup` devolve 201, cria organização,
usuário, perfil e os 2 consentimentos; pelo BFF vem 200 com cookie `acolhe_session` `HttpOnly`
e o token fora do corpo; a conta criada loga.

**Ainda não entregue no signup:** a verificação real de e-mail (ACO-61 e ACO-63 seguem em
Backlog). Hoje qualquer e-mail inventado cria conta. Como o Brevo já está configurado nos dois
ambientes, o custo é baixo — e é o que destrava criar a primeira conta de produção pelo
`/signup`, que é o plano registrado na Parte D.

---

### C6. Deploy de staging quebrado pela migration do signup (ACO-69) — apontado em 2026-09-12

A API de staging ficou **502 por cerca de 17 horas**, de 11/09 21:44 UTC até o conserto.
Produção seguiu no ar porque `main` ainda não tinha a migration.

A migration de consentimentos do signup entrou como `20260909170000_..._signup_consents.sql`
com dois defeitos: **não estava no `atlas.sum`** (o `atlas migrate apply` confere a integridade
do diretório antes de aplicar e aborta) e **ordenava antes** de
`20260909210000_seed_activity_types.sql`, que já estava aplicada em staging desde o deploy de
09/09 22:07 — o Atlas recusa migration nova que ordene antes da última aplicada. Como `api` e
`worker` têm `depends_on: migrate: service_completed_successfully`
(`deploy/docker-compose.yml:93,121`), o migrate falhar derrubou os dois containers.

**Feito em 2026-09-12** (PR #25 da API): renomeada para `20260912150000_...` e `atlas.sum`
regerado. O SQL não mudou. Cada cenário foi reproduzido contra um Postgres real: com o
diretório como estava, `checksum mismatch`; só regerando o hash, `added out of order` (ou seja,
rehash sozinho não resolvia); com a correção, aplica 1 migration sobre o estado de staging e as
11 num banco novo.

**Regra que fica:** toda migration nova precisa de timestamp posterior ao da última já
publicada em `develop` (não só em `main`), e de `atlas migrate hash` no mesmo commit. O CI
passou a validar isso — ver C7.

**Achado lateral, não corrigido:** existe divergência de nome de constraint entre as migrations
e o `schema.sql` — `appointment_status_allowed` nas migrations, `appointment_status_check` no
`schema.sql`. Hoje é cosmético, mas uma migration futura gerada por `atlas migrate diff` a
partir do `schema.sql` pode tentar dropar um nome que não existe nos ambientes reais. Vale um
alinhamento quando alguém encostar em `appointment`.

---

### C7. O CI não enxergava nada nos dois repositórios — apontado em 2026-09-12

Os dois defeitos de C5 e o de C6 passaram verdes. Não foi coincidência.

**acolhe-api (ACO-72).** Todo teste que sobe Postgres com testcontainers está atrás de
`//go:build integration`, e o `ci.yml` rodava `go test ./...` **sem a tag**: nenhum deles jamais
executou. Ficaram dark justamente os testes de isolamento multi-tenant e de contrato HTTP — a
cobertura de ACO-16 e ACO-24, as duas marcadas como Done. Rodando com a tag apareciam **5
falhas**: as 3 do signup (bug real, ACO-71 — os testes estavam certos) e 2 de fixture defasada.

As duas fixtures: `TestGetSessionsByPatient_OrgIsolation` inseria `session` sem vínculo ativo,
violando o gate de consentimento criado na migration `20260729011635` (produto correto, teste
anterior ao trigger); `TestPatientInvitationLoginMeAndPortalIsolation` afirmava sobre
`patientId` no corpo do check-in, que `patient.PatientCheckin` **não expõe de propósito**. Neste
segundo caso o produto está correto e seguro — `CheckinRequest` só tem `mood` e `note`, então um
`patientId` no corpo já era ignorado no bind; a propriedade valia, só não era observável pelo
corpo. Passou a ser verificada no banco.

**acolhe-web (ACO-73).** O repositório **não tinha workflow nenhum**: sem `.github/`, sem
nenhuma execução no Actions. `pnpm test` e `pnpm run typecheck` só rodavam quando alguém
lembrava de rodar na máquina. O deploy pelo Cloudflare Pages é via integração com o Git e só
percebe erro de *build*. Foi exatamente por aí que ACO-70 chegou na develop.

**Feito em 2026-09-12:**

- API (PR #25): job `migrations` — valida o `atlas.sum`, aplica num banco novo e confere que
  nenhuma migration nova ordene antes da última publicada em `main` **e** em `develop`. O
  replay precisa incluir `develop`: contra `main` apenas, o caso de C6 passaria. É comparação
  por nome, não replay do diretório da base num banco, para que um PR não fique barrado quando
  a base já estiver quebrada — inclusive o PR que a conserta.
- API (PR #26): job `integration` rodando `go test -tags integration ./...`, mais as correções
  das duas fixtures. Suíte de integração verde no runner.
- Web (PR #29): workflow de CI com `typecheck` e `test` em PR para `develop` e push de
  `develop`/`main`. Primeira execução do repositório.

**Anotação de ambiente:** o `pnpm` 11.3.0 fixado em `packageManager` **não roda em Node 20**
(`ERR_UNKNOWN_BUILTIN_MODULE`), então o CI do web usa Node 22. A seção de deploy do README ainda
recomenda `NODE_VERSION=20`; essa linha está defasada — com Node 20 nem o build do Pages
passaria. Vale corrigir o README e conferir qual versão o Pages usa de fato.

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
