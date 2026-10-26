# ASTRO CHANGE — IMPLEMENTATION HANDOFF

## Ordem recomendada

1. Scaffold React + Vite + TypeScript + Tailwind v4.
2. Inicializar shadcn/ui.
3. Adicionar `motion`, `@tanstack/react-query`, `zod`, `howler`, `jose`.
4. Copiar `assets/` para `public/assets/` preservando subpastas.
5. Implementar adapter TSE conforme `TSE_RESULTS_INTEGRATION.md`.
6. Criar fixture mode usando `fixtures/normalized-president-2026-snapshot.json`.
7. Implementar design tokens e shell.
8. Implementar Curtain Gate.
9. Implementar Candidate cards e counters.
10. Implementar progress + stats.
11. Implementar stale/error states.
12. Implementar áudio.
13. Implementar Grand Finale.
14. Integrar JWS e só então mostrar selo de assinatura verificada.
15. Rodar checklist de `ACCEPTANCE_CRITERIA.md`.

## Dependências sugeridas

```bash
npm i motion @tanstack/react-query zod howler jose
npm i -D @types/howler
npx shadcn@latest init
```

Aceternity/Magic UI só devem ser adicionados se um componente específico for aprovado durante implementação.

## Estrutura sugerida

```text
src/
  app/
  components/
    astro/
    election/
    ui/
  features/
    election-results/
      api/
      domain/
      hooks/
      schemas/
  providers/
  styles/
  lib/
  config/
public/
  assets/
    audio/
    svg/
    tse/
```

## Regra de ouro para o agente

Não improvisar fatos eleitorais. Toda decisão sobre estado, votos, percentuais, candidato eleito, totalização ou foto deve ser derivada do dado oficial recebido ou de fixture explicitamente identificada como fixture.
