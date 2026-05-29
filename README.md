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
