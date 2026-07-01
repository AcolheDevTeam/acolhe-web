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
npm install
npm run dev            # http://localhost:3000
```

## Deploy (Cloudflare Pages)

SSR-first, então **não é estático** — as rotas `server/api/*` rodam no runtime
Workers (preset `cloudflare-pages` no `nuxt.config.ts`). Sem Terraform e sem
GitHub Actions: a integração Git nativa do Pages builda e faz deploy sozinha.

Fluxo (espelha a acolhe-api): `develop` → staging, `main` → production.
Usamos **dois projetos Pages** para ter URL estável e env vars por ambiente:

| Projeto Pages       | Production branch | Ambiente   |
|---------------------|-------------------|------------|
| `acolhe-web-staging`| `develop`         | staging    |
| `acolhe-web`        | `main`            | production |

**Config de build (igual nos dois projetos):**
- Framework preset: **Nuxt**
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 20+ (variável `NODE_VERSION=20` se precisar forçar)

**Variáveis de ambiente** (dashboard → Settings → Environment variables).
São *server-only* — nunca use prefixo `NUXT_PUBLIC_`, senão vazam pro cliente (LGPD):

| Variável     | staging (`acolhe-web-staging`)         | production (`acolhe-web`)              |
|--------------|----------------------------------------|----------------------------------------|
| `API_URL`    | `https://136.248.118.237.nip.io`       | `https://163.176.228.171.nip.io`       |
| `API_SECRET` | (o mesmo segredo configurado na API)   | (o mesmo segredo configurado na API)   |

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
