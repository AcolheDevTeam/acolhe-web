# acolhe-web

Frontend do Acolhe — Nuxt 3, SSR-first, LGPD-compliant.

## Stack
- **Nuxt 3** — roteamento, SSR, server routes
- **Pinia** — estado global (perfil, rascunho clínico, preferências)
- **VeeValidate + Zod** — validação de formulários
- **Tailwind CSS** — estilo
- `$fetch` / `useFetch` — requisições (nativo do Nuxt)

## Estrutura
```
pages/         rotas (login, dashboard, patients, sessions)
components/     design system interno
composables/    lógica reutilizável (usePatient, useSession)
stores/         Pinia: auth, clinicalDraft, preferences
schemas/        Zod — contrato com o backend
server/api/     server routes — proxy para a API Go (token nunca vai ao cliente)
middleware/     auth, psychologist-only
```

## Primeiros passos
```bash
cp .env.example .env   # aponte API_URL para a acolhe-api
pnpm install
pnpm dev               # http://localhost:3000
```

> Usa **pnpm** (fixado em `packageManager` no `package.json`). O
> `pnpm-workspace.yaml` libera os build scripts de `esbuild`/`@parcel/watcher`
> (senão o pnpm 10+ falha com `ERR_PNPM_IGNORED_BUILDS`).

## Deploy (Cloudflare Pages)

SSR-first, então **não é estático** — as rotas `server/api/*` rodam no runtime
Workers (preset `cloudflare-pages` no `nuxt.config.ts`). Sem Terraform e sem
GitHub Actions: a integração Git nativa do Pages builda e faz deploy sozinha.

Fluxo (espelha a acolhe-api): `develop` → staging, `main` → production.
Usamos **um único projeto Pages** (`acolhe-web`) com os dois ambientes nativos
do Pages — Production e Preview:

| Ambiente Pages | Branch                    | URL                              |
|----------------|---------------------------|----------------------------------|
| Production     | `main`                    | `acolhe-web.pages.dev`           |
| Preview        | `develop` (e outras)      | `develop.acolhe-web.pages.dev`   |

**Config de build:**
- Framework preset: **Nuxt.js**
- Build command: `pnpm run build`
- Build output directory: `dist`
- Node version: 20+ (variável `NODE_VERSION=20` se precisar forçar)

> A Cloudflare detecta o `pnpm-lock.yaml` + `packageManager` e usa pnpm via
> corepack automaticamente na instalação.

**Variáveis de ambiente** (Settings → Variables and Secrets). O Pages tem escopo
separado **Production** vs **Preview** — é assim que cada ambiente aponta pra API
certa. São *server-only*: nunca use prefixo `NUXT_PUBLIC_`, senão vazam pro
cliente (LGPD).

| Variável  | Production (`main`)                | Preview (`develop`)               |
|-----------|-----------------------------------|-----------------------------------|
| `API_URL` | `https://163.176.228.171.nip.io`  | `https://136.248.118.237.nip.io`  |

> `API_SECRET` existe no `runtimeConfig` como gancho, mas hoje a API Go **não
> valida segredo compartilhado** (só JWT) — então não precisa configurar. Adicionar
> quando houver auth serviço-a-serviço.

> Como o browser só fala com o próprio Nuxt (padrão BFF), a API Go **não precisa
> de CORS** para o frontend.

## Convenções (da spec)
- **Só hidrate o que é interativo.** Componentes de leitura (timeline, prontuário,
  dashboard) devem ser `Lazy` ou `<NuxtIsland>`.
- **`useFetch` para dados do servidor; Pinia só para estado global.**
  Perfil, rascunho de prontuário e preferências → Pinia. Listas, timelines,
  atividades, agendamentos → `useFetch`.
- **Chaves de cache incluem o contexto** (`patient-${id}`) — nunca misturar dados
  de pacientes diferentes (LGPD).
- **Dados sensíveis passam por `server/api/`** — credenciais da API Go nunca chegam
  ao browser.
