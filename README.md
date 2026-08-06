# acolhe-web

Frontend do Acolhe — Nuxt 3, SSR-first, LGPD-compliant.

## Stack
- **Nuxt 3** — roteamento, SSR, server routes
- **Pinia** — estado global (perfil, rascunho clínico, preferências)
- **VeeValidate + Zod** — validação de formulários
- **shadcn-vue** — design system (sobre Tailwind CSS)
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
pnpm install
pnpm dev               # API local
pnpm dev:staging       # API de staging
pnpm dev:production    # API de producao
```

Cada comando carrega, respectivamente, `.env.development`, `.env.staging` ou
`.env.production`. Todos iniciam o Nuxt localmente em `http://localhost:3000`;
o que muda e o ambiente da API consumida.

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
certa. `API_URL` é *server-only*: nunca use prefixo `NUXT_PUBLIC_` em valores
sensíveis, senão eles vazam para o cliente (LGPD).

| Variável                          | Production (`main`)               | Preview (`develop`)              |
|-----------------------------------|-----------------------------------|----------------------------------|
| `API_URL`                         | `https://163.176.228.171.nip.io`  | `https://136.248.118.237.nip.io` |
| `NUXT_PUBLIC_LGPD_EXPORT_ENABLED` | `false`                           | `false`                          |

`NUXT_PUBLIC_LGPD_EXPORT_ENABLED` é uma feature flag pública e não contém dados
sensíveis. Quando estiver ausente ou definida como `false`, a ação de exportação
LGPD fica oculta. Altere para `true` somente nos ambientes em que o envio do link
privado por e-mail estiver operacional.

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
