# ASTRO CHANGE — SCREEN & COMPONENT SPEC

## 1. Mapa de telas

O MVP deve ser uma SPA com estados de cena, não um conjunto de páginas tradicionais.

```text
/
├─ Intro / Curtain Gate
├─ Live Stage
│  ├─ Main Result
│  ├─ Progress
│  └─ Backstage Stats
├─ Source / Method modal
└─ Error / stale overlays
```

---

## 2. Tela 01 — Curtain Gate

### Objetivo

Criar identidade, explicar fonte e obter gesto do usuário para habilitar áudio.

### Conteúdo

- marca Astro Change;
- assinatura `O espetáculo da apuração`;
- `2º turno · Presidente · Brasil`;
- selo `Dados oficiais do TSE`;
- botão primário `Entrar no Picadeiro`;
- ação secundária `Entrar sem som`;
- microcopy: `Atualizações automáticas durante a totalização`.

### Comportamento

Ao entrar:

1. tocar `astro-change-curtain-open.wav` se áudio permitido;
2. abrir cortinas em 700–1000 ms;
3. revelar palco;
4. iniciar/continuar polling;
5. focar semanticamente o heading da tela principal.

### Mobile

O CTA deve ficar acima da dobra. Cortinas podem ser mais abstratas para não ocupar largura demais.

---

## 3. Tela 02 — Live Stage

### Ordem estrutural

1. utility bar;
2. marquee/header;
3. estado ao vivo;
4. cards dos candidatos;
5. progresso da totalização;
6. resumo de votos;
7. acesso aos bastidores;
8. fonte/disclaimer.

### Utility bar

Esquerda:

- `2º TURNO · BRASIL`.

Direita:

- som;
- reduced motion opcional;
- `Sobre os dados`.

### Marquee

Título central:

```text
ASTRO CHANGE
O espetáculo da apuração
```

Não deve consumir mais que ~20% da altura inicial em desktop.

---

## 4. CandidateSpotlightCard

### Anatomia

```text
┌─────────────────────────┐
│       FOTO OFICIAL      │
│                         │
│ NOME DE URNA        22  │
│ PARTIDO                 │
│                         │
│        50,49%           │
│      12.985.594         │
│                         │
│ situação oficial        │
└─────────────────────────┘
```

### Regras

- mesmo aspect ratio de foto;
- mesmo tamanho mínimo/máximo;
- mesmo peso de nome;
- mesma transição de votos;
- ordem pelo campo `seq`;
- não mover cards ao mudar liderança;
- opcional: microindicador `+251.594 desde a última atualização`, desde que igual para todos e não transforme diferença em gamificação.

### Imagem

`object-fit: cover` com crop focado no centro. Não aplicar filtros diferentes.

---

## 5. VoteCounter

Props conceituais:

```ts
interface VoteCounterProps {
  value: number
  previousValue?: number
  locale?: 'pt-BR'
  reducedMotion?: boolean
}
```

### Formatação

```text
12.985.594
```

Não mostrar casas decimais em votos.

### Motion

Interpolar apenas quando o valor cresce. Se por correção oficial o valor reduzir, animar de forma discreta e registrar telemetria; nunca impedir a atualização.

---

## 6. PercentDisplay

Exibir `pvap` (duas casas conforme fonte) ou normalizado com `Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` desde que o valor corresponda ao oficial.

Tamanho desktop recomendado: `clamp(3rem, 7vw, 7rem)`.

---

## 7. ElectionProgress

Conteúdo:

```text
20,77% das seções totalizadas
103.678 / 499.248 seções
```

Barra não partidária.

Abaixo pode haver:

`Última geração TSE: 19:58:07`

---

## 8. ResultSummary

Cards compactos:

- votos válidos;
- brancos;
- nulos;
- comparecimento.

No desktop, 4 colunas. Mobile, 2x2.

Não animar todos os cards ao mesmo tempo com efeitos grandes; números podem fazer crossfade/ticker leve.

---

## 9. BackstageDrawer

### Trigger

`Ver bastidores da apuração`

### Conteúdo

- eleitorado total;
- comparecimento/abstenção;
- votos válidos/brancos/nulos;
- seções totalizadas/não totalizadas;
- seções instaladas/não instaladas;
- código da eleição;
- ID da geração;
- data/hora TSE;
- assinatura JWS: verificada/não habilitada/erro.

Esse drawer é também a área de transparência técnica do produto.

---

## 10. SourceMethodModal

Título:

`De onde vêm os dados?`

Explicar de forma curta:

- dados vêm da distribuição oficial do TSE;
- Astro Change consulta periodicamente o EA20;
- o site não calcula vencedor por conta própria;
- quando habilitado, JWS é validado com a chave pública oficial;
- projeto sem vínculo institucional.

Incluir links oficiais.

---

## 11. LiveIndicator

Estados e copy:

| Estado | Copy |
|---|---|
| conexão saudável e parcial | `APURAÇÃO AO VIVO` |
| sem mudança recente | `AGUARDANDO NOVA TOTALIZAÇÃO` |
| dado stale | `ÚLTIMO DADO OFICIAL RECEBIDO` |
| final | `RESULTADO FINAL` |
| falha sem snapshot | `FONTE TEMPORARIAMENTE INDISPONÍVEL` |

“AO VIVO” significa polling ativo da fonte oficial, não streaming contínuo.

---

## 12. GrandFinale scene

### Gatilho

Mudança de domínio:

```text
mathematicallyDefined: none -> elected
```

ou estado final equivalente validado.

### Sequência

1. 250 ms de redução sutil da trilha;
2. vinheta aumenta levemente;
3. marquee bulbs acendem em sequência;
4. cards continuam estáveis;
5. heading central aparece: `O RESULTADO ESTÁ MATEMATICAMENTE DEFINIDO`;
6. situação oficial do candidato é exibida;
7. tocar `astro-change-finale-sting.wav` uma vez se som habilitado.

Não usar confete nem mover candidato “vencedor” para o centro.

---

## 13. Empty / loading

Antes do primeiro payload:

- skeleton simétrico;
- marquee presente;
- copy `Preparando o picadeiro...`;
- timeout visual após 8–12s com mensagem informativa.

Depois de ter dado válido, nunca retornar ao skeleton por refetch.

---

## 14. Erro

### Com last-known-good

Manter dados e mostrar faixa:

`Atualização temporariamente indisponível · exibindo último dado oficial de HH:MM:SS`.

### Sem dado válido

Tela funcional, não teatralizar erro:

`Não foi possível obter os resultados oficiais neste momento.`

Ações:

- tentar novamente;
- abrir resultados oficiais do TSE.

---

## 15. Component tree sugerida

```text
App
└─ ElectionExperience
   ├─ AudioProvider
   ├─ MotionPreferenceProvider
   ├─ CurtainGate
   └─ LiveStage
      ├─ UtilityBar
      ├─ MarqueeHeader
      ├─ LiveIndicator
      ├─ CandidateGrid
      │  ├─ CandidateSpotlightCard
      │  │  ├─ OfficialCandidatePhoto
      │  │  ├─ PercentDisplay
      │  │  └─ VoteCounter
      │  └─ CandidateSpotlightCard
      ├─ ElectionProgress
      ├─ ResultSummary
      ├─ BackstageDrawer
      ├─ SourceMethodModal
      ├─ SoundControl
      └─ GrandFinale
```

---

## 16. Componentes shadcn recomendados

- `Button`;
- `Dialog`;
- `Drawer` / `Sheet`;
- `Tooltip`;
- `Switch`;
- `Separator`;
- `Skeleton`;
- `VisuallyHidden` / primitives acessíveis equivalentes.

Customizar tokens; não manter aparência padrão do shadcn.

---

## 17. Componentes Aceternity/Magic UI aprovados para avaliação

### Aceternity

- Spotlight;
- Moving Border — apenas em CTA/estado especial;
- Sparkles — baixa densidade em marca, nunca perto dos votos;
- Noise/background utilities.

### Magic UI

- Number Ticker — usar somente se passar teste de precisão/performance;
- Noise Texture;
- Light Rays;
- Shine Border;
- Text Animate.

Se um componente externo exigir hacks para neutralidade/acessibilidade, reimplementar localmente.

---

## 18. SEO / metadados

Título:

`Astro Change — Apuração Presidencial 2026`

Descrição:

`Acompanhe a totalização presidencial de 2026 em uma experiência visual temática, usando dados oficiais do Tribunal Superior Eleitoral.`

Open Graph deve usar arte própria do Astro Change, não foto de candidato.

---

## 19. Footer obrigatório

> Astro Change é um projeto independente e não possui vínculo institucional com a Justiça Eleitoral. Dados eleitorais fornecidos pelo Tribunal Superior Eleitoral (TSE).

Adicionar link `Fonte oficial`.
