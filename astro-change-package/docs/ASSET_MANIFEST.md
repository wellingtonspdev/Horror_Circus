# ASTRO CHANGE — ASSET MANIFEST

## 1. Assets originais incluídos

### SVG

| Arquivo | Uso |
|---|---|
| `astro-change-mark.svg` | símbolo principal |
| `favicon.svg` | favicon base |
| `starburst-8.svg` | ornamento astral |
| `marquee-frame.svg` | moldura do letreiro |
| `curtain-left.svg` | cortina esquerda |
| `curtain-right.svg` | cortina direita |
| `corner-ornament.svg` | cantos de cards/frames |
| `ticket-divider.svg` | divisores |
| `noise-grain.svg` | textura de grão |
| `spotlight-beam.svg` | spotlight decorativo |

### PNG

`astro-change-mark-preview.png` — raster de referência do símbolo.

### Áudio

| Arquivo | Uso |
|---|---|
| `astro-change-midnight-calliope.ogg` | ambience web recomendado |
| `astro-change-midnight-calliope.wav` | master PCM |
| `astro-change-update-tick.wav` | nova geração TSE |
| `astro-change-curtain-open.wav` | entrada |
| `astro-change-finale-sting.wav` | finale |

Os SVGs e sons desta seção foram criados especificamente para este pacote e não dependem de fotografia/áudio de terceiros.

---

## 2. Assets oficiais do TSE

### Fotos de candidatos

Não são tratadas como assets de marca. São dados/arquivos oficiais dinâmicos associados ao EA20.

Padrão:

```text
https://resultados.tse.jus.br/oficial/ele2026/6258/fotos/br/<sqcand>.jpeg
```

O script:

```text
scripts/fetch-tse-candidate-assets.mjs
```

baixa as fotos atuais e cria um `manifest.json` local.

### Por que não usar fotos externas

- evita viés de enquadramento editorial;
- mantém consistência com a fonte oficial;
- simplifica atualização caso haja substituição;
- `sqcand` já existe no EA20.

---

## 3. Foto placeholder

Se a foto TSE falhar, usar o próprio `astro-change-mark.svg` ou silhouette neutra gerada em CSS. Não usar foto encontrada em notícia/rede social como fallback automático.

---

## 4. Fontes

Font files não estão incluídos neste pacote.

Sugestão:

- Rye — display;
- Fraunces ou Cormorant Garamond — editorial;
- Geist ou Inter — UI/dados.

O agente deve verificar licença e estratégia de self-host/CDN antes de produção.

---

## 5. Terceiros

Nenhuma fotografia de banco de imagens foi adicionada ao pacote porque o MVP não precisa dela. A atmosfera é construída com SVG/CSS/áudio original e fotos oficiais dos candidatos.

Isso reduz risco de licença e mantém o produto visualmente mais coerente.
