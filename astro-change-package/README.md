# Astro Change — Planning & Asset Package

Pacote consolidado para implementação do painel temático de apuração presidencial 2026.

## Documentos

- `docs/ASTRO_CHANGE_DESIGN_SYSTEM.md`
- `docs/TSE_RESULTS_INTEGRATION.md`
- `docs/SCREEN_COMPONENT_SPEC.md`
- `docs/MOTION_AUDIO_SPEC.md`
- `docs/ACCEPTANCE_CRITERIA.md`
- `docs/ASSET_MANIFEST.md`
- `docs/IMPLEMENTATION_HANDOFF.md`
- `docs/LIBRARY_PLAN.md`
- `SOURCES.md`

## Configuração

- `config/tse-public-key-2026.jwk.json`

## Fixture

- `fixtures/normalized-president-2026-snapshot.json`

## Assets

- `assets/svg/`
- `assets/audio/`
- `assets/design-tokens.css`

## Script

- `scripts/fetch-tse-candidate-assets.mjs`

Execute o script na raiz do projeto implementado para baixar as fotos oficiais atuais:

```bash
node scripts/fetch-tse-candidate-assets.mjs
```

## Fonte oficial principal

https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados
