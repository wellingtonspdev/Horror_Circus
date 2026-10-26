# Astro Change — Visualização regional

## Escopo aprovado pela solicitação

Execução concluída e publicada. Resultados e limites em [REGIONAL_RESULTS_REPORT.md](REGIONAL_RESULTS_REPORT.md).

Implementar e publicar uma área regional independente do placar nacional, preservando identidade, áudio, acessibilidade e contratos existentes. Cobrir as cinco macrorregiões, as 27 UFs e o exterior em recorte separado.

## Contrato da fonte

O manual EA20 oficial descreve arquivos nacionais, por UF, município e zona, sem arquivo próprio de macrorregião. URLs estaduais seguem `/oficial/ele2026/6258/dados/<uf>/<uf>-c0001-e006258-u.jws`. SP, BA e ZZ foram consultados e tiveram assinaturas Ed25519 verificadas antes da implementação.

- Brasil: continua usando exclusivamente EA20 BR, incluindo exterior.
- UF: valores e percentuais preservados do EA20 correspondente, com verificação de `tpabr=uf` e `cdabr` igual à UF solicitada.
- Região: soma dos arquivos de todas as suas UFs. Percentuais consolidados são derivados dos totais, nunca média dos percentuais estaduais. Identificar explicitamente esses cálculos e a janela das gerações consultadas.
- Exterior: EA20 ZZ separado, sem associação artificial a macrorregião.
- Sem todas as fontes válidas e divulgação permitida, não apresentar subtotal incompleto como total regional.
- `md` estadual não declara eleição presidencial definida. Grand Finale permanece exclusivo do BR.

## Implementação

1. Registrar a aplicação atualmente publicada no Git, preservando dados públicos, licenças e assets. Ignorar credenciais, `.env.local`, `.vercel/`, build e dependências.
2. Generalizar URLs, validação e coletor para BR/UF, com cache, ETag e backoff separados por abrangência.
3. Adicionar `/api/regions?region=<código>`, lista fechada de recortes e concorrência limitada a três fontes. Consultar somente a região selecionada; polling regional a cada 15 segundos e pausa em segundo plano.
4. Construir seção temática com seleção de região, resumo consolidado, tabela de UFs e detalhe da UF usando os mesmos cards neutros do placar.
5. Separar cache e estados por região. Em falha de refetch, preservar o último recorte válido; ao trocar região, nunca mostrar dados da anterior sob novo título.
6. Testar parsing UF, origem incompatível, isolamento de cache, soma/denominadores, fontes faltantes, divulgação, ausência de definição regional, teclado e mobile.
7. Executar lint, tipos, testes, build, navegador local e produção. Atualizar documentação, publicar GitHub e verificar deploy Vercel no domínio configurado.

## Critérios de aceitação

- Navegação Brasil/regiões não altera o significado do placar presidencial nacional.
- Toda UF do agrupamento tem origem verificável e geração visível.
- Ordem e fotografia dos candidatos permanecem equivalentes e estáveis.
- Totais regionais nunca substituem dados oficiais por estimativas ou zeros de fontes ausentes.
- Região, UF e origem da assinatura são inequívocas, inclusive em erro/loading/reentrada.
- Nenhuma consulta arbitrária de URL; somente códigos permitidos.
- Sem overflow em 320px; seletor e tabela operáveis por teclado.
- Fonte: [EA20 oficial](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/tse-ea20-arquivo-de-resultado-unificado).
