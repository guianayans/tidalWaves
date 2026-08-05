# tidalWaves — handoff

Live-coding musical no navegador: self-host do [Strudel](https://strudel.cc) (fork vendorizado) + backend próprio pra salvar/carregar projetos e gravar áudio no servidor. Rodando em produção em `https://tidalwaves.gvtserver.online` via Coolify/Traefik no servidor GVT.

## Status atual

Deploy no Coolify **funcionando** (confirmado pelo usuário). Passamos por 3 rodadas de bugs no Docker build/runtime, todos corrigidos e commitados:

1. `pnpm install --frozen-lockfile` falhando por dependência nativa sem toolchain de compilação → adicionado `python3 make g++ git` nas stages de build do Dockerfile.
2. `ERR_PNPM_IGNORED_BUILDS` (pnpm 10 trata script de build não aprovado/negado como erro fatal em modo não-interativo) → `@serialport/bindings-cpp` explicitamente negado em `strudel/pnpm-workspace.yaml` (`ignoredBuiltDependencies`), pnpm fixado em `10.19.0` no Dockerfile.
3. `ERR_DLOPEN_FAILED: invalid ELF header` no `better-sqlite3` (binário nativo de arquitetura errada vazando pro build via `COPY server ./server`, sem `.dockerignore`) → criado `.dockerignore` na raiz + reordenados os `COPY` da stage final pra o `node_modules` buildado dentro da imagem sempre vencer.

**O que ainda não foi verificado**: a aplicação nunca foi testada de fato num navegador real (Play, editar código, salvar projeto, gravar áudio). Toda a validação até agora foi via `curl` contra a API (`/health`, CRUD de `/api/projects`, upload/download de `/api/recordings`) e builds locais bem-sucedidos — funcionalmente sólido, mas a UI nova (painel de projetos, botões Save/Record) nunca foi clicada de verdade. **Isso é o próximo passo natural pra quem tiver acesso ao navegador.**

## Arquitetura

```
tidalWaves/                    (repo local em /Users/yanguimaraesviana/Desktop/tidalWaves
                                 == /pendriver/tidalWaves no servidor)
  strudel/                     fork vendorizado via `git subtree` (codeberg.org/uzu/strudel)
    packages/webaudio/webaudio.mjs   <- EDITADO (aditivo): renderPatternAudio aceita
                                         {download:false} e retorna o Blob em vez de
                                         só disparar download do navegador
    website/src/repl/
      useReplContext.jsx        <- EDITADO (aditivo): novo handleRecord() no context,
                                     reusa a renderização offline (não é MediaRecorder
                                     ao vivo — evita problemas de codec/Safari)
      components/panel/Panel.jsx <- EDITADO (aditivo): nova aba "projects" + botões
                                     Save/Record na toolbar (MainMenu)
      components/tidalwaves/    <- TUDO NOVO, isolado, zero conflito com upstream
        api-client.js            fetch wrappers pra /api/*
        store.js                 nanostore (persistentAtom) com o projeto atualmente
                                  carregado, compartilhado entre painel e toolbar
        ProjectsPanel.jsx         aba lateral: listar/carregar/renomear/apagar projetos
                                  + lista de gravações do projeto ativo (player <audio>)
        SaveButton.jsx            botão da toolbar: salva código atual (PUT se já tem
                                  projeto carregado, senão prompt() de nome + POST)
        RecordButton.jsx          botão da toolbar: renderiza 8 ciclos offline e faz
                                  upload multipart pro backend

  server/                      backend Node novo (Express + SQLite)
    src/index.js                serve /api/* E os arquivos estáticos do site na
                                 mesma porta (PORT, default 4025)
    src/db.js                   better-sqlite3, banco em $TIDALWAVES_DATA_DIR/tidalwaves.db
    src/schema.sql               tabelas: projects (id,name,code,timestamps),
                                 recordings (id,project_id,filename,format,duration,...)
    src/routes/projects.js       GET/POST /api/projects, GET/PUT/DELETE /api/projects/:id
    src/routes/recordings.js     POST /api/recordings (upload multipart, transcodifica
                                 webm->wav via ffmpeg com fallback gracioso se faltar),
                                 GET /api/recordings?project_id=, .../:id/download, DELETE
    src/transcode.js             wrapper de child_process pro ffmpeg

  Dockerfile                   multi-stage: build do Astro (strudel/website) + deps do
                                backend + runtime slim com ffmpeg instalado
  docker-compose.yml           preenchido: slug tidalwaves, porta 4025,
                                domínio tidalwaves.gvtserver.online, volume
                                /pendriver/tidalWaves_hist:/data (SQLite + gravações)
  dynamic-proxy.yaml           equivalente Traefik file-provider (opcional, labels
                                do compose já bastam)
  .dockerignore                exclui node_modules etc do build context
  PORTAS.md / README.md        atualizados com a entrada do tidalWaves
```

## Decisões importantes (pra não repetir discussão)

- **Por que self-host Strudel em vez de DSL própria + SuperCollider**: a sintaxe que o usuário queria (`n().scale().s().acidenv()._pianoroll()`) já É a sintaxe do Strudel — reescrever do zero seria semanas de trabalho pra reinventar algo que já existe, testado, e open-source (AGPL-3.0).
- **Por que `git subtree` e não fork solto/submodule**: mantém tudo num repo só (`git clone` único no Coolify), permite `git subtree pull --prefix=strudel https://codeberg.org/uzu/strudel main --squash` pra trazer updates do upstream depois, sem quebrar o build com submodules.
- **Regra de edição no upstream**: só 3 arquivos existentes do Strudel foram tocados (`Panel.jsx`, `useReplContext.jsx`, `webaudio.mjs`), todas as mudanças são aditivas/retrocompatíveis (novos parâmetros com default, novas funções, novos imports) — zero lógica existente foi alterada. Toda lógica nova mora em `website/src/repl/components/tidalwaves/`, que nunca conflita em merge.
- **Gravação de áudio**: não usa `MediaRecorder` em tempo real (que teria problema de codec no Safari e exigiria achar o node de output ao vivo). Em vez disso, reaproveita a função de "Export to WAV" que o Strudel já tinha (renderização offline via `OfflineAudioContext`), só adicionei um jeito dela devolver o Blob em vez de forçar download — mais robusto, determinístico, sem depender de captura em tempo real.
- **Sem bind-mount de `/app`** no docker-compose (diferente dos outros apps do servidor que rodam código interpretado direto): o Strudel precisa de build real (`pnpm install` + `astro build`), então a imagem já vem com tudo compilado dentro. Único volume persistente é `/data` (banco + gravações).
- **Sem autenticação** no MVP — domínio é público na internet. Pendente decidir se vale adicionar Traefik basic-auth.

## Próximos passos sugeridos (pro Claude com navegador)

1. Abrir `https://tidalwaves.gvtserver.online`, confirmar que o REPL do Strudel carrega normal (Play/Stop, editor, piano-roll) — igual ao strudel.cc original.
2. Testar o fluxo novo: aba "projects" na lateral → criar projeto novo → digitar um padrão → Save → recarregar página → carregar o projeto salvo → confirmar que o código volta certinho.
3. Testar Record: apertar Play num padrão, depois "record" na toolbar (grava 8 ciclos offline, ~alguns segundos de processamento), confirmar que aparece na lista de "Recordings" do projeto ativo com player funcionando.
4. Checar console do navegador (`read_console_messages`) por qualquer erro JS ao carregar a página ou clicar nesses botões — é a parte que nunca foi validada de verdade.
5. Se algo quebrar, os arquivos relevantes da UI nova estão todos em `strudel/website/src/repl/components/tidalwaves/` e os pontos de montagem em `strudel/website/src/repl/components/panel/Panel.jsx` (linhas ~124-166 pra toolbar, ~263-283 pro switch de abas) e `strudel/website/src/repl/useReplContext.jsx` (função `handleRecord`, ~linha 245).

## Coisas não decididas / em aberto

- Autenticação (basic-auth via Traefik?) antes de divulgar a URL pra mais gente.
- AGPL-3.0: ok pra uso pessoal; se outras pessoas passarem a usar o app publicamente, tecnicamente precisa disponibilizar o código-fonte modificado.
- Duração fixa de 8 ciclos por gravação (`CYCLES_TO_RECORD` em `RecordButton.jsx`) — pode virar configurável se fizer sentido depois de testar.
