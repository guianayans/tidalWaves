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
