# Novo design do Acolhe — levantamento para implementação

Fonte: protótipo "Acolhe — novo design" (41 artboards `.dc.html` + `canvas.json`, gerado em 2026-10-09).
Base de código comparada: `acolhe-web` na branch `feat/aco-62-area-clinica` (contém `develop`) e
`acolhe-api` em `develop`, ambos em 2026-10-09.

Este documento é só levantamento. Nada foi implementado.

**Decisões tomadas em 2026-10-09 (ao adotar o protótipo)**

- A A5 do guia e a Regra 1 do `AGENTS.md` foram atualizadas para o protótipo; os artboards estão
  em `docs/design/prototipo/`.
- **Tema escuro: mantido**, com paleta derivada do protótipo (fundo a partir da Noite `#1C1A5E`,
  ação em índigo mais claro). Decisão provisória: a Joyce pode vetar.
- **Ilustração do login:** recuperada do projeto de design e salva em
  `public/images/login-ilustracao.jpg`. **Licença a confirmar antes de produção** (parece
  ilustração de banco de imagens, que pode exigir atribuição).

**Conflitos levantados antes da decisão**

- A5 do `docs/guia-implementacao.md` fixa serif Newsreader, Inter, JetBrains Mono, paleta creme e
  botões pretos. O protótipo troca tudo isso. Adotar o protótipo é o "redesign de uma vez" que a A5
  prevê, e a tabela da A5 e a Regra 1 do `AGENTS.md` (que aponta para `docs/design/acolhe-telas.pdf`)
  precisam ser atualizadas no mesmo movimento.
- O protótipo não tem tema escuro. A A5 exige que o tema escuro continue funcionando
  (`assets/css/main.css:45-69`). É preciso decidir entre derivar uma paleta escura própria ou
  abandonar o tema escuro.
- A ilustração do login (`<img class="illus" src="/_blob/6d4d8ff649523daf00ab9276d78f3788">`) não
  veio no download. Precisa ser exportada do projeto de design.
- O protótipo usa marcadores em lugares sem decisão de negócio: `[PREÇO]`, `[DESCONTO]`,
  `[PERÍODO]`, `[GATEWAY]`, `[FORMAS DE PAGAMENTO]`, `[SUBTOTAL]`, `[TOTAL]`, `[VALOR DA CORTESIA]`.

---

## 1. Fundamentos

### 1.1 Cores

Contagem de ocorrências em todos os artboards entre parênteses. Os nomes em itálico são os do próprio
protótipo (artboard "Fundamentos").

| Papel | Hex | Uso no protótipo |
|---|---|---|
| Fundo da página (*Névoa*) | `#F5F7FE` (107) | `body`, sidebar, fundo de linha em hover (`.row:hover`, `.opt:hover`) |
| Fundo do painel de marca no login | `#EEF1FE` | `section.brand` de Login/Senha |
| Superfície | `#FFFFFF` (337) | cards, inputs, painéis, diálogos, tabbar da paciente |
| Superfície sutil | `#F7F8FE` (52) | hover de `.btn-s`, linha de tabela em hover, `.check.on`, área de texto da ficha |
| Superfície selecionada (linha) | `#F1F3FE` | `.item.sel` (fila de atividades) |
| Cabeçalho de tabela | `#FAFBFF` | `.th` em Documentos |
| Hover de navegação | `#ECEFFB` (28) | `.nav:hover`, `.sub:hover`, `.btn-q:hover` (variante cinza) |
| Trilho / superfície neutra | `#EFF2FB` (71) | fundo do segmentado, `.track`, badge neutro, linha divisória de tabela (`td` border-bottom) |
| Trilho de abas | `#E7EBF8` (20) | `.tabs-wrap` da fila de atividades, evento "realizada" na agenda |
| Linha (*Linha*) | `#DDE3F3` (198) | bordas de card, divisórias, borda de busca e dropdown |
| Borda de input | `#CBD2EA` (88) | `.inp`, `.btn-s`, switch desligado, `.kbd`, estado vazio tracejado |
| Borda em hover | `#A7AFCF` (91) | `.inp:hover`, `.btn-s:hover`, `.chip:hover`; borda do checkbox/radio vazio; ponto "realizada" |
| Borda de item selecionado | `#93A9F0` / `#B9C3F4` | `.chip.on`, `.opt.on`, `.q.on` |
| Texto primário (*Tinta*) | `#161A3A` (263) | corpo e títulos |
| Texto secundário | `#3E4466` (189) | parágrafos de apoio, itens de navegação inativos |
| Texto de apoio (*Apoio*) | `#5C6385` (482) | metadados, rótulos mono, ícones |
| Placeholder | `#868DAD` (11) | `::placeholder`; texto do botão bloqueado |
| Ação (*Índigo*) | `#4040D6` (324) | botão primário, links, foco, switch ligado, checkbox marcado |
| Ação em hover | `#3232B5` (34) | `.btn-p:hover` |
| Ação desabilitada | `#C6D2F7` | `.btn-p:disabled` no check-in; barras inativas do gráfico |
| Índigo claro | `#E6EAFD` (145) | item de navegação ativo, badge "positivo", avatar, toast, `.btn-q:hover` |
| Texto sobre índigo claro | `#2B2E9E` (79) / `#1C1A5E` | badge e avatar; item de nav ativo usa `#1C1A5E` |
| Marca (*Noite*) | `#1C1A5E` (156) | logo do workspace, blocos escuros (`.dark`: Registro Documental na sessão, plano Clínica, resumo do checkout, barra de ações em massa), `.chip.on` de filtro |
| Texto sobre Noite | `#E8EBFB` / `#FFFFFF`; apoio `#A9B2E8`, `#C3CAF0` | |
| Salmão (*Salmão*) | `#FF8A70` (44) | iniciais sobre Noite, foco dentro de áreas escuras (`.dark :focus-visible{outline-color:#FF8A70}`), check animado |
| Arco do meio do logo | `#FF7A5C` (34) | só no símbolo |
| Coral (*Coral*) | `#D9503C` (14) | ponto de "falta", contador de não lidas, pulso de alerta |
| Aviso: fundo / texto | `#FDEBE7` / `#9E3522` (29 / 43) | badge "Para revisar", "Sem resposta", "Falta", "Inadimplente", banner de cobrança, `.btn-d` |
| Aviso: borda | `#F3C9C1` | `.btn-d` com borda (Agenda) |
| Erro (*Alerta*): texto / fundo | `#A33A3A` / `#F7E1E1` | badge "Atrasada", botão destrutivo (`.btn-danger`), ação "Encerrar" |
| Erro em hover | `#8A2F2F` | `.btn-danger:hover` |
| Fundo de botão branco sobre aviso | `#FFF6F4` | `.btn-w:hover` (Bloqueio) |
| Escala de humor (1→5) | `#E9EDFB`, `#C6D2F7`, `#93A9F0`, `#6470E6`, `#4040D6` | check-in e mapa de calor da ficha |
| Logo em área escura | arco externo `#9DB0F5` | Fundamentos |
| Logo esmaecido | `#C6D2F7`, `#FFC2B4`, `#93A9F0` | tela de erro |

Não existe verde no protótipo. "Sucesso" usa o índigo claro (`#E6EAFD` + `#2B2E9E`): "Vínculo ativo",
"Verificado", "Concluída", toasts de confirmação.

**Badges/pills (pares exatos)**

| Tom | Fundo | Texto | Exemplos |
|---|---|---|---|
| positivo / ativo | `#E6EAFD` | `#2B2E9E` | Vínculo ativo, Em andamento, Ativa, Verificado, Resposta enviada |
| aviso | `#FDEBE7` | `#9E3522` | Sem resposta, Para revisar, Falta, Inadimplente, Cancelamento, Pagamento |
| erro | `#F7E1E1` | `#A33A3A` | Atrasada |
| neutro | `#EFF2FB` | `#3E4466` | Rascunho, Concluída, Cortesia, Convite aceito |
| neutro apagado | `#EFF2FB` | `#5C6385` | Cancelada, código encerrado, link expirado |
| forte | `#1C1A5E` | `#FFFFFF` | filtro ativo (`.fchip.on`, `.qchip.on`, `.chip.on` no Admin) |
| marca | `rgba(255,138,112,.16)` | `#FF8A70` | rótulo sobre Noite |

Status de agendamento (Agenda):

| Status | Estilo |
|---|---|
| agendada | `background:#FFFFFF; color:#2B2E9E; border:1.5px solid #4040D6` |
| confirmada | `background:#4040D6; color:#FFFFFF; border:1px solid #4040D6` |
| realizada | `background:#E7EBF8; color:#3E4466; border:1px solid #E7EBF8` |
| falta | `background:#FDEBE7; color:#9E3522; border:1.5px solid #D9503C` |
| cancelada | `background:#FFFFFF; color:#5C6385; border:1px dashed #A7AFCF; text-decoration:line-through` |
| bloqueio | `repeating-linear-gradient(135deg,#EFF2FB 0 6px,#E7EBF8 6px 12px); border:1px dashed #A7AFCF; color:#5C6385` |

Pontos da agenda do Início: agora `#4040D6` (linha `#E6EAFD`), realizada `#A7AFCF`, falta
`#FFFFFF` + `border:2px solid #D9503C`, futura `#FFFFFF` + `border:2px solid #A7AFCF`.

**Contraste (WCAG)**: `#5C6385` sobre `#FFFFFF` 5,87:1 e sobre `#F5F7FE` 5,48:1; `#4040D6` sobre
branco 7,19:1; `#2B2E9E`/`#E6EAFD` 8,83:1; `#9E3522`/`#FDEBE7` 6,1:1; `#A33A3A`/`#F7E1E1` 5,22:1.
Abaixo de 4,5:1: placeholder `#868DAD` em branco (3,27:1, aceitável só para placeholder) e texto
branco sobre `#D9503C` (4,07:1, usado no contador de 11px das notificações; usar `#A33A3A`).

**Estados de foco**

- Global: `:focus-visible{outline:2px solid #4040D6;outline-offset:2px}` (41 artboards).
- Input/textarea/combobox focado: `border-color:#4040D6; box-shadow:0 0 0 4px rgba(64,64,214,.14)`.
- Card de campo do builder com foco dentro: `border-color:#B9C3F4; box-shadow:0 0 0 4px rgba(64,64,214,.08)`.
- Opção grande selecionada (`.choice.on`, `.role.on`, `.opt.on` de documento):
  `border-color:#4040D6; box-shadow:0 0 0 3px rgba(64,64,214,.12)` (ou `4px` em Criar clínica).
- Em superfície escura: `outline-color:#FF8A70`.

Erro de campo: **não desenhado** no protótipo. Proposta: texto 13px `#A33A3A` abaixo do campo e
borda `#A33A3A` com `aria-invalid` (mantém a A6).

### 1.2 Tipografia

Famílias (Google Fonts, como no protótipo):
`IBM+Plex+Mono:wght@400;500` e `Schibsted+Grotesk:wght@400;500;600;700`.

- Sans: `'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif` — tudo, inclusive títulos.
- Mono: `'IBM Plex Mono', ui-monospace, monospace` — rótulos, horários, números, códigos, CRP.
- Não há serif. `display-serif`/`font-serif` deixam de existir no visual.

| Nível | Tamanho / peso / line-height / letter-spacing | Onde |
|---|---|---|
| Display de marketing | 56/600/1/-0.035em; 48/600/1.08/-0.035em | Fundamentos, Planos |
| Saudação (H1 do Início) | 40/600/1.1/-0.03em | Início, Bloqueio (36) |
| H1 de página | 32–34/600/1.1/-0.03em (34 nas listas, 32 em Ajustes/Equipe/Documentos) | todas as telas da psicóloga |
| H1 de autenticação | 34/600/1.15/-0.025em (Login); 32/600/1.15/-0.025em (Senha); 28/600/-0.025em (Cadastro, Verificar) | |
| H1 da paciente (390px) | 28–30/600/-0.03em; 24/600/-0.02em em Ajustes | |
| H2 de seção | 22/600/-0.02em (painéis e diálogos); 18/600/-0.01em ou -0.02em (cards) | |
| H3 / título de linha | 15–16/600 | nomes em listas, títulos de card de atividade |
| Corpo de leitura | 15–16/400/1.55, cor `#3E4466` | descrições, evolução |
| Corpo de interface | 14/400–500; 14/600 em botões | formulários, tabelas, nav |
| Metadado | 13/400 `#5C6385`; 12/400 | |
| Rótulo de campo | 13/500 (`label`) | |
| Eyebrow / rótulo mono | 11–12, mono, `uppercase`, `letter-spacing:.14em`, `#5C6385` (11px em seções, 12px no topo da página) | equivalente ao `.label-mono` atual |
| Cabeçalho de tabela | mono 11/500, `uppercase`, `letter-spacing:.12em` (ou `.08em`), `#5C6385` | |
| Tabbar da paciente | 11/500 | |

### 1.3 Raios

| Valor | Uso |
|---|---|
| 6px | `.kbd`, atalho `⌘K`, quadradinho de checkbox (`.box`) |
| 7px | checkbox 24px (`.ck`) |
| 8px | segmento interno, item de dropdown (`.opt`), botão-ícone 34px, avatar quadrado do workspace |
| 9–10px | **botões, inputs, selects, busca, segmentado (pílula interna), nav** — padrão |
| 12px | botões de 48px, textarea, combobox grande, toast, menu suspenso, opção de rádio grande |
| 14px | card de atividade da paciente, campo do builder, área de upload, botão de humor |
| 16px | `.card` (padrão), estado vazio, barra de ações em massa, `.choice` |
| 18px | diálogo, card no fluxo da paciente/checkout |
| 20px | blocos do Fundamentos, bottom sheet (`20px 20px 0 0`) |
| 50% / altura÷2 | avatar redondo, badge (`26px`→13px; `24px`→12px), chip de filtro (`34px`→17px) |

### 1.4 Sombras

| Token proposto | Valor |
|---|---|
| foco | `0 0 0 4px rgba(64,64,214,.14)` |
| foco suave | `0 0 0 3px rgba(64,64,214,.12)` |
| hover do primário | `0 6px 18px rgba(64,64,214,.22)` |
| pílula do segmentado | `0 1px 2px rgba(22,26,58,.1)`; versão maior `0 1px 2px rgba(22,26,58,.1),0 4px 12px rgba(22,26,58,.06)` |
| sub-nav ativo | `0 1px 2px rgba(22,26,58,.08)` |
| knob do switch | `0 1px 3px rgba(22,26,58,.2)` |
| evento da agenda em hover | `0 6px 16px rgba(22,26,58,.12)` |
| menu suspenso | `0 18px 40px rgba(22,26,58,.12)` |
| painel lateral | `-18px 0 40px rgba(22,26,58,.12)` (`.14` em Documentos) |
| diálogo | `0 24px 60px rgba(22,26,58,.2)` (`.22` em Templates) |
| diálogo destrutivo | `0 30px 80px rgba(22,26,58,.3)` |
| barra de ações | `0 18px 40px rgba(22,26,58,.28)` |
| scrim | `rgba(22,26,58,.32)` diálogo central; `.28` painel lateral; `.45` bottom sheet |

Cards **não têm sombra**: `.card{background:#FFFFFF;border:1px solid #DDE3F3;border-radius:16px}`.

### 1.5 Espaçamento e layout

- Gaps mais usados: 8px (205), 10px (162), 12px (110), 6px (98), 16px (85), 24px (71).
- Padding de card: 24px; cards de lista `20px 12px 12px` com linhas `14px 16px`; diálogo 28px;
  painel lateral 32px (28px em Documentos); bloco escuro 32px.
- Shell da psicóloga: sidebar `flex:1 1 248px; max-width:264px; padding:24px 16px; gap:24px;
  border-right:1px solid #DDE3F3; background:#F5F7FE`. Conteúdo
  `padding:28px clamp(16px,4vw,48px) 56px; gap:32px`. Telas largas sem `max-width`; Atribuir,
  Revisar e Ajustes limitam a 1040–1240px.
- Login/Senha: duas colunas, painel de marca `flex:1 1 520px; padding:48px 56px` + formulário
  `flex:1 1 480px; padding:56px 24px`.
- Paciente: moldura 390×844, header + conteúdo com rolagem + tabbar fixa.
- Quebra do protótipo: `@media (max-width:760px)` (sidebar vira faixa horizontal). No código manter
  o `Sheet` abaixo de `md` que já existe (`layouts/default.vue:22-36`, B6).

### 1.6 Alturas de controles

| Controle | Altura |
|---|---|
| Botão padrão nas telas do app | 40px, `padding:0 16px`, 14/600, raio 10 |
| Botão em formulários de Ajustes, Fundamentos, Atribuir, Declaração | 44px, `padding:0 18px` |
| Botão em autenticação, checkout, criar clínica, erro | 48px, `padding:0 20–22px`, 15/600, raio 12 |
| Botão de largura total da paciente | 48px (50px em Convite), raio 12, 15/600 |
| Botão pequeno em cards | 36px; ação de linha 34px |
| Botão-ícone | 34px (raio 8), 36px (raio 8), 40px (raio 10, com borda), 44px no celular |
| Input | 44px no app, 48px na autenticação, 46px no checkout, 40px em busca/filtros |
| Busca | 40px, `padding:0 14px 0 40px` (ícone em `left:14px`) |
| Dropdown de filtro | 40px (34px em pílula) |
| Combobox grande (Atribuir) | min 52px, raio 12 |
| Textarea | min 72–96px, `padding:12px 14px`, 15px/1.55 |
| Item de nav / sub-nav | 40px |
| Segmentado | trilho com `padding:3–4px`; botões 32px (compacto) ou 40–44px |
| Chip de filtro | 34px (pílula) ou 40px; badge 24–26px |
| Switch | 44×26 (knob 20) padrão; 48×28 (knob 22) na paciente; 42×24 e 38×22 em formulários densos |
| Checkbox | 20–24px, borda `1.5px solid #A7AFCF`, raio 6–7 |
| Tabbar da paciente | itens min 56px |

### 1.7 Movimento

| Nome | Definição |
|---|---|
| curva padrão | `cubic-bezier(.2,.7,.2,1)` (sem quique) |
| entrada de página (`rise`) | `from{opacity:0;transform:translateY(12px)}`, 700ms (600–800ms), escalonado com `animation-delay` de 80ms por bloco |
| entrada de conteúdo (`fade`) | `translateY(4–8px)`, 360–450ms |
| troca de segmento/aba | `transform .42s` da pílula ou do sublinhado |
| hover / cor | `.2s ease` a `.25s ease` |
| pressionar botão | `.btn:active{transform:scale(.985)}` |
| menu suspenso | `fade .25s` / `drop .28s`, `translateY(-6px)` |
| diálogo | `pop .42s`, `scale(.96) translateY(8px)`; scrim `dim .3s ease` |
| painel lateral | `slideIn .45s`, `translateX(32px)` |
| bottom sheet | `translateY(100%)` → 0, 450ms |
| switch | fundo `.25–.3s ease`, knob `.3–.35s` |
| logo | `arcdraw 1s cubic-bezier(.65,0,.35,1)` com `pathLength="1"` e `stroke-dasharray:1`; atrasos .2s/.45s/.7s (login) ou .1/.3/.5s (erro) |
| spinner | `spin .8s linear infinite`, 16–18px, `border:2px` |
| ponto "agora" | `pulse 2.4s` |

Reduzir movimento, duas versões no protótipo; adotar a primeira (36 artboards):

```css
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition-duration:.01ms!important}}
```

Hoje o `acolhe-web` não trata `prefers-reduced-motion` em lugar nenhum, e os `animate-in`/`fade-in-0`
de `components/ui/dialog/DialogContent.vue:26,32` dependem de `tw-animate-css`, que está no
`package.json` mas não é importado em `assets/css/main.css`.

### 1.8 Comparação com os tokens atuais e mapeamento shadcn

Atual: paleta creme/tinta (`assets/css/main.css:6-43`), fontes Inter/Newsreader/JetBrains Mono
(`tailwind.config.ts:23-26`, carregadas em `nuxt.config.ts:45`), `--radius: 0.5rem`
(`main.css:42`), botão `h-9` (`components/ui/button/index.ts:22`), input `h-9`
(`components/ui/input/Input.vue:23`), card `rounded-xl ... shadow` (`components/ui/card/Card.vue:14`).

| Variável | Atual (`main.css`) | Novo (hex → HSL) | Observação |
|---|---|---|---|
| `--background` | `45 29% 97%` (:8) | `#F5F7FE` → `226.7 81.8% 97.8%` | |
| `--foreground` | `24 10% 10%` (:9) | `#161A3A` → `233.3 45% 15.7%` | |
| `--card` / `--popover` | `0 0% 100%` (:11, :14) | `#FFFFFF` (mantém) | |
| `--card-foreground` / `--popover-foreground` | `24 10% 10%` (:12, :15) | `#161A3A` | |
| `--primary` | `24 10% 12%` (:17) | `#4040D6` → `240 64.7% 54.5%` | botões deixam de ser pretos |
| `--primary-foreground` | `45 29% 98%` (:18) | `#FFFFFF` | |
| `--secondary` | `43 20% 94%` (:20) | `#EFF2FB` → `225 60% 96.1%` | |
| `--secondary-foreground` | `24 10% 12%` (:21) | `#3E4466` → `231 24.4% 32.2%` | |
| `--muted` | `43 18% 95%` (:23) | `#EFF2FB` | |
| `--muted-foreground` | `30 5% 42%` (:24) | `#5C6385` → `229.8 18.2% 44.1%` | |
| `--accent` | `43 22% 93%` (:26) | `#E6EAFD` → `229.6 85.2% 94.7%` | item ativo, hover de ghost |
| `--accent-foreground` | `24 10% 12%` (:27) | `#1C1A5E` → `241.8 56.7% 23.5%` | |
| `--destructive` | `6 55% 45%` (:29) | `#A33A3A` → `0 47.5% 43.3%` | |
| `--destructive-foreground` | `45 29% 98%` (:30) | `#FFFFFF` | |
| `--success` | `152 30% 32%` (:32) | `#2B2E9E` → `238.4 57.2% 39.4%` | não há verde; sucesso vira índigo |
| `--success-foreground` | `45 29% 98%` (:33) | `#E6EAFD` | usar como fundo do badge, ver tokens novos |
| `--warning` | `32 60% 42%` (:35) | `#9E3522` → `9.2 64.6% 37.6%` | |
| `--warning-foreground` | `45 29% 98%` (:36) | `#FDEBE7` | idem |
| `--border` | `40 14% 88%` (:38) | `#DDE3F3` → `223.6 47.8% 91%` | |
| `--input` | `40 14% 85%` (:39) | `#CBD2EA` → `226.5 42.5% 85.7%` | |
| `--ring` | `24 10% 12%` (:40) | `#4040D6` | |
| `--radius` | `0.5rem` (:42) | `0.625rem` (10px) | `lg`=10, `md`=8, `sm`=6, `xl`=14; card usa `rounded-2xl` (16px) |

Tokens novos sugeridos (mesmo formato HSL, registrados em `tailwind.config.ts` → `colors`):

| Variável | Hex | Para |
|---|---|---|
| `--primary-hover` | `#3232B5` | hover do botão primário |
| `--brand` / `--brand-foreground` / `--brand-muted` | `#1C1A5E` / `#E8EBFB` / `#A9B2E8` | blocos escuros, avatar do workspace |
| `--highlight` | `#FF8A70` | iniciais sobre Noite, foco em área escura |
| `--surface-subtle` | `#F7F8FE` | hover de outline, linha de tabela |
| `--surface-hover` | `#ECEFFB` | hover de nav |
| `--input-hover` | `#A7AFCF` | borda em hover, checkbox vazio |
| `--placeholder` | `#868DAD` | |
| `--selected-border` | `#93A9F0` | chips/opções selecionados |
| `--positive-soft` / `--positive` | `#E6EAFD` / `#2B2E9E` | badge positivo |
| `--warning-soft` | `#FDEBE7` | badge de aviso |
| `--destructive-soft` / `--destructive-hover` | `#F7E1E1` / `#8A2F2F` | badge de erro, hover |
| `--alert` | `#D9503C` | ponto de falta, contador |
| `--mood-1`…`--mood-5` | `#E9EDFB`, `#C6D2F7`, `#93A9F0`, `#6470E6`, `#4040D6` | escala de humor |

Outros ajustes de base:

- `tailwind.config.ts:24-26`: `sans: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif']`,
  `mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']`, remover `serif`.
- `nuxt.config.ts:45`: trocar a URL do Google Fonts pela do protótipo.
- `main.css:79` (`font-feature-settings: 'cv11', 'ss01'`) é específico da Inter; remover.
- `main.css:86-88` `.label-mono`: já bate (11px, `.14em`, maiúsculo, `muted-foreground`).
- `main.css:91-93` `.display-serif`: redefinir como `font-sans font-semibold tracking-[-0.03em]`
  (é usado em 25 arquivos; renomear depois para `.display`).
- Adicionar keyframes `rise`, `fade`, `pop`, `slide-in`, `sheet`, `arcdraw` e a regra de
  `prefers-reduced-motion` em `main.css`.
- `.dark` (`main.css:45-69`): sem referência no protótipo (decisão pendente, ver topo).

---

## 2. Componentes base

| Componente | Como aparece no protótipo | Atual | Mudança |
|---|---|---|---|
| **Botão** | `.btn` 40px/raio 10/14-600, `gap:8px`, ícone 16px. Variantes: **primário** `.btn-p` (`#4040D6`, hover `#3232B5` + sombra índigo); **secundário** `.btn-s` (branco, borda `#CBD2EA`, hover borda `#A7AFCF` + fundo `#F7F8FE`); **quieto** `.btn-q` (transparente, texto `#4040D6` ou `#3E4466`, hover `#E6EAFD`/`#ECEFFB`); **perigo suave** `.btn-d` (transparente ou branco com borda `#F3C9C1`, texto `#9E3522`, hover `#FDEBE7`); **perigo** `.btn-danger` (`#A33A3A`, hover `#8A2F2F`); **claro** `.btn-light` (branco, texto `#1C1A5E`, sobre fundo Noite); **escuro** `.btn-dark` (transparente, borda `rgba(220,226,250,.3)`, sobre Noite); **enviado** `.btn-sent` (`#E6EAFD`/`#2B2E9E`, estado após ação); **bloqueado** `.btn-locked` (borda tracejada `#CBD2EA`, fundo `#F7F8FE`, texto `#868DAD`). Desabilitado: `opacity:.45`. Carregando: spinner + texto ("Entrando…"). | `components/ui/button/index.ts` (variantes `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; tamanhos `h-9`/`h-8`/`h-10`) | `default`→primário, `outline`→secundário, `ghost`→quieto, `destructive`→perigo; adicionar `destructive-soft`, `on-brand`, `on-brand-outline`; tamanhos `sm` 36, `default` 40, `lg` 44, `xl` 48; `active:scale-[.985]`; prop `loading`. Remover `shadow` das variantes. |
| **Input** | `.inp` 44px, `padding:0 14px`, borda `#CBD2EA`, raio 10, 14–15px; hover `#A7AFCF`; foco `#4040D6` + anel 4px; placeholder `#868DAD`. Rótulo 13/500 acima, `gap:6px`. Botão de mostrar senha (ícone 44px) no login. | `components/ui/input/Input.vue:23` (`h-9`, `rounded-md`, `shadow-sm`, `ring-1`) | Altura 44 (prop `size` 40/44/48), anel de foco 4px, sem sombra; criar `PasswordInput` com alternância de visibilidade. |
| **Textarea** | `.area` min 72–96px, raio 12, 15px/1.55. Na ficha, variante "inline" com fundo `#F7F8FE` e borda transparente que vira branca no foco. Contador `0/500`. | `components/ui/textarea/Textarea.vue:23` | Mesmo ajuste do input + variante `inline` + contador opcional. |
| **Select / dropdown** | Sempre pesquisável. (1) `.dd-btn` de filtro 40px (ou pílula 34px) com rótulo "Paciente: Todos" e menu `.dd-menu` (largura 220–240, `padding:8px`, raio 12, sombra `0 18px 40px rgba(22,26,58,.12)`) com campo de busca e `.opt` 38px; (2) `.combo` grande do Atribuir (min 52px, raio 12, título + meta); (3) combobox de região no cadastro (48px). Opção selecionada `#E6EAFD`/`#2B2E9E`. | `components/ui/custom-dropdown/CustomDropdown.vue:67` (`h-9`) | Restilizar o gatilho (40/44/48), item 38px, menu com sombra do protótipo; variante "filtro" com rótulo prefixado; variante com descrição (já existe). Mantém A3. |
| **Checkbox** | `.box` 20–22px (24px na fila), borda `1.5px solid #A7AFCF`, raio 6–7, marcado `#4040D6` com check branco. Também como cartão inteiro clicável (`.check`, termos do cadastro). | `components/ui/checkbox/Checkbox.vue:21` (`h-4 w-4`, `rounded-sm`) | Tamanho 20px, raio 6, cores novas; criar `CheckboxCard`. |
| **Switch / toggle** | `.sw` 44×26 (knob 20, `translateX(18px)`), desligado `#CBD2EA`, ligado `#4040D6`; 48×28 na paciente. Usado em consentimentos, preferências, exportação, campo obrigatório. | **não existe** | Criar `components/ui/switch` (reka-ui `Switch`). |
| **Rádio em cartão** | `.choice`/`.role`/`.opt` (tipo de documento): cartão com título + descrição; selecionado borda `#4040D6` + anel `3px rgba(64,64,214,.12)` + fundo `#F7F8FE`; `.radio` 22px. | não existe | Criar `RadioCardGroup` (reka-ui `RadioGroup`). |
| **Chips de opção** | `.chip`/`.opt` 34–40px, borda `#DDE3F3`/`#CBD2EA`; selecionado `#E6EAFD` + borda `#93A9F0`/`#B9C3F4` + texto `#1C1A5E`/`#2B2E9E`. Filtro forte: `#1C1A5E` + texto branco. | não existe | Criar `ChoiceChips` (single e multi, `role=radio`/`checkbox`). |
| **Stepper numérico** | `.step` 36–44px com `−`/`+` e valor no meio (vagas, vezes por semana, horário do sono). | não existe | Criar `NumberStepper`. |
| **Badge / pill** | 24–26px, `padding:0 10px`, raio total, 12/500, tons da tabela 1.1. | `components/ui/badge/index.ts:7-18` (`rounded-md`, `font-semibold`, cores de primário) | Trocar por prop `tone` (`positive`, `warning`, `danger`, `neutral`, `muted`, `strong`), raio total, 12/500, sem borda. |
| **Card** | `.card` branco, borda `#DDE3F3`, raio 16, sem sombra; `padding:24px` ou lista `20px 12px 12px`. Título 18/600; eyebrow mono 11px. Card escuro (`.dark`) `#1C1A5E`, raio 16–20. | `components/ui/card/Card.vue:14` (`rounded-xl ... shadow`) | `rounded-2xl`, sem `shadow`; variante `brand`. `StatCard` segue o card. |
| **Tabela / lista** | Tabela: `th` mono 11/500 maiúsculo `.12em` `#5C6385`, `padding:12px 16px`, borda `#DDE3F3`; `td` `padding:14px 16px`, borda `#EFF2FB`; hover `#F7F8FE`; cabeçalho clicável com seta de ordenação. Lista: `.row` 14px 16px, raio 12, hover `#F5F7FE`; avatar 34–36 + título 15/600 + meta 13 + status à direita. | `components/ui/table/*` (`TableHead.vue:11` `h-10 px-2`, `TableRow.vue:11`), `SessionRow`, `ActivityRow`, `AppointmentRow` | Ajustar paddings e cores; criar `SortableHead`; as `*Row` passam a usar o padrão `.row`. |
| **Abas** | Duas formas. **Sublinhado** (Ficha, Declaração, Templates): botões 44–48px, 15/500 `#5C6385`, ativo `#161A3A` com barra 2px `#4040D6` que cresce (`scaleX`, 420ms). **Segmentado** (filtros de lista, Hoje/Semana, Mensal/Anual, CPF/CNPJ, Psicóloga/Paciente): trilho `#EFF2FB` (ou `#E7EBF8`) `padding:3–4px`, raio 10–12, pílula branca deslizante com sombra `0 1px 2px rgba(22,26,58,.1)`, texto 13–14/500 `#5C6385`, ativo `#161A3A`; contadores dentro do botão. | `components/ui/tabs/TabsList.vue:17`, `TabsTrigger.vue:19` (estilo segmentado shadcn), `PatientShell` (abas por rota) | Variantes `underline` e `segmented` no `Tabs`; pílula animada. Criar `SegmentedControl` para escolhas que não trocam painel. |
| **Diálogo** | Scrim `rgba(22,26,58,.32)`, cartão branco `max-width:440–480px`, `padding:28px`, raio 18, `gap:14–16px`, sombra `0 24px 60px rgba(22,26,58,.2)`; título 20–22/600; ações à direita (secundário + primário/perigo). Na paciente vira bottom sheet (raio `20px 20px 0 0`, scrim `.45`). Painel lateral direito (Novo paciente, Convidar psicóloga, detalhe da agenda, hash do documento): 440px, `padding:32px`, sombra `-18px 0 40px`. | `components/ui/dialog/DialogContent.vue` (overlay `bg-black/80` :26, `rounded-lg p-6 shadow-lg` :32), `components/ui/sheet/*`, `ConfirmDialog`, `UnsavedChangesDialog` | Overlay e raio novos; `Sheet` lado direito para os painéis; `Sheet` lado de baixo para confirmação no celular. |
| **Toast** | Não há toast flutuante: confirmações são faixas inline `role="status"`, `padding:12px 16px`, raio 12, `#E6EAFD`/`#2B2E9E` (14px), ou `#FDEBE7`/`#9E3522` para alerta; aparecem perto da ação (`fade`). Banner de topo em Bloqueio (`slideDown .6s`). | `components/ui/sonner/Sonner.vue` (`app.vue:7`, `top-right`) | Manter o Sonner para erros de API (A6) com as cores novas; criar `InlineNotice` (tons positivo/aviso/erro) para confirmações no lugar. |
| **Sidebar / nav** | Ver estrutura abaixo. | `components/AppSidebar.vue` (`w-60` :89, item `rounded-md px-3 py-2` :107, seção "Espaço pessoal" :123, "Documentos" desabilitado :57, rodapé com Ajustes desabilitado e "Sair" :165-193), `WorkspaceSwitcher` | Reestruturar seções e rodapé; ver abaixo. |
| **Topbar** | Não há barra superior fixa. No topo do conteúdo: busca (40px, `max-width:480px`, atalho `⌘K` em `.kbd`) + ações (Novo paciente, Agendar sessão) no Início; nas demais telas um `header` com eyebrow mono 12px + H1 32–34px à esquerda e ações à direita (`align-items:flex-end`). Telas de detalhe têm breadcrumb mono ("Pacientes / Júlia Andrade / Sessão 28"). Notificações aparecem como sino com contador (`#D9503C`). | `components/PageHeader.vue:9` (barra sticky `h-16` com título 14px e borda) | Trocar por `PageHeader` não sticky com `eyebrow`, `title` (h1), `description`, `breadcrumb` e slot de ações; manter a barra mobile de `layouts/default.vue:23`. |
| **Avatar** | Iniciais, sem foto. Redondo `#E6EAFD`/`#2B2E9E`: 34px (sidebar, 13px), 36px (listas, 12px), 44–52px (cabeçalhos). Marca `#1C1A5E`/`#FF8A70`: quadrado 32px raio 8 (workspace), redondo 40–72px (paciente, ficha). Pendente: branco + borda tracejada `#A7AFCF`. Pilha com `margin-left:-8px` e borda branca 2px. | `components/ui/avatar` (`AvatarFallback` com `bg-secondary`) | Variantes `tone` (`soft`, `brand`, `pending`) e tamanhos 32/34/36/44/52/64/72. |
| **Estado vazio** | Bloco `padding:48px 24px`, `border:1px dashed #CBD2EA`, raio 16, centralizado: título 16/600 + texto 13–14 `#5C6385` + ação secundária ("Limpar filtros"). Em tabela: `padding:32px`, 14px `#5C6385`. | padrão já usado (borda tracejada, Regra 2 do AGENTS) | Extrair `EmptyState` com as medidas novas. |
| **Erro** | Tela cheia (Erro): logo esmaecido animado, eyebrow mono "ERRO 404", H1 32px, texto, código copiável, botão primário 48px. Estados: 404, 500, sessão expirada, sem conexão. Banner de pagamento (aviso). | não existe `error.vue` | Criar `error.vue` + `ErrorState`. |
| **Carregando** | Spinner 16–18px no botão (`border:2px solid rgba(255,255,255,.35); border-top-color:#FFFFFF`); "Salvando…"/"Salvo · versão 3" mono 12px no cabeçalho de formulários; "Confirmando seu e-mail…". Não há skeleton desenhado. | `components/ui/skeleton/Skeleton.vue:13` (`bg-primary/10`) | Skeleton com `#EFF2FB`; `Spinner`; `SaveStatus` (mono). |
| **Barra de ações em massa** | Fixa embaixo, centralizada, `#1C1A5E`, raio 16, sombra `0 18px 40px rgba(22,26,58,.28)`, `barUp .45s`. | não existe | Criar `BulkActionBar`. |
| **Busca rápida** | Diálogo com input 56px/17px sem borda, grupos (Pacientes, Sessões, Documentos, Ações), item selecionado `#E6EAFD`, teclas `.kbd` (`border-bottom-width:2px`). | `components/ui/command/*` (`CommandDialog`) | Usar `CommandDialog` com o estilo novo. |
| **Upload** | `.drop` borda `1.5px dashed #A7AFCF`, raio 14, `padding:24px`; hover borda `#4040D6`; arquivo enviado em linha com "Remover". | não existe | Criar `FileDrop` (depende de endpoint de upload). |
| **Progresso** | Barra 6–8px, trilho `#EFF2FB`, preenchimento `#4040D6`, raio 3–4; etapas do cadastro "Etapa 2 de 4". | `components/ui/progress/Progress.vue:26` (`bg-primary/20`) | Cores novas; `Stepper` de etapas. |
| **Logo** | Ver abaixo. | `components/AppLogo.vue` usa o ícone `Rainbow` do lucide em `currentColor` (:2, :11) | Trocar pelo SVG próprio com as três cores. |

**Sidebar (psicóloga)**, de cima para baixo:

1. Logo: SVG 24px + "Acolhe" 18/600 `-0.02em`, `padding:0 12px`.
2. Seletor de workspace (`.sec`): botão com borda `#DDE3F3`, raio 12, `padding:10px 12px`; avatar
   quadrado 32px `#1C1A5E`/`#FF8A70` com iniciais; nome 14/600; "Trocar clínica" 12px `#5C6385`;
   ícone de setas. Só aparece com mais de um workspace.
3. `nav` "Principal", itens `.nav` 40px, `gap:12px`, `padding:0 12px`, raio 10, 14/500, ícone 18px
   (traço 1.7), cor `#3E4466`; hover `#ECEFFB`/`#161A3A`; ativo `#E6EAFD`/`#1C1A5E`; contador mono
   12px à direita (`#5C6385`; `#4040D6` quando pede ação):
   Início · Pacientes (14) · Agenda · Atividades (2) · Documentos · Templates.
4. Seção mono "Só você" (`margin:18px 12px 6px`, 11px `.14em`): Registro Documental.
5. Seção mono "Clínica" (só admin): Painel · Equipe · Assinatura.
6. Rodapé (`margin-top:auto`, `border-top`): avatar 34px, nome 14/600, CRP mono 11px, botão-ícone
   36px "Ajustes" (engrenagem) → Perfil. "Sair" sai do rodapé e vai para Ajustes (paciente) ou
   precisa de lugar definido (o protótipo da psicóloga não mostra "Sair").

Diferenças para o atual: "Espaço pessoal" vira "Só você" e perde Templates (Templates sobe para a
navegação principal); "Clínica" ganha "Assinatura" e passa a se chamar "Painel" no lugar de
"Clínica"; "Documentos" deixa de ser desabilitado; Ajustes deixa de ser "Em breve".

**Navegação da paciente**: tabbar inferior branca com `border-top:1px solid #DDE3F3`,
`padding:4px 8px 12px`, 4 itens (Início, Atividades, Check-in, Histórico), 11/500, ativo `#1C1A5E`.
Ajustes abre pelo avatar no cabeçalho. Atual: `layouts/patient.vue:26-37` tem 3 itens com âncoras
(`/patient#activities`, `/patient#check-in`) e "Sair" no header.

**Logo (SVG exato)**, 24px na sidebar, 34px animado no login:

```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4040D6" stroke-width="2" stroke-linecap="round" aria-hidden="true">
  <path d="M22 17a10 10 0 0 0-20 0"></path>
  <path d="M18 17a6 6 0 0 0-12 0" stroke="#FF7A5C"></path>
  <path d="M14 17a2 2 0 0 0-4 0" stroke="currentColor"></path>
</svg>
```

- Arco interno: `currentColor` na sidebar (texto `#161A3A`); `#1C1A5E` fixo no login/autenticação;
  `#FFFFFF` ou `currentColor` sobre fundo Noite, com arco externo `#9DB0F5`.
- Versão animada: os três `path` com `pathLength="1"`, `stroke-dasharray:1`, animação
  `arcdraw 1s cubic-bezier(.65,0,.35,1) backwards` e atrasos `.2s`, `.45s`, `.7s`.
- Versão esmaecida (erro): `stroke="#C6D2F7"`, `#FFC2B4`, `#93A9F0`, `stroke-width="1.6"`.
- Os caminhos são os mesmos do ícone `Rainbow` do lucide que o `AppLogo` usa hoje; muda a cor por arco.

---

## 3. Tela por tela (ordem do `canvas.json`)

Legenda de grupo: **(a)** existe e só muda visual/layout; **(b)** existe mas precisa de dado ou
feature nova; **(c)** tela nova sem backend; **(d)** tela nova que precisa de backend (quarto grupo
acrescentado porque várias telas novas não cabem em (c)).

| # | Tela (arquivo) | Rota atual | O que muda | Backend novo | Grupo |
|---|---|---|---|---|---|
| 1 | Login (`Main`) | `/login` | Duas colunas: painel de marca `#EEF1FE` com logo animado, frase por perfil e ilustração; formulário com segmentado "Sou psicóloga(o)" / "Sou paciente" (só troca textos), mostrar senha, estados Entrar/Entrando…/Pronto, "Esqueci a senha", "Conheça os planos". Hoje o botão diz "Entrar com 2FA" (`pages/login.vue:112`) sem haver 2FA e "Esqueci" aponta para `/forgot` (`:94`), que não existe. | Não (o mesmo `/login` serve aos dois perfis). | (a) |
| 2 | Cadastro da psicóloga (`Cadastro`) | `/signup` | Mesmas 4 etapas (Conta, CRP, Perfil, Termos), com barra "Etapa N de 4"; região do CRP vira combobox pesquisável das 24 regiões; upload do comprovante do CRP; abordagem e "Como você atende" em chips; termos como cartões com aceite de novidades opcional; tela final "Confira seu e-mail" com reenviar. | Sim: upload do comprovante do CRP e fila de verificação ("conferimos em até 24 horas úteis"; emissão de documentos só depois); campo de modalidade de atendimento; consentimento opcional de newsletter. | (b) |
| 3 | Paciente — Aceite do convite (`Convite`) | `/invite/[token]` | Layout de celular; consentimentos como switches com etiqueta (obrigatório/opcional) em vez de checkboxes; telas finais "Conta criada" e "Convite recusado". | Não (aceite e recusa já existem: `onboarding/invitations/:token/accept` e `/decline`). | (a) |
| 4 | Recuperar senha (`Senha`) | não existe (`/forgot` é link quebrado) | Fluxo em 4 passos: e-mail → "Link enviado" (reenviar) → nova senha com requisitos ao vivo → "Senha alterada". | Sim: `POST` pedir redefinição (resposta igual com e sem conta), `POST` redefinir com token (validade 1 hora, uso único), encerrar as outras sessões. E-mail via Brevo. | (d) |
| 5 | Fundamentos da identidade (`Fundamentos`) | — | Não é tela do produto: é a fonte dos tokens da seção 1. Opcional: página interna de referência. | Não | (c) se virar página interna |
| 6 | Início (`Dashboard`) | `/dashboard` | Busca com `⌘K` + ações no topo; eyebrow com data; saudação 40px com resumo do dia; card Agenda com segmentado Hoje/Semana (gráfico de barras por dia); "Para revisar" com avatar; alerta "Sem acesso há N dias" com "Enviar lembrete"; resumo do mês (pacientes ativos, sessões no mês, % de atividades respondidas). | Sim: último acesso da paciente; lembrete de atividades pendentes para a paciente (hoje só existe `notifications/reminders` de agendamento, e o envio no worker é TODO); agregado "% de atividades respondidas". Semana e contagens saem dos endpoints atuais. | (b) |
| 7 | Lista de pacientes (`Pacientes`) | `/patients` | Abas segmentadas com contagem; busca; filtro de abordagem pesquisável; tabela ordenável (Paciente com idade e "desde", Abordagem, Sessões, Adesão com barra, Último contato); "Novo paciente" em painel lateral com telefone e link copiável após envio. | Sim: a listagem (`GET /patients`) não devolve abordagem, número de sessões, adesão nem último contato (o tipo `Patient` já prevê esses campos em `types/index.ts:110-115`). | (b) |
| 8 | Ficha da paciente (`Ficha`) | `/patients/[id]` (+ `/sessions`, `/activities`, `/checkins`, `/registry`) | Cabeçalho com avatar 52px, idade, abordagem, convênio, "Vínculo ativo · 7 meses", ações "Atribuir atividade" e "Iniciar sessão das 14h"; abas sublinhadas Visão geral / Prontuário / Atividades / Check-ins (a aba Registro Documental sai da ficha); visão geral com humor de 30 dias, linha do tempo, próxima sessão, atividades respondidas (%), identificação com telefone mascarado e aviso CFP; prontuário em 4 campos editáveis com versão. | Sim: prontuário estruturado (Demanda e objetivos, Evolução, Conduta, Encaminhamento ou encerramento) — hoje a sessão tem um único `notes` (`acolhe-api/internal/session/types.go:27`); tipo de atendimento (Particular/convênio). Humor e adesão podem ser calculados com os endpoints de check-in e atividades. | (b) |
| 9 | Agenda semanal (`Agenda`) | `/agenda` (e `/sessions` também com título "Agenda") | Grade semanal por hora com eventos coloridos por status, legenda, bloqueios, visão Semana/Mês, navegação de período, "Hoje"; detalhe do evento em painel lateral com Confirmar, Realizada, Falta, Cancelar, Reagendar, Abrir sessão. | Sim só para bloqueios de horário ("Bloqueado · almoço"). Status e reagendamento já existem (`PUT /appointments/:id`, `/status`). | (b) |
| 10 | Registrar sessão (`Sessao`) | `/sessions/[id]` | Breadcrumb; dados da sessão em card; prontuário em 4 campos com "Salvando…/Salvo · versão N"; bloco escuro "Registro Documental · só você" com abas de categoria; atribuir atividade sugerida; rodapé Descartar / Salvar rascunho / Concluir sessão com diálogo de confirmação e tela de conclusão. | Sim: prontuário estruturado (mesmo item da ficha) e "concluir sessão" (trava versão; hoje existe `locked`, mas não há ação de concluir pela tela). Registro Documental reaproveita `documentary/patients/:id/:category`. | (b) |
| 11 | Registro Documental (`Registro`) | `/registry`, `/registry/[id]` | Lista de entradas de todas as pacientes com filtro por tipo (Tudo, Hipóteses, Observações, Planejamento) e por paciente; leitura ao lado com histórico de versões e "Restaurar"; "Nova entrada" com tipo e paciente. | Depende: o protótipo trata cada anotação como entrada com título; a API guarda **um caderno por paciente e categoria** (5 categorias em `schemas/documentary.ts:2-8`) com versões. Sem backend: adaptar a lista para "cadernos" (paciente × categoria) e manter as 5 categorias. Com backend: entradas múltiplas com título. | (b) |
| 12 | Biblioteca de templates (`Templates`) | `/templates` | Eyebrow "Atividades"; abas Todos / Meus / Da clínica / Biblioteca Acolhe; busca; chips de tipo; cards com tipo · versão, campos, escopo, uso, ações Enviar e Editar; arquivar com diálogo. | Sim: escopo "Da clínica" (organização), contagem "em uso", filtro por tipo (C4 deixou de fora). | (b) |
| 13 | Criar template (`Builder`) | `/templates/new`, `/templates/[id]` | Três colunas: tipos de campo à esquerda, campos no meio (reordenar por setas, obrigatório em switch), configurações e pré-visualização "Como a paciente vê" à direita; título editável inline; "Rascunho salvo às 14:32", Salvar rascunho, Publicar v1. | Sim: rascunho de template, escopo, recorrência sugerida, pontuação (soma de escalas), tipo Arquivo (upload) e Hora. Os demais tipos já existem. | (b) |
| 14 | Atribuir atividade (`Atribuir`) | dialog `components/forms/AssignActivityDialog.vue` | Vira página: combobox de template com meta, frequência (vezes por semana em stepper), prazo de cada envio, período com datas, mensagem (500), lembrete por e-mail; resumo lateral com total de envios; tela de sucesso. | Sim: recorrência com materialização de instâncias, mensagem para a paciente, lembrete antes do prazo. Hoje `POST /activities` aceita só `patientId`, `templateId` e um `dueAt`. | (b) |
| 15 | Revisar resposta (`Revisar`) | `/activities/[id]` | Navegação anterior/próxima na fila "Aguardando revisão"; respostas por campo em cards; comentário da paciente; "Sua revisão" com comentário Compartilhado/Interno; tags só da psicóloga; "Marcar como revisada" e "Ir para a próxima". | Sim: comentários (com visibilidade) e tags; hoje `PUT /activities/:id/review` não recebe corpo. | (b) |
| 16 | Emitir declaração (`Declaracao`) | não existe | Abas Novo documento / Emitidos; tipo em cartões (Declaração de comparecimento, Atestado psicológico, Recibo); paciente; sessões incluídas (checkbox); finalidade; pré-visualização em papel com código e hash; "Baixar rascunho", gerar, link de 24 h. | Sim: o `POST /documents/generate` existe mas o worker não gera PDF (`acolhe-api/internal/worker/worker.go:80`, TODO); falta conteúdo por tipo, sessões incluídas, finalidade, assinatura, código e hash, link temporário, rascunho. | (d) |
| 17 | Exportação LGPD (`Exportacao`) | sem página; botão `RecordExportButton` / menu da `PatientShell` (atrás de `lgpdExportEnabled`) | Página em Ajustes › Privacidade e dados; segmentado "Dados de uma paciente" / "Minha conta"; lista do que entra com quantidades; logs de acesso opcionais; aviso de que o Registro Documental não entra; progresso; histórico de exportações. | Sim para "Minha conta", logs de acesso, contagens por item e histórico. A exportação por paciente já existe (`POST /patients/:id/export` + worker com e-mail). | (b) |
| 18 | Paciente — Início (`Paciente`) | `/patient` | Saudação; próxima sessão com "Confirmar presença"; check-in rápido com 5 humores (escala de cor) e sentimentos opcionais; atividades pendentes; tabbar de 4 itens. | Sim: sentimentos ("Ansiedade", "Calma"…) no check-in; hoje o check-in tem só `mood` e `note`. Confirmar presença e pendências já existem. | (b) |
| 19 | Paciente — Respondendo atividade (`Responder`) | `/patient/activities/[id]` | Uma pergunta por vez com "Pergunta N de 4" e barra de progresso; rodapé fixo Voltar / Continuar; "Salvar rascunho"; tela de envio. | Só se o rascunho for no servidor (pode ficar no navegador). Envio já existe. | (a) |
| 20 | Paciente — Meu prontuário (`ProntuarioPaciente`) | não existe | Lista de sessões e leitura de cada uma (Demanda, Evolução, Conduta, versão); "Baixar cópia (PDF)". | Sim: endpoint do portal que devolva as sessões com o prontuário (hoje há só `GET /patient/process-summary` com contagens) e o PDF. | (d) |
| 21 | Paciente — Compartilhar histórico (`Compartilhar`) | não existe | Escolher o que compartilhar (prontuário, respostas, check-ins, documentos) e o período com outra psicóloga; confirmação; revogável em Ajustes. | Sim: modelo de compartilhamento entre psicólogas, concessão e revogação de acesso de leitura. | (d) |
| 22 | Planos (`Planos`) | não existe | Página pública: segmentado Mensal/Anual, planos Autônomo e Clínica (stepper de psicólogas), código de cortesia, garantias. | Sim: catálogo de planos/preços e validação de cortesia. A parte estática pode sair antes. | (d) |
| 23 | Checkout (`Checkout`) | não existe | Dados de cobrança CPF/CNPJ, Cartão/Pix, resumo escuro com cupom, processamento e "Assinatura ativa". | Sim: gateway de pagamento, assinatura, NFS-e. | (d) |
| 24 | Assinatura e faturas (`Assinatura`) | não existe | Banner de falha de cobrança, plano atual, vagas, forma de pagamento, faturas com NF, cancelamento com diálogo. | Sim: cobrança, faturas, vagas, cancelamento. | (d) |
| 25 | Clínica — Equipe (`Equipe`) | `/clinica/equipe` | Vagas do plano; tabela com CRP, papel, nº de pacientes, situação e ações (reenviar, remover); ocupação da semana por psicóloga; convite em painel lateral com papel Psicóloga/Admin em cartões. | Sim: vagas (cobrança), CRP e ocupação/faltas por profissional. Equipe, convites, reenviar, revogar e mudanças de vínculo já existem (`/clinic/*`). | (b) |
| 26 | Verificação de e-mail (`VerificarEmail`) | `/verify-email` | Mesmos estados (aguardando, confirmando, confirmado, link vencido, link inválido) com o visual novo e contagem regressiva no reenvio; "Continuar" leva a Criar clínica. | Não, exceto "Trocar e-mail" de conta pendente, que não existe. | (a) |
| 27 | Criar clínica (`CriarClinica`) | não existe | Etapa 3 do onboarding: "Atendo sozinha" ou "Tenho uma clínica" (nome, CNPJ, nº de psicólogas, convites); etapa 4 é Planos. | Sim: criar organização do tipo clínica pelo próprio usuário (hoje clínicas são provisionadas fora do app), nome do consultório, convites adiados até a assinatura. | (d) |
| 28 | Fila de atividades (`Atividades`) | `/activities` | Abas Para revisar / Em andamento / Atrasadas / Concluídas com contagem; filtros por paciente e template; seleção múltipla com barra de ações (Enviar lembrete, Encerrar); ações por linha (Revisar, Lembrar). | Sim: lembrete de atividade para a paciente e encerrar atribuição (não há rota de cancelar). O agrupamento por status já existe (`utils/activity-queue.ts`). | (b) |
| 29 | Documentos emitidos (`Documentos`) | não existe (item da sidebar desabilitado) | Tabela com código, tipo, paciente, data, validade do link; ações baixar, copiar link, ver hash; painel "Integridade do documento". | Sim: listagem de todas as pacientes (hoje `GET /documents?patientId=`), código, hash, link temporário, PDF real. | (d) |
| 30 | Notificações (`Notificacoes`) | não existe | Caixa com Todas/Não lidas, agrupada por dia, "Marcar todas como lidas", link para Preferências. | Sim: caixa de notificações (persistência, leitura). | (d) |
| 31 | Busca rápida ⌘K (`Busca`) | não existe | Diálogo de comando com grupos Pacientes, Sessões, Documentos, Ações e navegação por teclado. | Não para Pacientes e Ações (dados já carregados); Sessões e Documentos por texto precisam de endpoint de busca. | (c) |
| 32 | Paciente — Check-in (`CheckinPaciente`) | dentro de `/patient` (âncora `#check-in`) | Página própria: humor, sono (dormi/acordei em stepper de 15 min, qualidade 1–5), sentimentos, frase do dia, últimos 14 dias com média. | Sim: sono, qualidade do sono e sentimentos no check-in. | (b) |
| 33 | Paciente — Atividades (`AtividadesPaciente`) | dentro de `/patient` (âncora `#activities`) | Página própria com Pendentes/Enviadas; enviadas abrem o comentário da psicóloga. | Sim: listar atividades já enviadas pela paciente e os comentários compartilhados (depende do item 15). | (b) |
| 34 | Paciente — Ajustes e consentimentos (`AjustesPaciente`) | não existe | Dados, psicóloga, consentimentos com switch e revogação (bottom sheet), baixar meus dados, compartilhar, trocar senha, sair. | Sim: editar dados, revogar consentimento, exportação pedida pela paciente, troca de senha logada. | (d) |
| 35 | Clínica — Painel do administrador (`PainelClinica`) | `/clinica` | Segmentado Semana/Mês, 4 números (sessões realizadas, taxa de faltas, ocupação, pacientes ativos), barras por psicóloga, tabela com faltas e ocupação, vagas do plano. | Sim: faltas, ocupação e recorte por período; hoje o overview devolve `activePatients`, `sessionsLast30Days`, `upcomingAppointments` (`acolhe-api/internal/clinic/members.go:28-39`). | (b) |
| 36 | Ajustes — Perfil (`Perfil`) | não existe ("Ajustes" desabilitado na sidebar) | Sub-navegação de Ajustes (Perfil, Segurança, Notificações, Privacidade e dados, Assinatura); foto; dados pessoais com nome social e troca de e-mail confirmada; dados profissionais (CRP verificado, abordagem, duração padrão); imagem da assinatura; barra "Alterações não salvas". | Sim: atualizar perfil, foto, imagem de assinatura, troca de e-mail com confirmação, duração padrão. | (d) |
| 37 | Ajustes — Segurança (`Seguranca`) | não existe | Trocar senha, 2FA por aplicativo (QR, códigos de recuperação), sessões ativas, sair por inatividade. | Sim: troca de senha logada, TOTP, listagem/encerramento de sessões, preferência de inatividade. | (d) |
| 38 | Ajustes — Notificações (`PrefNotificacoes`) | não existe | Matriz evento × canal (e-mail, no app) com switches, salvamento automático, horário do resumo diário. | Sim: preferências de notificação e envio dos e-mails. | (d) |
| 39 | Equipe Acolhe — Assinaturas e cortesias (`Admin`) | não existe | Painel interno: contas e status de cobrança, criação de códigos de cortesia, tabela de códigos. | Sim: papel de staff, contas/assinaturas, cortesias. | (d) |
| 40 | Assinatura vencida (`Bloqueio`) | não existe (parecido: `/espaco-inativo`, `/sem-acesso`) | Início em modo leitura: banner de pagamento, botões bloqueados, agenda só leitura, o que continua liberado, última cobrança. | Sim: estado de assinatura e bloqueio de escrita na API. | (d) |
| 41 | Erros e sessão expirada (`Erro`) | não existe (`error.vue` ausente) | 404, 500 com código copiável e "Tentar de novo", sessão encerrada por inatividade, sem conexão (texto guardado no navegador). | Não (o encerramento por inatividade depende do item 37 se for configurável; a mensagem pode usar o 401 atual). | (c) |

**Resumo por grupo**

- (a) só visual: 1 Login, 3 Convite, 19 Responder, 26 Verificar e-mail.
- (b) existe e precisa de dado/feature: 2 Cadastro, 6 Início, 7 Pacientes, 8 Ficha, 9 Agenda,
  10 Sessão, 11 Registro Documental, 12 Templates, 13 Builder, 14 Atribuir, 15 Revisar,
  17 Exportação, 18 Paciente — Início, 25 Equipe, 28 Fila de atividades, 32 Check-in,
  33 Atividades da paciente, 35 Painel da clínica. Em quase todas, o layout novo pode sair antes
  com os dados atuais, deixando de fora só os blocos sem dado.
- (c) nova sem backend: 5 Fundamentos (opcional), 31 Busca (Pacientes + Ações), 41 Erros.
- (d) nova com backend: 4 Recuperar senha, 16 Declaração, 20 Meu prontuário, 21 Compartilhar,
  22 Planos, 23 Checkout, 24 Assinatura, 27 Criar clínica, 29 Documentos, 30 Notificações,
  34 Ajustes da paciente, 36 Perfil, 37 Segurança, 38 Preferências de notificação, 39 Admin,
  40 Bloqueio.

Rotas novas sugeridas, seguindo o padrão em inglês das rotas clínicas: `/forgot`,
`/reset-password`, `/plans`, `/checkout`, `/onboarding/clinic`, `/documents`, `/documents/new`,
`/notifications`, `/settings/profile`, `/settings/security`, `/settings/notifications`,
`/settings/privacy`, `/clinica/assinatura`, `/patient/activities`, `/patient/check-in`,
`/patient/history`, `/patient/share`, `/patient/settings`, `/admin`.

---

## 4. Ordem sugerida de implementação (PRs pequenos)

Cada PR passa pelo checklist A7. Os PRs 1–9 não dependem de backend.

1. **Tokens e fontes.** `main.css` (variáveis da seção 1.8, tokens novos, keyframes,
   `prefers-reduced-motion`), `tailwind.config.ts` (fontes, cores novas, `--radius` 10px),
   `nuxt.config.ts` (Google Fonts), `.display-serif` redefinida. Decisão do tema escuro antes.
2. **Botão, input, textarea, label.** Variantes e tamanhos novos, anel de foco 4px, `loading`,
   `PasswordInput`.
3. **Badge, card, avatar, estado vazio, skeleton, spinner, `InlineNotice`, `SaveStatus`.**
4. **Controles de escolha.** `Switch` (novo), `Checkbox`/`CheckboxCard`, `RadioCardGroup`,
   `ChoiceChips`, `NumberStepper`, `SegmentedControl`, `Tabs` com variantes sublinhado/segmentado,
   restilo do `CustomDropdown` (gatilho de filtro).
5. **Sobreposições.** `Dialog` (scrim, raio, sombra), `Sheet` lateral 440px e bottom sheet,
   `ConfirmDialog`, Sonner com cores novas, `BulkActionBar`.
6. **Logo e shell da psicóloga.** `AppLogo` com o SVG, `AppSidebar` com as seções novas,
   `WorkspaceSwitcher`, `PageHeader` (eyebrow, H1, breadcrumb, ações), barra mobile.
7. **Shell da paciente.** Header com avatar, tabbar de 4 itens; rotas `/patient/activities` e
   `/patient/check-in` separando o que hoje é âncora (só front, mesmos endpoints).
8. **Autenticação.** Login, Convite, Verificar e-mail, `error.vue` (404/500/sessão/sem conexão).
9. **Telas clínicas, layout com dados atuais** (um PR por tela): Início, Pacientes (painel lateral),
   Ficha (sem a aba Registro Documental), Agenda (grade semanal + painel), Sessão, Fila de
   atividades, Revisar, Templates, Builder, Registro Documental (modelo de cadernos), Equipe,
   Painel da clínica, Busca ⌘K (Pacientes + Ações), telas da paciente.
10. **Cadastro em 4 etapas com o visual novo**, sem upload do CRP (entra no PR 14).
11. **Recuperar senha** (API + web) — destrava o link quebrado do login.
12. **Ajustes da psicóloga: Perfil e Segurança (só troca de senha)** — API de perfil e senha.
13. **Prontuário estruturado** (API + Sessão + Ficha + Meu prontuário da paciente).
14. **Upload** (componente + endpoint), usado no comprovante do CRP, foto e assinatura.
15. **Atividades:** comentários e tags na revisão → atividades enviadas da paciente →
    lembrete e encerrar na fila → recorrência e mensagem no Atribuir.
16. **Check-in completo** (sentimentos, sono) e bloqueios de agenda.
17. **Documentos:** geração real de PDF com código/hash → Emitir declaração → Documentos emitidos
    → Exportação em Ajustes (minha conta, histórico).
18. **Notificações:** preferências → caixa de notificações.
19. **Compartilhar histórico e Ajustes da paciente** (consentimento, dados, exportação).
20. **Cobrança** (decidir gateway e preços antes): Planos → Criar clínica → Checkout →
    Assinatura → Bloqueio → Admin de cortesias. 2FA fica junto ou depois.
