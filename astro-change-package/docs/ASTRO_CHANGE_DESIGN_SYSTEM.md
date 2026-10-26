# ASTRO CHANGE — DESIGN SYSTEM

**Status:** baseline consolidado para implementação  
**Direção:** *The Midnight Big Top* — circo clássico decadente + cabaré sombrio + horror psicológico + linguagem editorial de placar ao vivo  
**Produto:** painel web React para acompanhamento da totalização presidencial de 2026 com dados oficiais do TSE  
**Regra central:** a apresentação pode ser teatral; os dados devem permanecer neutros, exatos, legíveis e sem manipulação.

---

## 1. Princípio de marca

Astro Change deve parecer um espetáculo antigo reaberto por uma única noite. A atmosfera vem de veludo escuro, metal envelhecido, lâmpadas de marquee, cartazes de circo do início do século XX, sombras profundas, grão analógico, pequenos símbolos astrais e uma trilha de calliope/caixa de música degradada.

Não é um template de Halloween. Evitar gore, sangue escorrendo, jumpscares, palhaços gigantes, caveiras decorativas em excesso e referências que possam parecer propaganda a favor ou contra qualquer candidatura.

A experiência deve comunicar simultaneamente:

1. **Espetáculo:** o site é memorável, cinematográfico e tem identidade própria.
2. **Informação:** percentuais, votos e progresso são a prioridade visual real.
3. **Neutralidade:** candidatos recebem tratamento visual equivalente.
4. **Confiabilidade:** fonte TSE, horário de atualização e estado da integração ficam sempre visíveis.
5. **Acessibilidade:** áudio, movimento e contraste nunca impedem o consumo dos dados.

---

## 2. Nome e linguagem verbal

### Nome

**ASTRO CHANGE**

### Assinatura recomendada

> O espetáculo da apuração.

Alternativas secundárias para microcopy:

- O picadeiro da totalização.
- O espetáculo continua.
- Dados oficiais entrando em cena.
- Próxima atualização em instantes.
- Bastidores da apuração.
- O resultado está definido. *(somente quando o estado oficial do TSE permitir)*

### Linguagem proibida

Não usar frases que celebrem, ridicularizem ou dramatizem um candidato específico. Evitar “massacre”, “virada histórica”, “humilhação”, “derrota esmagadora”, “campeão”, “vilão”, “herói”, “o público escolheu seu favorito” e similares.

---

## 3. Símbolo e marca

O símbolo-base fornecido em `assets/svg/astro-change-mark.svg` combina:

- estrela de oito pontas;
- arco/tenda de circo;
- halo de metal envelhecido;
- vermelho de veludo;
- ponto luminoso central.

### Regras de uso

- O símbolo pode existir isolado em favicon, loader e controles compactos.
- O wordmark “ASTRO CHANGE” deve ser tratado como lettering/display e nunca competir com os números da apuração.
- Não aplicar cores partidárias ao símbolo.
- O símbolo deve permanecer idêntico independentemente de qual candidato esteja à frente.

---

## 4. Paleta

| Token | Hex | Uso |
|---|---:|---|
| `pitch-black` | `#080607` | fundo global |
| `velvet-black` | `#15090C` | cards e superfícies |
| `stage-black` | `#0D090A` | palco / áreas elevadas |
| `carnival-red` | `#720D17` | vermelho estrutural |
| `blood-marquee` | `#A81722` | detalhes ativos |
| `deep-wine` | `#4E080F` | sombras de veludo |
| `antique-gold` | `#C39A5A` | bordas, ornamentos, marquee |
| `antique-gold-hi` | `#D4B06C` | brilhos metálicos |
| `antique-gold-lo` | `#8F6A32` | metal escurecido |
| `old-bone` | `#E7DCC5` | texto principal suave |
| `stage-white` | `#F4EEE4` | números críticos |
| `ash` | `#918A82` | texto secundário |
| `danger` | `#C73A45` | erros de integração |
| `success` | `#79A37D` | verificação/estado saudável |
| `info` | `#8CA4AD` | estados informativos |

A paleta existe em `assets/design-tokens.css`.

### Política de cores dos candidatos

- A UI principal **não** usa vermelho/azul ou cores de partido como código dominante.
- Se a sigla do partido for exibida com cor, limitar a um detalhe pequeno, de mesmo peso visual para ambos.
- Cards, spotlights, bordas e motion devem ser simétricos.

---

## 5. Tipografia

### Display / marca

Preferência: **Rye** ou lettering próprio inspirado em cartazes de circo. Usar apenas para marca, títulos curtos e elementos cenográficos.

### Editorial

Preferência: **Fraunces** ou **Cormorant Garamond** para subtítulos e chamadas teatrais.

### Dados/UI

Preferência: **Geist**, **Inter** ou equivalente sans-serif altamente legível.

### Números

- usar `font-variant-numeric: tabular-nums`;
- nunca usar fonte circense para votos, percentuais, horários ou progresso;
- preferir pesos 600–800;
- garantir que ambos os candidatos tenham exatamente o mesmo tamanho de números.

**Nota:** fontes não são incluídas neste pacote. Carregar por fonte web/host próprio conforme a licença aplicável.

---

## 6. Grid e responsividade

### Breakpoints funcionais

- `< 640px`: mobile compacto, cards empilhados.
- `640–1023px`: tablet, dois cards quando houver espaço real.
- `>= 1024px`: palco desktop completo.
- `>= 1440px`: composição cinematográfica com mais respiro e ornamentação.

### Desktop

- largura máxima de conteúdo: `1440px`;
- palco central com dois candidatos lado a lado;
- estatísticas secundárias abaixo;
- header fixo ou sticky muito discreto;
- laterais podem conter cortinas parciais e spotlight.

### Mobile

- preservar ordem fixa dos candidatos baseada na ordem oficial (`seq`), não em liderança;
- evitar trocar cards de posição quando a liderança mudar;
- percentuais ficam visíveis acima da dobra;
- controles de áudio e fonte TSE permanecem acessíveis.

---

## 7. Profundidade e materiais

### Fundo

Camadas recomendadas:

1. `pitch-black`;
2. gradiente radial vermelho quase preto;
3. `noise-grain.svg` em `opacity: 0.025–0.055`;
4. vinheta suave;
5. spotlights em SVG/CSS com baixa opacidade.

### Veludo

Evitar textura fotográfica pesada. Criar sensação de veludo por:

- gradientes assimétricos;
- sombras internas;
- highlights estreitos;
- microvariação de luminosidade.

### Metal envelhecido

- borda principal `antique-gold`;
- highlight de 1px `antique-gold-hi`;
- sombra interna marrom/preta;
- brilho muito controlado, nunca neon.

---

## 8. Componentes visuais fundamentais

### `CircusShell`

Estrutura global do palco. Responsável por fundo, grão, vinheta, cortinas decorativas, safe areas e reduced motion.

### `MarqueeHeader`

Marca Astro Change em letreiro. Usa `marquee-frame.svg`. Lâmpadas devem variar levemente de luminosidade, nunca piscar em alta frequência.

### `CurtainIntro`

Tela de entrada para desbloquear áudio após gesto do usuário.

Conteúdo padrão:

- Astro Change;
- “O espetáculo da apuração”;
- selo “Dados oficiais do TSE”;
- botão `Entrar no Picadeiro`;
- link `Entrar sem som`.

### `CandidateSpotlightCard`

Card neutro do candidato contendo:

- foto oficial;
- nome de urna;
- número e partido;
- percentual;
- total de votos;
- indicador de atualização somente se aquele dado mudou;
- situação oficial, se houver.

As duas instâncias devem usar o mesmo componente e mesmos tokens.

### `VoteCounter`

- anima somente entre valor anterior e novo;
- `tabular-nums`;
- sem roleta infinita;
- atualização entre 450 e 900 ms;
- em `prefers-reduced-motion`, substituição imediata.

### `ElectionProgress`

Exibe percentual e `seções totalizadas / total de seções`.

Visual: trilho escuro + preenchimento marfim/dourado suave. Não usar cor de candidato.

### `LiveIndicator`

Estados:

- `AO VIVO` — dados recentes;
- `AGUARDANDO TSE` — sem novo `idg`, mas conexão saudável;
- `DADOS DESATUALIZADOS` — stale acima do limiar;
- `FONTE INDISPONÍVEL` — erro real;
- `RESULTADO FINAL` — `tf=s`.

### `TSESourceBadge`

Sempre acessível. Exibe:

- Fonte: Tribunal Superior Eleitoral;
- última geração `dg hg`;
- estado de assinatura, caso JWS esteja habilitado;
- link para a fonte oficial.

### `BackstageDrawer`

Painel de estatísticas secundárias:

- votos válidos;
- brancos;
- nulos;
- comparecimento;
- abstenção;
- total de eleitores;
- seções instaladas/não instaladas.

### `SoundControl`

Três estados:

- ligado;
- reduzido;
- mudo.

Persistir preferência localmente.

### `GrandFinale`

Só pode ser disparado a partir do estado oficial do payload. Deve reduzir o ambiente e destacar o resultado sem comemoração partidária.

---

## 9. Ícones e ornamentação

Preferir ícones funcionais simples (Lucide ou equivalente) dentro da UI. Ornamentos de circo só nas molduras e divisores.

Assets incluídos:

- `astro-change-mark.svg`;
- `starburst-8.svg`;
- `marquee-frame.svg`;
- `curtain-left.svg`;
- `curtain-right.svg`;
- `corner-ornament.svg`;
- `ticket-divider.svg`;
- `noise-grain.svg`;
- `spotlight-beam.svg`;
- `favicon.svg`.

---

## 10. Fotografia

A única fotografia necessária ao MVP é a **foto oficial do candidato fornecida pelo TSE**.

Não usar fotos jornalísticas, memes, fotografias de comício ou imagens escolhidas de maneira editorial, pois enquadramento/expressão podem introduzir viés visual.

O `sqcand` do EA20 é o identificador de foto. O padrão de origem é documentado no handoff de integração.

Tratamento permitido:

- crop consistente;
- máscara e moldura idênticas;
- leve dessaturação global se aplicada igualmente;
- sombra/spotlight idêntico;
- sem retoque facial;
- sem distorção;
- sem overlays diferentes por candidato.

---

## 11. Estados da experiência

### Pré-totalização

- palco ativo;
- candidatos exibidos se `dv=s`;
- votos podem estar em zero;
- copy: `O espetáculo está prestes a começar`.

### Parcial

- `and=p`;
- polling ativo;
- atualização de números com Motion;
- copy: `O espetáculo continua`.

### Matematicamente definido

- seguir campo `md`/estado oficial;
- reduzir luz ambiente;
- ativar `GrandFinale` uma única vez por sessão;
- copy neutra: `O resultado está matematicamente definido`.

### Final

- `tf=s` ou estado final oficial;
- interromper polling agressivo;
- mostrar `RESULTADO FINAL`;
- manter todos os dados e fonte.

### Erro

Nunca substituir a última informação válida por zeros.

Mostrar o snapshot anterior com selo:

> Atualização temporariamente indisponível. Exibindo o último dado oficial recebido.

---

## 12. Acessibilidade

Obrigatório:

- contraste WCAG AA no mínimo para texto funcional;
- foco de teclado visível;
- `aria-live="polite"` para status, não para cada incremento numérico;
- `prefers-reduced-motion` respeitado;
- nenhuma informação depende exclusivamente de cor;
- controles de som sempre visíveis após a entrada;
- sem autoplay sonoro antes de interação;
- sem flashes acima de níveis seguros;
- imagens com `alt` neutro: `Foto oficial de [nome de urna]`.

---

## 13. Base técnica visual

### Recomendado

- React + Vite + TypeScript;
- Tailwind CSS v4;
- shadcn/ui como foundation;
- Motion via `motion/react`;
- Aceternity UI apenas para efeitos selecionados;
- Magic UI apenas para componentes pontuais;
- Howler.js para áudio;
- GSAP somente se uma timeline cinematográfica específica realmente exigir.

### Componentes externos candidatos

**Aceternity:** Spotlight, Moving Border, Noise/background utilities, Sparkles em densidade baixa.  
**Magic UI:** Number Ticker (se for melhor que implementação Motion própria), Noise Texture, Light Rays, Shine Border, Text Animate.  
**shadcn/ui:** Dialog, Sheet, Tooltip, Skeleton, Button, Separator, Switch, Drawer.

Não importar componentes apenas porque “são bonitos”. Cada dependência deve servir a uma necessidade real.

---

## 14. Anti-padrões

Não implementar:

- reorder automático por liderança;
- animação de comemoração para um candidato;
- confete partidário;
- sons exclusivos por candidato;
- cores de fundo partidárias dominantes;
- caricaturas;
- distorção ou edição das fotos oficiais;
- linguagem que afirme resultado antes do estado oficial;
- polling no browser de centenas de URLs;
- skeleton substituindo último resultado válido após já termos dados.

---

## 15. Definition of Done visual

O design está aprovado quando:

- a interface parece Astro Change sem precisar de um logotipo grande;
- os votos e percentuais são a informação mais legível da tela;
- os dois candidatos recebem tratamento absolutamente equivalente;
- a estética funciona mesmo com áudio desligado;
- a experiência continua funcional com reduced motion;
- mobile preserva hierarquia e não vira uma landing page longa;
- a fonte TSE e o horário de atualização são identificáveis em até um olhar;
- nenhuma decoração interfere na leitura dos resultados.

---

## 16. Fontes de referência técnica

- shadcn/ui: https://ui.shadcn.com/docs
- Motion: https://motion.dev/docs/react
- Aceternity UI: https://ui.aceternity.com/components
- Magic UI: https://magicui.design/docs/components
- Howler.js: https://howlerjs.com/

Este documento deve ser lido junto com `TSE_RESULTS_INTEGRATION.md`, `SCREEN_COMPONENT_SPEC.md`, `MOTION_AUDIO_SPEC.md` e `ACCEPTANCE_CRITERIA.md`.
