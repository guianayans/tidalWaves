# tidalWaves

Live-coding musical no navegador: self-host do [Strudel](https://strudel.cc) (vendorizado em `strudel/` via `git subtree`) + backend próprio (`server/`) para salvar/carregar projetos e persistir gravações de áudio no servidor. Veja o plano completo em `.claude/plans` ou peça um resumo.

## Rodar localmente

```bash
cd strudel && pnpm install && npm run build && cd ..
cd server && npm install && cd ..
ln -sfn strudel/website/dist website-dist
TIDALWAVES_DATA_DIR=./data PORT=4025 node server/src/index.js
# abrir http://localhost:4025
```

## Deploy (Coolify)

1. `git push`/`rsync` deste repo para `/pendriver/tidalWaves` no servidor.
2. Criar o app no Coolify apontando pra esse diretório (usa `docker-compose.yml` já preenchido: slug `tidalwaves`, porta `4025`, domínio `tidalwaves.gvtserver.online`).
3. Configurar DNS de `tidalwaves.gvtserver.online` apontando pro servidor.
4. Deploy — o healthcheck bate em `/health`; dados (SQLite + gravações) persistem em `/pendriver/tidalWaves_hist` (volume `/data`).

## Estrutura

- `strudel/` — fork vendorizado do Strudel (upstream via `git subtree pull --prefix=strudel https://codeberg.org/uzu/strudel main --squash`). Edições próprias ficam isoladas em `strudel/website/src/repl/components/tidalwaves/` (novos arquivos) + 3 pontos de montagem mínimos em `Panel.jsx`/`useReplContext.jsx`/`webaudio.mjs` (todos aditivos, retrocompatíveis).
- `server/` — API Express + SQLite (`better-sqlite3`) para projetos/gravações, serve o build estático do Strudel na mesma porta.
- `Dockerfile` — multi-stage: build do Astro, deps do backend, runtime com `ffmpeg` (transcodifica gravações de `.webm`/`.wav` para `.wav`).

---

# Server App Base — kit para novos apps

Pasta de **templates e instruções** para criar apps no servidor **GVT** (Coolify + Traefik + `/pendriver`).

## Para você (humano)

Quando for criar um app novo no chat do Cursor, diga algo como:

> Crie um app novo seguindo `server-app-base/INSTRUCOES-PARA-IA.md`

O assistente deve pedir só:

1. Nome do app (slug)
2. Pasta em `/pendriver`
3. URL (ex.: `meuapp.gvtserver.online`)
4. Porta (ex.: `4021`)

## Arquivos desta pasta

| Arquivo | Uso |
|---------|-----|
| [INSTRUCOES-PARA-IA.md](./INSTRUCOES-PARA-IA.md) | Regras completas para o assistente |
| [PORTAS.md](./PORTAS.md) | Portas já usadas — evitar conflito |
| [docker-compose.empty.yml](./docker-compose.empty.yml) | Template Compose + labels Traefik |
| [dynamic-proxy.empty.yaml](./dynamic-proxy.empty.yaml) | Template Traefik file provider |
| [.env.example.empty](./.env.example.empty) | Variáveis de ambiente modelo |

## Placeholders nos templates

| Placeholder | Significado | Exemplo |
|-------------|-------------|---------|
| `__APP_SLUG__` | Identificador (service, container, router) | `downloader` |
| `__APP_DIR__` | Pasta sob `/pendriver` | `downloader` |
| `__APP_PORT__` | Porta HTTP interna | `4020` |
| `__APP_DOMAIN__` | Domínio sem `www` | `downloader.gvtserver.online` |
| `__APP_PREFIX__` | Prefixo de env vars (MAIÚSCULAS) | `DOWNLOADER` |

## Deploy rápido (resumo)

1. Copiar código para `/pendriver/{pasta}` no servidor
2. Preencher templates → `docker-compose.yml` + `dynamic-proxy.yaml`
3. Configurar `.env` no Coolify
4. Adicionar/atualizar `dynamic-proxy.yaml` no Traefik (se usar file provider)
5. Deploy do stack no Coolify
6. Atualizar [PORTAS.md](./PORTAS.md)

## Apps existentes

| App | Pasta | Repo |
|-----|-------|------|
| Downloader Analyser | `/pendriver/downloader` | [guianayans/DownloaderAnalyser](https://github.com/guianayans/DownloaderAnalyser) |
| ComfyUI Flux | `/pendriver/flux` | *(local)* |
| GVT Remote (MeshCentral) | `/pendriver/remote` | *(local)* |

## Infraestrutura fixa (não muda por app)

- **Orquestração:** Coolify
- **Proxy / TLS:** Traefik (`entrypoints: https`)
- **Rede Docker:** `coolify` (external)
- **Código dos apps:** `/pendriver/{nome-da-pasta}`
- **Dados persistentes:** `/pendriver/{nome-da-pasta}_hist` (quando aplicável)
- **Domínios:** `*.gvtserver.online`
