# Candidate photos

As fotos de candidato devem vir do TSE e são consideradas assets dinâmicos, não assets de marca.

Fontes oficiais confirmadas para o 2º turno:

- Página do TSE com os candidatos: https://www.tse.jus.br/eleicoes/eleicoes-2026-content/propostas-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026-segundo-turno/planos-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026-2-turno
- Endpoint EA20: https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json

O runtime de criação deste pacote não conseguiu persistir os binários de imagem do TSE na pasta, então o pacote inclui `scripts/fetch-tse-candidate-assets.mjs`, que baixa automaticamente as fotos oficiais pelo `sqcand` ao ser executado em um ambiente com internet.

Execute na raiz do projeto:

```bash
node scripts/fetch-tse-candidate-assets.mjs
```

O script salva os arquivos em `public/assets/tse/candidates/` e gera um `manifest.json`.
