# Fontes e licenças — Astro Change

## Dados eleitorais

- [Documentação técnica oficial](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados).
- [EA11](https://resultados.tse.jus.br/oficial/comum/config/ele-c.json).
- [EA20 JSON](https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json).
- [EA20 JWS](https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.jws).
- Fotos: infraestrutura TSE; origem e associação por `sqcand` em `public/assets/tse/candidates/manifest.json`.
- Chave fixa: `astro-change-package/config/tse-public-key-2026.jwk.json`.
- Snapshot bruto de teste: EA20 obtido nesta implementação, `tests/ea20-official.json`. Nunca usado como fallback live.
- Fixture normalizada fornecida: isolada atrás de `VITE_DATA_MODE=fixture`, com aviso explícito.
- Recortes estaduais e exterior: arquivos EA20/JWS `/oficial/ele2026/6258/dados/<uf>/<uf>-c0001-e006258-u.jws`, conforme o manual EA20. Exemplos de teste oficiais em `tests/ea20-sp-official.json`, `tests/ea20-ba-official.json` e `tests/ea20-zz-official.json`. Macrorregiões são somas explicitamente identificadas pela aplicação; não representam novo payload assinado do TSE. Exterior é exibido separadamente das cinco macrorregiões.

Resultados são arquivos públicos oficiais, não conteúdo sob licença MIT do aplicativo. Referências originais adicionais: `astro-change-package/SOURCES.md`.

## Assets e fontes

- Trilha ambiente atual: `audio_circo.mp3`, fornecida pelo usuário. Origem e licença não especificadas; não é classificada como áudio original do pacote.

- SVGs e sons: originais do pacote, conforme `astro-change-package/docs/ASSET_MANIFEST.md`.
- Rye, Inter, Fraunces: SIL Open Font License 1.1, hospedadas localmente por Fontsource. Licenças completas em `public/licenses/`.
- Lucide: ISC; apenas controles funcionais. Símbolos de marca continuam originais.

## Dependências

| Projeto | Licença | Uso |
| --- | --- | --- |
| React / React DOM | MIT | Interface |
| Vite / TypeScript | MIT / Apache-2.0 | Build e tipos |
| Tailwind CSS / tw-animate-css | MIT | Tokens e transições |
| shadcn/ui / Radix | MIT | Button, Dialog, Sheet, Skeleton |
| Motion | MIT | Cortinas, cards, contadores, finale |
| TanStack Query | MIT | Cache e polling |
| Zod | MIT | Validação |
| Howler.js | MIT | Música e efeitos |
| jose | MIT | JWS EdDSA/Ed25519 |
| Express | MIT | Servidor Node |
| @vercel/functions | Apache-2.0 | Cache regional compartilhado na hospedagem Vercel |
| clsx / tailwind-merge / class-variance-authority | MIT / MIT / Apache-2.0 | Composição de primitives |
| Vitest / ESLint / Playwright / esbuild | MIT / MIT / Apache-2.0 / MIT | Verificação e build |
| axe-core / axe-core Playwright | MPL-2.0 | Auditoria em desenvolvimento |

Versões e integridade: `package-lock.json`. As licenças das dependências permanecem em seus pacotes. Auditoria npm sem vulnerabilidades conhecidas na validação local; não constitui garantia futura.

O Zod transitivo de `@vercel/cli-config` possui override para `^4.6.7`, corrigindo o aviso GHSA-mrhx-c7xc-m3w5 introduzido pela dependência Vercel. Referências: [Runtime Cache](https://vercel.com/docs/caching/runtime-cache), [cache da CDN](https://vercel.com/docs/caching/cache-control-headers).

## Skills e referências

Executados `npx --yes skills find "react vite frontend"` e `npx --yes skills find "motion animation"`. Resultados relevantes: `vercel-labs/agent-skills@vercel-react-best-practices` e `emilkowalski/skills@review-animations`. Não foram instaladas skills duplicadas.

Aplicadas skills locais: `react-nextjs-development`, `shadcn`, `e2e-testing`, `ecc:motion-patterns`, subordinadas às especificações existentes. Documentação atual de TanStack Query e Vite consultada por Context7. GSAP, Aceternity e Magic UI não foram necessários.
