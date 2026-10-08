# Registro Documental

O menu `/registry` lista pacientes com cadernos salvos pela autora. A ficha tem a
aba `/patients/:id/registry`, inclusive para pacientes inativas. Ambos usam
`DocumentaryEditor` e as mesmas rotas do BFF/API.

Categorias fixas, texto simples e salvamento manual. O conteúdo fica apenas na
memória da página enquanto não for salvo. Salvar exige alteração exata do texto,
permissão de escrita e ausência de gravação em andamento. Limpar todo o texto
preserva o caderno e gera uma versão vazia.

O histórico paginado abre um modal com conteúdo, comparação de trechos e ações
independentes: **Usar no editor** altera somente o rascunho; **Restaurar esta
versão** grava imediatamente usando a revisão atual. Ambas confirmam substituição
quando existe texto pendente. Navegação, troca de categoria e fechamento também
protegem alterações não salvas. O navegador decide como apresentar o aviso de
fechamento; não há recuperação de rascunhos depois que a página fecha.

Um conflito mantém o rascunho e permite consultar a revisão mais recente,
comparar e escolher conscientemente a base para uma nova gravação. Nenhum retry
automático altera a revisão esperada. Paciente/vínculo inativo mantém leitura e
histórico; a API também bloqueia salvamento e restauração.

## Privacidade e contrato

O BFF em `server/api/documentary/[...path].ts` permite somente as rotas previstas,
valida requests e responses com Zod e encaminha o cookie HttpOnly pelo `apiFetch`.
Erros do upstream são normalizados sem propagar objetos com corpo clínico.
Datas RFC3339 aceitam offset e microssegundos, conforme o PostgreSQL/API Go.

Chaves do cache incluem organização, autora e paciente. A identidade usa o mesmo
`/api/me` do shell. Login/logout e mudança de identidade limpam os caches; ao
retornar à aba, `/api/me` é atualizado para detectar troca de sessão em outra aba.
Editor e versões são limpos ao desmontar/trocar a sessão. Não há persistência em
localStorage, sessionStorage ou IndexedDB. BFF e HTML documental usam `no-store`.

A comparação usa o prefixo/sufixo comum para exibir o trecho substituído em tempo
linear; é uma comparação de textos salvos, não um registro de eventos de teclado.

## Validação realizada

- `pnpm run typecheck`, `pnpm test` (94 testes), build de produção.
- Chromium local com API real e PostgreSQL isolado, usando RLS sem BYPASSRLS:
  salvamento, confirmação/cancelamento de categoria e navegação, duas abas com
  conflito, reconhecimento explícito da revisão, uso no editor, restauração,
  lista e conteúdo idêntico no acesso pela ficha.
- Conferência visual desktop e celular de 390 px: editor, lista, histórico,
  comparação e modal. Sem rolagem horizontal da página.
- Proteção de fechamento, ausência de persistência local do rascunho, `no-store`
  no HTML e limpeza do conteúdo após logout da sessão.

## Publicação

Publicar primeiro a API de `feat/registro-documental`, suas migrações e os Secrets
`DOCUMENTARY_ACTIVE_KEY_ID` / `DOCUMENTARY_ENCRYPTION_KEYS`. Conferir o inventário
criptográfico, resolver registros legados se existirem e validar leitura/escrita.
Somente então publicar este frontend. Configuração indisponível resulta em erro
controlado; nunca em um caderno vazio editável. Os PRs são separados e apontam para
`develop`; esta entrega não faz merge ou configura os ambientes automaticamente.
