# Astro Change

Apuração presidencial brasileira de 2026 em uma experiência Midnight Big Top. React, Vite, TypeScript e Tailwind CSS v4. Fonte exclusiva dos resultados: distribuição oficial do TSE.

## Executar

Requer Node.js 24 e npm. Na raiz:

```powershell
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. O servidor Vite inclui `/api/results`; abrir somente `index.html` não fornece a integração.

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm start
```

O build gera `dist/` e `dist-server/`. `npm start` serve frontend e coletor em http://127.0.0.1:4173. O teste E2E usa Chrome instalado. `api/results.ts` fornece um handler Node serverless; não foi publicado remotamente.

## Configuração

O padrão é **live + JWS**, com verificação Ed25519 pela chave fixa fornecida. Não há fallback automático para fixture ou JSON. Nenhuma credencial é necessária.

```powershell
# Desenvolvimento identificado como fixture:
$env:VITE_DATA_MODE='fixture'
npm run dev
# Voltar ao modo oficial:
Remove-Item Env:VITE_DATA_MODE

# JSON oficial sem selo de assinatura, quando necessário:
$env:TSE_FORMAT='json'
npm run dev
```

`VITE_DATA_MODE` é resolvido no build. `.env.example` lista as opções; Vite lê `VITE_*` de `.env`. `TSE_FORMAT` e `PORT` são variáveis do processo Node. Para usar `.env` no servidor compilado: `node --env-file=.env dist-server/index.js`.

## Arquitetura

- `src/lib/tse`: schemas Zod, normalizador EA20, URLs, JWS e cliente.
- `server`: descoberta EA11, consulta condicional, cache, timeout, backoff, deduplicação e último snapshot válido.
- `src/components`: palco, intro, contadores, candidatos, progresso, transparência e finale; primitives shadcn em `ui/`.
- `src/lib/audio.ts`: Howler central; nenhum áudio antes de gesto explícito.
- `public/assets`: SVGs, áudio original e fotos oficiais com manifesto por `sqcand`.
- `tests`: contrato EA20, criptografia, resiliência e navegador controlado.
- `scripts/qa-live.mjs`: validação real do coletor, fotos, polling e sete resoluções; salva evidências locais.

`npm run assets:tse` atualiza fotos e manifesto exclusivamente pelo EA20 oficial. Falha de imagem recebe símbolo neutro.

## Visualização regional

Em **A apuração pelo Brasil**, clique em **Explorar por região**. Escolha Norte, Nordeste, Centro-Oeste, Sudeste, Sul ou Exterior; selecione uma UF para abrir seus cards e estatísticas. O placar nacional permanece independente.

`/api/regions?region=sudeste` consulta somente as UFs selecionadas, com três requisições simultâneas no máximo. Cada arquivo estadual possui validação JWS, schema, cache, ETag, backoff e fallback próprios. O cliente atualiza o recorte a cada 15 segundos, pausa em segundo plano e para quando todas as fontes indicam totalização final.

Macrorregiões são **consolidações da aplicação**, com somas de votos e seções e percentuais calculados sobre os totais. Não são arquivos regionais assinados pelo TSE. O selo indica a verificação das fontes estaduais. UF e Exterior preservam os percentuais oficiais. Fontes ausentes ou sem autorização de divulgação impedem apresentar subtotal incompleto como total regional. Nenhum recorte declara vencedor nacional ou dispara o Grand Finale.

Plano e contratos: [`docs/REGIONAL_RESULTS_PLAN.md`](docs/REGIONAL_RESULTS_PLAN.md). Entrega e evidências: [`docs/REGIONAL_RESULTS_REPORT.md`](docs/REGIONAL_RESULTS_REPORT.md).

## Documentação canônica

Especificações: [`astro-change-package/docs/IMPLEMENTATION_HANDOFF.md`](astro-change-package/docs/IMPLEMENTATION_HANDOFF.md). As duas cópias integrais na raiz do pacote viraram links para os documentos canônicos; o conteúdo permanece em `docs/`.

Entrega e limites: [`docs/IMPLEMENTATION_REPORT.md`](docs/IMPLEMENTATION_REPORT.md). Fontes e licenças: [`SOURCES.md`](SOURCES.md).

## Limites operacionais

Localmente, cache e último snapshot válido pertencem a cada processo Node. Na Vercel, o coletor compartilha estado, ETag, backoff e último snapshot pelo Runtime Cache regional, com TTL de 24 horas. A CDN compartilha respostas válidas por 5 segundos, com até 5 segundos adicionais durante revalidação. O cache é efêmero: se uma entrada for removida, será necessária nova leitura oficial. Não é arquivo permanente da apuração nem limite global atômico de concorrência.

## Publicação Vercel

Configuração em `vercel.json`: Vite, saída `dist`, Node 24, função `/api/results`, região `gru1`, timeout de 30 segundos, `VITE_DATA_MODE=live` e `TSE_FORMAT=jws`. Não exige banco externo ou segredo TSE. `.vercelignore` exclui dependências, build local, evidências e arquivos de ambiente do upload.

```powershell
npx vercel link --project astro-change
npx vercel deploy --prod
```

Estado e evidências da publicação: [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md).

Áudio permanece mudo após recarregar até novo gesto. Preferências e finale usam armazenamento local/de sessão quando disponível. A interface funciona mesmo quando o navegador bloqueia persistência.

Projeto independente, sem vínculo institucional com a Justiça Eleitoral. Dados eleitorais fornecidos pelo Tribunal Superior Eleitoral.
