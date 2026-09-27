# Apresentação estática

Esta pasta contém a versão de apresentação do Dashboard Arariboia. Ela é gerada como uma página HTML autônoma, com gráficos e mapas SVG prontos, sem rotas de API, filtros, dados brutos ou serviços externos de mapa.

## Atualização

No diretório raiz do projeto, execute:

```bash
npm run build:apresentacao
```

O resultado é gravado em `apresentacao-estatica/site/index.html`. Revise e versione esse arquivo junto com a alteração. A publicação no GitHub Pages usa somente o conteúdo de `site/`.

O dashboard interativo permanece independente em `src/` e não é usado nem alterado por esse processo.
