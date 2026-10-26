# ASTRO CHANGE — MOTION & AUDIO SPEC

## 1. Princípio

Motion e áudio devem construir atmosfera sem competir com a apuração. O espetáculo acontece ao redor dos dados, não em cima deles.

---

## 2. Engine

### Motion principal

`motion/react`

Usar para:

- entrada/saída;
- layout;
- contadores;
- glow/opacity;
- cortinas;
- drawers;
- marquee bulbs;
- mudança de estado.

### GSAP

Não instalar por padrão. Só adicionar se a timeline de intro/finale demonstrar limitação real com Motion.

---

## 3. Motion tokens

```text
fast: 140ms
ui: 220ms
panel: 420ms
scene: 900ms
```

Easing principal:

```css
cubic-bezier(.22,.61,.36,1)
```

Cortina:

```css
cubic-bezier(.76,0,.24,1)
```

---

## 4. Curtain intro

Timeline aproximada:

```text
0ms       click
0-120ms   botão press feedback
80ms      curtain-open SFX
120-920ms cortinas saem para laterais
260-760ms fundo/spotlights surgem
420-900ms marquee entra
650-1050ms candidate cards aparecem
900ms+    interface estável
```

Em reduced motion:

- crossfade <= 150ms ou instantâneo;
- sem deslocamento grande.

---

## 5. Candidate cards

Entrada inicial:

- mesma animação;
- stagger máximo 60 ms apenas por estética, nunca para destacar um lado;
- opacity 0 -> 1;
- y 12px -> 0;
- scale 0.99 -> 1.

Atualizações de dados não devem reanimar o card inteiro.

---

## 6. VoteCounter

Quando `idg` mudar:

- interpolar de anterior para novo;
- duração baseada em delta, limitada entre 450–900ms;
- easing suave;
- tick SFX no máximo uma vez por geração, não por dígito.

Não simular “roleta” aleatória.

---

## 7. Percentual

Crossfade + interpolação curta (350–650ms). Evitar overshoot/spring exagerado.

---

## 8. Marquee bulbs

Objetivo: palco vivo.

Regras:

- cada lâmpada pode oscilar entre 0.72 e 1.0 opacity;
- períodos longos e diferentes (2.5–6s);
- nenhuma sequência rápida em loop;
- sequência deliberada apenas no Grand Finale;
- em reduced motion, estado estático.

---

## 9. Noise / grain

O grain deve ser visualmente estático ou mover muito lentamente. Não animar um SVG noise a 60 fps.

Se houver animação, preferir background pré-renderizado/transform muito sutil.

---

## 10. Spotlight

Spotlight de candidato pode reagir discretamente ao ponteiro apenas em desktop e com intensidade idêntica.

Amplitude recomendada: 8–18px de deslocamento aparente.

Desativar em touch/reduced motion.

---

## 11. Grand Finale

Sequência máxima: 3–4 segundos.

```text
0ms      detecta transição oficial
0-300ms  ambience volume -25%
200ms    vinheta +5%
350ms    bulbs sequence
650ms    heading entra
900ms    finale sting
1100ms   situação oficial aparece
2500ms   ambience retorna em volume reduzido
```

Executar uma vez por `idg`/sessão.

---

## 12. Audio engine

Usar `howler`.

Criar `AudioProvider` / `AudioDirector` central.

Canais conceituais:

- `ambience`;
- `ui`;
- `event`.

Volumes iniciais após consentimento:

```text
master: 0.55
ambience: 0.18
ui: 0.20
event: 0.32
```

Não iniciar áudio antes de gesto explícito.

---

## 13. Assets de áudio incluídos

### `astro-change-midnight-calliope.ogg`

Loop original de 24s, criado para este projeto. É a versão recomendada para web.

### `astro-change-midnight-calliope.wav`

Master PCM do loop.

### `astro-change-update-tick.wav`

Tick curto para nova geração do TSE.

### `astro-change-curtain-open.wav`

Whoosh + sino sintético para entrada.

### `astro-change-finale-sting.wav`

Sting original para resultado matematicamente definido/final.

Esses arquivos não reproduzem uma melodia de circo conhecida; foram sintetizados especificamente para o pacote.

---

## 14. Regras de áudio

- áudio sempre opt-in;
- `mute` persistido em `localStorage`;
- ao trocar de aba, reduzir ambience opcionalmente;
- não tocar tick para cada polling sem mudança;
- tick somente quando `idg` mudar;
- não atribuir sons diferentes a candidatos;
- finale só uma vez por transição oficial;
- erro de rede não deve disparar som assustador.

---

## 15. Implementação Howler conceitual

```ts
const ambience = new Howl({
  src: ['/assets/audio/astro-change-midnight-calliope.ogg'],
  loop: true,
  volume: 0.18,
})

const updateTick = new Howl({
  src: ['/assets/audio/astro-change-update-tick.wav'],
  volume: 0.20,
})
```

Persistência:

```text
astro-change.audio.enabled
astro-change.audio.volume
```

---

## 16. Reduced motion

Seguir `prefers-reduced-motion` automaticamente.

Usuário também pode receber toggle manual.

Com reduced motion:

- sem parallax;
- sem cortina deslizante longa;
- sem ticker interpolado;
- sem bulb chase;
- áudio pode continuar se usuário desejar;
- transições viram crossfades curtos.

---

## 17. Performance budget

- manter 60fps em notebook/mobile médio;
- não animar blur gigante continuamente;
- não animar dezenas de box-shadows por frame;
- priorizar transform/opacity;
- limitar partículas a níveis discretos;
- não usar Canvas/WebGL no MVP sem necessidade.
