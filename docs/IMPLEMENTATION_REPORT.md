# Astro Change — Relatório de implementação

Atualização: aplicação publicada na Vercel. Estado atual, cache compartilhado e evidências remotas em [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md). O relato abaixo registra a entrega local inicial.

Validação local em 25/10/2026, horário de Brasília. Aplicação compilada disponível em http://127.0.0.1:4173 enquanto o processo local estiver ativo.

## Implementado

**PASS — produto local funcional.** Implementados dashboard, coletor oficial, normalização, validação criptográfica, cache, recuperação, identidade Midnight Big Top, cortinas, música opcional, controles persistentes, responsividade, acessibilidade e Grand Finale controlado por indicação oficial.

O pacote inicial continha especificações e assets, sem aplicação. Todos os documentos obrigatórios foram examinados antes da implementação. Cópias de Design System e Integração TSE na raiz do pacote eram idênticas às de `docs/` por SHA-256; viraram referências aos documentos canônicos sem perda de conteúdo.

## Arquitetura

```text
TSE EA11 + EA20 JWS
  → Collector Node
  → jose + Zod
  → modelo ElectionResult
  → cache e último resultado válido por processo
  → /api/results
  → TanStack Query
  → componentes React
```

- `server/collector.ts`: timeout, descoberta/validação EA11 da configuração 2026, fallback fixo 6258, condicionais HTTP, cache, deduplicação de requisições simultâneas e backoff.
- `src/lib/tse/`: contratos, normalizador, JWS, URLs e cliente.
- `src/components/`: composição de palco e dados. Parsing EA20 permanece fora dos componentes.
- `src/components/ui/`: Button, Dialog, Sheet e Skeleton adicionados pela CLI shadcn e adaptados aos tokens.
- `src/lib/audio.ts`: direção de áudio central com Howler.
- `api/results.ts`: handler Node serverless; `server/index.ts`: servidor Express para execução do build.

Não foi criada uma store adicional: o cache de TanStack Query fornece o modelo de aplicação sem duplicação de estado.

## Integração TSE

**PASS — fonte real validada, sem fixture no caminho live.**

- EA11: `https://resultados.tse.jus.br/oficial/comum/config/ele-c.json`.
- EA20 nacional: `https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.jws`.
- JSON oficial: mesmo endereço com extensão `.json`, somente mediante `TSE_FORMAT=json`.
- Polling: 5 segundos em primeiro plano; pausa em segundo plano; interrupção após estado oficial final. Em falhas: 5, 10, 20 e 30 segundos. HTTP 404 impõe espera de 60 segundos no coletor e nova tentativa de catálogo.
- Cache: mínimo de 5 segundos por instância, promessa compartilhada para chamadas concorrentes, ETag, Last-Modified, If-None-Match, If-Modified-Since e tratamento de 304.
- Fallback: último snapshot validado em memória. Sem snapshot, erro recuperável. Nunca substitui live por fixture.
- JWS: `jose`, EdDSA/Ed25519, algoritmo restrito, `kid` e chave fixa do pacote. Assinatura oficial verificada contra payload real nesta execução. Falha criptográfica impede promoção do novo payload e possui mensagem distinta de rede.
- Neutralidade: candidatos ordenados por `seq`; `idg` comparado por diferença; `dv` aplicado no domínio; `md=e` controla definição matemática; `tf=s` controla encerramento. Nenhum cálculo próprio declara vencedor.
- Progresso: percentual oficial `pst`; inconsistências entre seções são registradas sem reescrever os valores.
- Observabilidade: status HTTP, latência, geração, timestamp, assinatura e fallback em logs estruturados.

Evidência reproduzível: `evidence/live-validation.json`. A última execução local observou intervalos de 5,173 s, 5,369 s e 5,349 s, sem requests falhos ou erros de console.

## UI

Implementados `CircusShell`, `MarqueeHeader`, `CurtainIntro`, `CandidateSpotlightCard`, `VoteCounter`, `ElectionProgress`, `LiveIndicator`, `TSESourceBadge`, `BackstageDrawer`, controles de som/movimento, modal sobre dados e `GrandFinale`.

Estados: carregamento, conexão, atualização, espera por nova geração, recuperação, dado antigo, erro inicial, divulgação não autorizada, definição matemática e encerramento. Falhas de refetch preservam o placar existente.

Cards usam mesma estrutura, tamanho, foto, tipografia e animação; não há efeitos de liderança. Datas e horários usam `America/Sao_Paulo`. Disclaimer de independência e fonte oficial permanecem visíveis.

## Assets

Integrados os SVGs originais: marca, favicon, moldura marquee, cortinas esquerda/direita, ornamentos, divisor, estrela, feixe e grain. O PNG original fornece metadado social. O grain permanece estático e sutil.

Duas fotos oficiais baixadas pelo script TSE, com manifesto em `public/assets/tse/candidates/manifest.json`. O componente associa por `sqcand`, usa arquivos locais conhecidos e URL oficial para candidatos novos. Em falha, usa símbolo neutro.

Script de fotos reforçado com timeout, validação de identidade, eleição, MIME e limite de tamanho. Fontes Rye, Fraunces e Inter são locais; licenças OFL completas em `public/licenses/`. Referências em `SOURCES.md`.

## Áudio

- Ambiência: `audio_circo.mp3`, fornecido pelo usuário e servido em `/assets/audio/audio_circo.mp3`.
- Entrada: `astro-change-curtain-open.wav`.
- Nova geração: `astro-change-update-tick.wav`, uma vez por mudança de `idg`.
- Definição oficial: `astro-change-finale-sting.wav`, uma vez por sessão eleitoral.

Howler carrega áudio após gesto explícito. Ambiência com fade e volume baixo; modos ligado, reduzido e mudo. Reentrada após reload começa muda, respeitando bloqueios de autoplay. Preferência é persistida quando armazenamento está disponível. Sons nunca dependem do candidato.

## Motion

Motion fornece deslocamento das cortinas, entrada simétrica dos cards, interpolação curta dos votos, progresso por transform e vinheta do finale. Lâmpadas têm períodos distintos; no finale há sequência única e discreta. Primitives de painel usam transições de shadcn.

Reduced motion do sistema e controle manual removem movimentos contínuos, deslocamentos extensos e interpolação dos contadores, incluindo overlays em portal. A cortina foi observada em movimento durante QA; interface é liberada em aproximadamente 900 ms.

GSAP, Aceternity e Magic UI foram dispensados: os assets originais e Motion atenderam às sequências necessárias.

## Testes

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| `npm run lint` | PASS | Sem erros |
| `npm run typecheck` | PASS | TypeScript sem erros |
| `npm test` | PASS | 13 testes Vitest |
| `npm run test:e2e` | PASS | 3 cenários Playwright/Chrome |
| `npm run build` | PASS | Frontend e servidor compilados |
| `npm audit --json` | PASS | Zero vulnerabilidades reportadas |
| Integração live JWS | PASS | Chave oficial, payload real e badge validado |
| Fixture isolada | PASS | Dois cards, aviso explícito, zero chamadas à API live |
| Acessibilidade automatizada | PASS | axe, regras WCAG 2 A/AA e 2.1 AA, sem violações no fluxo testado |
| Console e rede live | PASS | Sem erros JS/console ou requests falhos no ensaio |

Os testes unitários cobrem parser, schema, números/percentuais, candidatos/ordem/fotos, seções, `dv`, `md`, `tf`, `idg` decrescente, assinaturas válidas/adulteradas/chave errada, 304, cache concorrente, último snapshot válido e backoff com reset.

Os cenários controlados de navegador cobrem teclado, intro, foco/retorno de foco, Dialog/Sheet, áudio/mute, persistência, reentrada, reduced motion, loading, falha inicial, snapshot stale, atualização, finale sem repetição e parada de polling final. Esses dados controlados não foram apresentados como prova de resultado eleitoral real.

### Responsividade e desempenho local

**PASS** nas resoluções 320×568, 375×812, 390×844, 768×1024, 1366×768, 1440×900 e 1920×1080. Sem overflow horizontal e com fotos carregadas. Em 320×568, ambos os percentuais ficam dentro da primeira tela.

Último ensaio do build compilado em Chrome local: LCP 1,272 s e CLS 0,0214. São medições de laboratório sem limitação artificial de rede, não métricas de campo ou garantia de 60 FPS em hardware móvel.

Evidências visuais: `evidence/intro.png`, `evidence/desktop.png`, `evidence/mobile.png`. Reprodução live: `node scripts/qa-live.mjs`; para build compilado, definir `QA_URL=http://127.0.0.1:4173`.

## Alterações adicionais

- A aplicação foi criada na raiz, preservando o pacote e a estrutura canônica de especificações.
- JWS tornou-se padrão após comprovação real. JSON é opt-in explícito e nunca recebe selo de assinatura.
- Código de painéis é carregado separadamente; Motion possui chunk próprio. Build sem alerta de chunk acima de 500 kB.
- Na menor largura, os controles viram ícones acessíveis para preservar espaço e manter os percentuais na primeira tela.
- As skills foram pesquisadas com `npx skills find`; foram reutilizadas skills locais equivalentes sem instalar catálogos duplicados.

## Pendências e limites de validação

Não há bloqueio funcional local identificado. **NOT TESTED:** Safari, Firefox, aparelho físico, saída de áudio física, infraestrutura remota e carga distribuída. Nenhum deploy, push ou alteração remota foi executado.

O cache atual é por processo e não sobrevive a reinício. Para implantação com muitas réplicas serverless, usar armazenamento/cache compartilhado e validar a taxa agregada antes de ampliar escala. Essa infraestrutura não foi presumida nem publicada nesta entrega.

A auditoria automatizada não substitui teste completo com leitor de tela ou avaliação humana em dispositivos reais. Métricas locais não comprovam desempenho de produção.
