# Portas em uso no servidor

Ao criar um app novo, escolha a **próxima porta livre** e registre aqui.

| Porta | App | Slug (container) | Domínio |
|-------|-----|------------------|---------|
| 4015 | ComfyUI Flux | `flux` | `flux.gvtserver.online` |
| 4020 | Downloader / Analyser | `downloader` | `downloader.gvtserver.online` |
| 4021 | GVT Remote (MeshCentral) | `remote` | `remote.gvtserver.online` |
| 4022 | *(reservada)* | — | — |
| 4023 | *(reservada)* | — | — |
| 4025 | tidalWaves (Strudel live-coding) | `tidalwaves` | `tidalwaves.gvtserver.online` |
| **4026** | *(próxima sugerida)* | — | — |

## Regra

- Apps web Node/Python: faixa **4020–4099**
- Apps GPU/pesados: podem usar **401x** (como Flux)
- **Nunca** reutilizar porta de app em produção sem remover o antigo

## Ao criar app novo

1. Perguntar porta ao usuário ou sugerir a primeira livre desta tabela
2. Atualizar esta tabela no commit do novo app
