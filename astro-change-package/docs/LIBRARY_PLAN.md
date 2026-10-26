# ASTRO CHANGE — LIBRARY PLAN

## Core

| Biblioteca | Papel | Decisão |
|---|---|---|
| React + Vite + TypeScript | SPA | obrigatório |
| Tailwind CSS v4 | styling/tokens | obrigatório |
| shadcn/ui | primitives acessíveis | obrigatório como base, não como estética |
| Motion (`motion/react`) | animações | engine principal |
| TanStack Query | polling/cache no cliente | obrigatório |
| Zod | validação/normalização | obrigatório |
| Howler.js | áudio | obrigatório se áudio estiver habilitado |
| jose | JWS/Ed25519 | recomendado para validação oficial |

## Opcionais selecionados

### Aceternity UI

Boa fonte de componentes copy-paste React/Tailwind/Motion. O site atual informa compatibilidade com shadcn, React 19, Vite e Tailwind v4.

Usar apenas componentes específicos:

- Spotlight;
- Moving Border;
- Sparkles em baixa densidade;
- utilitários de backgrounds/noise.

Registry opcional:

```json
{
  "registries": {
    "@aceternity": "https://ui.aceternity.com/registry/{name}.json"
  }
}
```

### Magic UI

Avaliar:

- Number Ticker;
- Noise Texture;
- Light Rays;
- Shine Border;
- Text Animate.

Não misturar vários componentes animados na mesma região da tela.

## Não instalar por padrão

### GSAP

Adicionar apenas se a timeline Curtain/Grand Finale ficar significativamente melhor e mais simples do que com Motion. Não manter duas engines por estética.

### Rive

Fora do MVP. Pode entrar posteriormente para um Mestre de Cerimônias/mascote original, caso exista direção visual aprovada.

## Comandos de base

```bash
npm i motion @tanstack/react-query zod howler jose
npm i -D @types/howler
npx shadcn@latest init
```

Aceternity/Magic UI devem ser adicionados componente a componente, preferencialmente trazendo o código para o repositório para permitir auditoria e customização.
