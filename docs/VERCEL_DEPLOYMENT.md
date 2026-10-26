# Astro Change — Deploy Vercel

Atualização regional: código sincronizado com GitHub em `main`, deploy automático validado em `dpl_6JUNdwYvtmKKoPpMgR4Pqa5HjEdN`, commit `5b79ba3`. Consulte [REGIONAL_RESULTS_REPORT.md](REGIONAL_RESULTS_REPORT.md) para validação das 27 UFs e exterior. O restante deste documento registra a publicação inicial.

## Publicação

**PASS — aplicação completa publicada e validada em produção.**

- URL pública principal: https://astrochange.wellingtonsp.uk
- URL alternativa Vercel: https://astro-change-three.vercel.app
- Projeto: `astro-change`, conta `wellington-siqueira-portos-projects`.
- Deployment validado: `dpl_7vAedJNWR4AzXbQvJDBdbigvu979`.
- Painel: https://vercel.com/wellington-siqueira-portos-projects/astro-change/7vAedJNWR4AzXbQvJDBdbigvu979
- Execução em 25/10/2026, horário de Brasília. Os JSONs de evidência registram timestamps UTC.
- Publicação pela CLI a partir do workspace local. O repositório GitHub foi conectado pela CLI; nenhum commit ou push foi executado.

## Configuração entregue

`vercel.json` define Vite, build `npm run build`, saída `dist`, região `gru1` e função Node `/api/results` com limite de 30 segundos. Node 24 está fixado em `package.json`. A chave pública JWS é incluída no pacote da função.

`VITE_DATA_MODE=live` é fixado no build; `TSE_FORMAT=jws` no runtime. Não há segredo TSE ou fallback automático para fixture/JSON. `.env.local` e `.vercel/` gerados pela CLI estão ignorados; não foram expostos nas evidências ou incluídos no upload.

A compilação serverless exige `rewriteRelativeImportExtensions` no TypeScript para converter imports `.ts` em `.js`. A opção foi ativada após validação do runtime remoto. A trilha MP3 está em `public/assets/audio/audio_circo.mp3` e não é excluída pelo filtro de upload.

## Cache e resiliência

- CDN: respostas frescas compartilhadas por 5 segundos, com mais 5 segundos de stale-while-revalidate.
- Runtime Cache: namespace por projeto, estado separado por formato e eleição, TTL de 24 horas.
- Estado compartilhado: último envelope validado, ETag, Last-Modified, cooldown, falhas e configuração já descoberta.
- Cada leitura do cache valida o schema e a origem. No modo JWS, cache sem indicação de verificação é rejeitado.
- Respostas stale, erros e métodos não permitidos não recebem cache de sucesso da CDN.
- Último resultado válido permanece disponível nas falhas; falha do cache compartilhado degrada para cache de processo.

**Prova remota:** headers `x-vercel-cache: HIT`, logs `tse-runtime-cache-restore` no deployment atual e consultas condicionais ao TSE retornando HTTP 304. Logs públicos de observabilidade foram resumidos em `evidence/vercel/http-validation.json`; não foram persistidos logs brutos.

O cache regional é efêmero e pode ser removido antes do TTL. Não fornece arquivo permanente nem lock global atômico. Não foi contratado banco externo. Uso e quotas seguem o plano Vercel da conta; não houve troca de plano.

## Verificações

| Verificação | Resultado |
| --- | --- |
| Lint e TypeScript | PASS |
| Testes Vitest | PASS — 16 testes |
| Testes Playwright locais | PASS — 3 cenários |
| Build local e Vercel | PASS |
| Auditoria de dependências de produção | PASS — zero vulnerabilidades reportadas |
| Página pública, API e manifesto | PASS — HTTP 200 sem autenticação |
| JWS TSE real | PASS — `verified=true`, `stale=false` |
| MP3 hospedado e controle de mute | PASS — HTTP 200, interação real no navegador |
| Fotos oficiais | PASS — carregadas nas sete resoluções |
| Console e requests no ensaio remoto | PASS — zero erros |
| CDN e restauração do Runtime Cache | PASS — headers e logs reais |

Foi adicionado override restrito do Zod transitivo de `@vercel/cli-config` para `^4.6.7`, eliminando o aviso GHSA-mrhx-c7xc-m3w5 introduzido pelo SDK Vercel.

## QA visual em produção

Validadas 320×568, 375×812, 390×844, 768×1024, 1366×768, 1440×900 e 1920×1080. Sem overflow horizontal, com fotos carregadas e ambos os percentuais na primeira tela de 320px.

O estado oficial `md=e` surgiu durante o QA. O aviso Grand Finale foi movido para depois do resumo, preservando a posição dos cards. O indicador superior informa a definição matemática sem inferir vencedor. Um teste controlado verifica a posição do grid antes/depois e a exibição única do efeito.

No ensaio remoto: polling com intervalos de 5,708 s, 5,034 s e 5,020 s; LCP 2,484 s e CLS 0,0238. São medições locais contra a produção, sem emulação de rede móvel ou garantia de desempenho em todos os dispositivos.

Evidências:

- `evidence/vercel/live-validation.json`
- `evidence/vercel/http-validation.json`
- `evidence/vercel/audio-validation.json`
- `evidence/vercel/intro.png`
- `evidence/vercel/desktop.png`
- `evidence/vercel/mobile.png`

## Reproduzir

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npx vercel deploy --prod

$env:QA_URL='https://astro-change-three.vercel.app'
$env:QA_EVIDENCE_DIR='evidence/vercel'
node scripts/qa-live.mjs
Remove-Item Env:QA_URL
Remove-Item Env:QA_EVIDENCE_DIR
```

## Limites

Sem teste de carga, aparelho físico ou validação completa de Safari/Firefox. Saída física do som não foi avaliada. Não foram publicados commits no GitHub.

## Domínio personalizado validado

O usuário criou o CNAME `astrochange` na Cloudflare, apontando para `f456318f02e7d6b9.vercel-dns-017.com`, com proxy desativado. O subdomínio foi vinculado ao projeto Astro Change e a Vercel confirmou `configured-correctly`, sem conflitos.

Após a emissão e propagação inicial do certificado, Chrome confirmou HTTPS com TLS 1.3 para `astrochange.wellingtonsp.uk`. Página, API e MP3 responderam HTTP 200; API com `verified=true` e `stale=false`. Evidência: `evidence/vercel/domain-validation.json`. Demais registros DNS não foram alterados pelo agente.
