# Astro Change — Entrega regional

## Implementado

Área independente **A apuração pelo Brasil**, com seleção das cinco macrorregiões e exterior, resumo consolidado, tabela de todas as UFs e detalhe estadual com cards simétricos. Em mobile, as linhas da tabela viram blocos com rótulos completos e sem rolagem horizontal.

O placar nacional e o Grand Finale continuam exclusivos do EA20 BR. Recortes UF/ZZ validam a abrangência esperada, não declaram eleição presidencial definida e preservam os valores oficiais de votos e percentuais.

## Contratos e arquitetura

- `src/lib/tse/geography.ts`: lista fechada das cinco regiões, 27 UFs e exterior.
- `src/lib/tse/regions.ts`: schema da resposta e consolidação das macrorregiões.
- `server/regions-handler.ts` e `api/regions.ts`: endpoint `/api/regions?region=<código>`, concorrência máxima de três fontes e cache de resposta curta.
- `server/collector.ts`: coletor reutilizado com cache separado por UF/formato, preservando consulta condicional e último resultado válido.
- `src/lib/use-region.ts`: query independente por recorte, cancelamento ao trocar/fechar, polling de 15 segundos, backoff até 60 segundos e pausa em background.
- `src/components/regional-results.tsx`: navegação, consolidação, fontes e detalhe da UF. Carregamento separado do bundle principal.

Não houve nova dependência. A região inicialmente fechada não consulta arquivos estaduais. Exterior usa o EA20 ZZ diretamente. Macrorregiões exigem todas as UFs antes de apresentar total consolidado; nenhum estado faltante vira zero. Se houver fontes stale, o resumo preserva esses dados e sinaliza sua condição.

Percentual regional dos candidatos: soma dos votos do candidato dividida pela soma dos votos de todos os candidatos recebidos. Progresso: soma das seções totalizadas dividida pela soma de seções. Comparecimento e abstenção usam as somas respectivas. Não são médias de percentuais estaduais. As gerações mais antiga e mais recente do recorte são informadas.

Assinatura regional significa **fontes estaduais verificadas**, sem alegar que a soma criada pela aplicação possui assinatura própria. Identificações divergentes de candidatos bloqueiam a consolidação e mantêm os dados individuais disponíveis.

## Validação local

| Verificação | Resultado |
| --- | --- |
| Lint | PASS |
| TypeScript | PASS |
| Vitest | PASS — 27 testes |
| Playwright | PASS — 5 cenários |
| Build | PASS |
| Auditoria de produção | PASS — zero vulnerabilidades reportadas |
| JWS real de todas as fontes | PASS — 27 UFs e exterior |
| Resoluções | PASS — sete tamanhos de 320×568 a 1920×1080 |
| Polling regional real | PASS — intervalo observado de aproximadamente 15 segundos |
| Erros JS/console/requests no ensaio | PASS — zero |

Testes incluem abrangência incompatível, URLs inválidas, isolamento de cache, concorrência, soma ponderada, zero votos, cobertura faltante/duplicada, identificação divergente, `dv`, preservação do percentual ZZ, ausência de definição regional, navegação por teclado, acessibilidade automatizada, troca de recortes sem dados cruzados, fonte parcial e recuperação após falha.

Evidência local real: `evidence/regions-local/validation.json`, `desktop.png` e `mobile.png`. O teste controlado de navegador fica separado da prova real de JWS.

## GitHub e produção

A aplicação anteriormente publicada, antes sem versionamento de código no GitHub, foi registrada no commit `dda5478`. A mudança regional e os contratos estão prontos para publicação. A validação remota será registrada após o deploy.

## Limites

Sem visão por município/zona, comparação histórica, projeção de vencedor, teste em aparelho físico ou carga distribuída. As gerações estaduais são independentes e não formam snapshot atômico. Cache regional continua efêmero e sem lock global distribuído.
