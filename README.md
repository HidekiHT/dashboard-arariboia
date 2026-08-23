# Dashboard e-Dinheiro — v1

Dashboard local em Next.js para acompanhar usuários, transações, benefícios, comércios e indicadores da rede e-Dinheiro em Niterói.

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- Os dados operacionais fornecidos separadamente

## Como executar

```bash
git clone <URL_DO_REPOSITORIO>
cd dashboard-e-dinheiro
npm ci
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Para validar a aplicação antes de executar, use:

```bash
npm run lint
npm run build
```

## Dados necessários

Os dados não são versionados neste repositório. Após receber a pasta `dados_edinheiro`, copie seu conteúdo para `dados_edinheiro/` na raiz do projeto, preservando estes nomes:

```text
dados_edinheiro/
├── usuarios_niteroi.json
├── comercios_empresa_131.json
├── beneficios_empresa_131.json
├── indicadores-mensais_empresa_131.json
├── dicionariov2.csv
└── transacoes_bruto_niteroi.csv
```

Sem esses arquivos, as rotas de dados do dashboard não conseguirão carregar as informações.

## Estrutura versionada

- `src/` — interface e rotas da API do dashboard.
- `public/` — recursos estáticos.
- `etl/` — scripts auxiliares de preparação de dados.
- Arquivos de configuração e dependências (`package.json` e `package-lock.json`).

`node_modules/`, `.next/`, arquivos de ambiente e o conteúdo de `dados_edinheiro/` são ignorados pelo Git.
