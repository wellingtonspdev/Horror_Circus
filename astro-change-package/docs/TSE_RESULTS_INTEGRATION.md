# ASTRO CHANGE — TSE RESULTS INTEGRATION

**Objetivo:** especificar a integração confiável com a distribuição oficial de resultados das Eleições 2026 do Tribunal Superior Eleitoral (TSE).

> Importante: o TSE não expõe uma REST API tradicional para esse caso. O modelo oficial é distribuição pública de arquivos JSON/JWS por HTTP/CDN.

---

## 1. Fontes oficiais

### Página técnica 2026

https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados

### Documentos técnicos

https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados

### Resolução aplicável

https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026

### Host oficial

```text
https://resultados.tse.jus.br
```

### Ambiente

```text
oficial
```

---

## 2. Eleição presidencial 2026 — configuração atual

Para o 2º turno de 25/10/2026:

| Item | Valor |
|---|---|
| Pleito | `3221` |
| Ciclo | `ele2026` |
| Eleição federal | `6258` |
| Turno | `2` |
| Abrangência | `br` |
| Cargo | Presidente |
| Código do cargo | `1` / arquivo `c0001` |

A descoberta deve continuar sendo feita pelo EA11 sempre que possível, e não apenas por constantes hardcoded.

---

## 3. EA11 — catálogo/configuração de eleições

Endpoint atual:

```text
https://resultados.tse.jus.br/oficial/comum/config/ele-c.json
```

O EA11 contém:

- geração (`dg`, `hg`, `idg`);
- fase (`f`);
- templates de diretórios (`arq`);
- pleitos (`pl`);
- eleições (`e`);
- turno (`t`);
- abrangências (`abr`);
- cargos/perguntas (`cp`).

### Estratégia de descoberta

1. buscar `ele-c.json`;
2. selecionar o pleito cuja data/turno interessam;
3. encontrar eleição com `tp=8`/nome federal e abrangência `br` contendo cargo `cd=1`;
4. capturar `ciclo`, `cd` da eleição e demais parâmetros;
5. construir endpoint EA20.

Para o MVP de hoje, `6258` pode existir como fallback validado, mas o fluxo normal deve tentar EA11.

---

## 4. EA20 — resultado presidencial nacional

Endpoint JSON oficial atual:

```text
https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json
```

Formato de nome documentado:

```text
br-c<cargo com 4 dígitos>-e<eleição com 6 dígitos>-u.json
```

### Papel no Astro Change

Este é o arquivo principal do dashboard presidencial. O próprio FAQ do TSE informa que, para Presidente da República, a totalização nacional deve ser obtida no EA20 de abrangência Brasil.

---

## 5. Campos de raiz relevantes

| Campo | Significado | Uso no app |
|---|---|---|
| `ele` | código da eleição | auditoria/log |
| `t` | turno | header |
| `f` | fase (`o` oficial) | rejeitar/sinalizar ambiente inesperado |
| `tpabr` | tipo de abrangência | deve ser `br` |
| `cdabr` | código de abrangência | deve ser `br` |
| `dg` / `hg` | geração do arquivo | “última atualização TSE” |
| `idg` | identificador único da geração | detectar mudança |
| `dv` | votação pode ser divulgada | gate de exibição |
| `tf` | totalização final | estado final |
| `and` | andamento (`n`,`p`,`f`) | estado da UI |
| `md` | matematicamente definido (`n`,`s`,`e`) | Grand Finale |

### Regra crítica de `idg`

O FAQ 2026 informa que `idg` é um identificador único de cada geração. **Não assumir monotonicidade.** Para o dashboard, comparar igualdade/diferença é suficiente:

```ts
const changed = previous.idg !== next.idg
```

Não usar `next.idg > previous.idg` como requisito de validade.

---

## 6. Candidatos

Caminho lógico:

```text
carg[] -> agr[] -> par[] -> cand[]
```

Campos relevantes de `cand`:

| Campo | Uso |
|---|---|
| `n` | número na urna |
| `sqcand` | identificador único e chave para foto |
| `nm` | nome completo |
| `nmu` | nome na urna |
| `seq` | ordem oficial |
| `dvt` | destinação do voto |
| `e` | eleito/2º turno conforme contexto |
| `st` | situação após totalização final |
| `vap` | votos computados |
| `pvap` | percentual exibível |
| `pvapn` | percentual de alta precisão |
| `vs[]` | vice/suplentes |

### Política de ordenação

Ordenar candidatos por `seq`, não por votos.

Isso evita que a composição física da tela mude a cada liderança.

---

## 7. Fotos oficiais

O documento de download define a pasta:

```text
<base>/<ambiente>/<ciclo>/<cd_eleicao>/fotos/<uf>/<sqcand>.jpeg
```

Para Presidente no 2º turno:

```text
https://resultados.tse.jus.br/oficial/ele2026/6258/fotos/br/<sqcand>.jpeg
```

Exemplos do snapshot atual:

```text
https://resultados.tse.jus.br/oficial/ele2026/6258/fotos/br/280002551544.jpeg
https://resultados.tse.jus.br/oficial/ele2026/6258/fotos/br/280002542548.jpeg
```

Nunca construir a foto a partir do nome. Sempre usar `sqcand`.

O pacote inclui `scripts/fetch-tse-candidate-assets.mjs` para baixar as fotos em `public/assets/tse/candidates` a partir do EA20.

---

## 8. Seções / progresso

Objeto `s`:

| Campo | Significado |
|---|---|
| `ts` | total de seções |
| `st` | seções totalizadas |
| `pst` | percentual de seções totalizadas |
| `pstn` | percentual com alta precisão |
| `snt` | seções não totalizadas |
| `si` | seções instaladas |
| `sni` | seções não instaladas |
| `sa` | seções apuradas |
| `sna` | seções não apuradas |

A barra principal deve usar `pst`/`pstn` fornecido pelo TSE, não recalcular como fonte primária.

Pode haver validação interna:

```text
st + snt = ts
```

mas divergência não deve ser “corrigida” silenciosamente no dado exibido.

---

## 9. Eleitorado

Objeto `e`:

| Campo | Significado |
|---|---|
| `te` | eleitorado total |
| `est` | eleitores em seções totalizadas |
| `c` | comparecimento |
| `pc` | percentual de comparecimento |
| `a` | abstenção |
| `pa` | percentual de abstenção |

Esses números entram no `BackstageDrawer`, não precisam competir com o placar principal.

---

## 10. Votos

Objeto `v`:

| Campo | Significado |
|---|---|
| `tv` | total de votos computados |
| `vvc` | votos a votáveis concorrentes |
| `vv` | votos válidos |
| `vb` | votos brancos |
| `tvn` | total de votos nulos |
| `vn` | votos nulos |
| `vnt` | nulos técnicos |
| `van` | anulados |
| `vansj` | anulados sub judice |

O documento EA20 define a relação geral:

```text
tv = vb + vn + vnt + van + vansj + vv
```

O app deve mostrar os valores oficiais recebidos. Cálculos derivados são apenas auxiliares de validação.

---

## 11. Decimais em formato brasileiro

Os percentuais vêm como strings com vírgula, por exemplo:

```json
"pvap": "50,49"
```

Nunca usar `Number("50,49")`.

Normalizador:

```ts
export function parseTseDecimal(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}
```

Inteiros também podem chegar como strings.

---

## 12. Modelo normalizado recomendado

```ts
export interface ElectionResult {
  source: 'TSE'
  generationId: string
  generatedAt: string
  status: 'not_started' | 'partial' | 'final'
  mathematicallyDefined: 'none' | 'second_round' | 'elected'
  votingCanBeDisplayed: boolean
  progress: {
    totalSections: number
    countedSections: number
    pendingSections: number
    countedPercent: number
  }
  electorate: {
    total: number
    turnout: number
    turnoutPercent: number
    abstentions: number
    abstentionPercent: number
  }
  votes: {
    total: number
    valid: number
    blank: number
    null: number
  }
  candidates: Array<{
    sequence: number
    number: number
    candidateId: string
    name: string
    ballotName: string
    party: string
    votes: number
    percent: number
    elected: boolean
    status: string | null
    photoUrl: string
  }>
}
```

A camada React só deve consumir esse modelo. Nenhum componente visual deveria conhecer `vap`, `pvap`, `pstn` etc.

---

## 13. Arquitetura recomendada

```text
TSE CDN
  │
  ├─ EA11 (descoberta/config)
  ├─ EA20 JSON/JWS (resultado)
  └─ fotos oficiais
  │
  ▼
Serverless / Edge adapter
  ├─ fetch condicional
  ├─ validação JWS opcional/recomendada
  ├─ schema validation
  ├─ normalização
  ├─ cache curto
  └─ last-known-good
  │
  ▼
/api/results
  │
  ▼
TanStack Query
  │
  ▼
React UI + Motion + Audio events
```

### Por que um adapter/proxy

- isolamento contra mudanças de schema;
- possibilidade de JWS no servidor;
- controle de cache;
- last-known-good;
- evita dependência direta de CORS no browser;
- simplifica o frontend;
- mantém a taxa de acesso ao TSE previsível.

---

## 14. Polling

O TSE estabelece limite de **100 requisições por segundo por IP** e pode bloquear por 10 minutos em caso de excesso. Também alerta que muitos `404` podem causar bloqueio.

A documentação 2026 não fixa um intervalo mínimo oficial de polling no FAQ atual.

### Decisão de projeto Astro Change

Enquanto `and=p`:

```text
5 segundos
```

Esse valor representa ~0,2 req/s para um único EA20 por instância e está muito abaixo do limite.

Quando `tf=s`:

```text
30 segundos por alguns minutos e depois parar
```

Em background:

- preferir 15–30 s;
- ou pausar se a política do produto aceitar.

### TanStack Query

```ts
refetchInterval: (query) => {
  const data = query.state.data
  if (!data) return 5_000
  if (data.status === 'final') return false
  return document.visibilityState === 'visible' ? 5_000 : 20_000
}
```

---

## 15. ETag / Last-Modified

O FAQ do TSE confirma suporte a `ETag`, `Last-Modified`, `If-None-Match`, `If-Modified-Since` e respostas `304 Not Modified`.

Requisições `304` também contam para rate limit.

Adapter recomendado:

1. persistir `etag` e/ou `last-modified`;
2. enviar header condicional no fetch seguinte;
3. em `304`, retornar last-known-good sem reprocessar;
4. em `200`, validar e substituir snapshot;
5. em erro, manter último snapshot válido.

---

## 16. JSON vs JWS

O TSE disponibiliza o mesmo conteúdo em JSON e JWS. JWS adiciona assinatura digital.

### Recomendação

**MVP mínimo:** JSON + TLS + schema validation + last-known-good.  
**Produção recomendada:** consumir JWS no adapter e validar assinatura.

O manual 2026 indica:

- JWS;
- EdDSA;
- curva Ed25519;
- biblioteca `jose` para JavaScript/Node.js.

### Chave pública oficial 2026

Já incluída em:

```text
config/tse-public-key-2026.jwk.json
```

Conteúdo:

```json
{
  "kty": "OKP",
  "use": "sig",
  "key_ops": ["verify"],
  "alg": "EdDSA",
  "kid": "sNbt9Q_fLS65zE1_ZLNV-XRRwPY",
  "crv": "Ed25519",
  "x": "kWlpNHjuws1csyQZwzn3Fhzbi3RD435RbpThtSr4hMc"
}
```

A chave deve vir de configuração fixa do projeto, **não do próprio JWS recebido**.

### Pseudocódigo com `jose`

```ts
import { importJWK, compactVerify } from 'jose'
import officialJwk from '../config/tse-public-key-2026.jwk.json'

const key = await importJWK(officialJwk, 'EdDSA')
const { payload, protectedHeader } = await compactVerify(jwsText, key)

if (protectedHeader.kid !== officialJwk.kid) {
  throw new Error('Unexpected TSE signing key id')
}

const json = JSON.parse(new TextDecoder().decode(payload))
```

Antes de produção, o agente deve confirmar o padrão exato do nome/URL do par `.jws` no host oficial e criar teste real de verificação.

---

## 17. Gate de divulgação

Se `dv !== 's'`:

- não exibir votos individuais;
- mostrar estado informativo;
- continuar consultando.

Isso deve estar na camada de domínio, não apenas escondido via CSS.

---

## 18. Estado matematicamente definido

EA20 documenta `md` para Presidente/Governador/Prefeito.

Valores tratados:

```text
n = não definido
e = eleito
s = segundo turno
```

Para o 2º turno presidencial, `md=e` é o gatilho de “resultado matematicamente definido”, respeitando o payload oficial.

Não implementar cálculo próprio para declarar vencedor.

---

## 19. Totalização final

`tf=s` é mais forte que simplesmente `pst=100` para o estado de resultado final.

A UI pode mostrar `100% das seções` quando `pst=100`, mas `RESULTADO FINAL` deve depender do estado oficial apropriado (`tf`/situação oficial), não de inferência visual.

---

## 20. Resiliência

### Last-known-good

Persistir em memória/cache o último payload validado.

Se nova chamada falhar:

- não zerar dados;
- marcar `stale=true`;
- informar quanto tempo faz desde a geração válida;
- retentar com backoff.

### Backoff recomendado

```text
5s -> 10s -> 20s -> 30s (cap)
```

Resetar ao primeiro sucesso.

### Não martelar 404

URLs são determinísticas. Se a rota principal conhecida retorna 404:

- parar loop rápido;
- revisar descoberta EA11;
- não tentar dezenas de combinações.

---

## 21. Validação de schema

Usar Zod ou equivalente.

Princípios:

- aceitar campos adicionais do TSE;
- exigir apenas campos críticos;
- transformar strings numéricas de maneira explícita;
- registrar inconsistências sem modificar silenciosamente o dado oficial;
- tratar ausência de campo opcional.

---

## 22. Observabilidade

Registrar no adapter:

- status HTTP;
- latência;
- `idg`;
- `dg/hg`;
- ETag;
- validação JWS;
- tempo desde última geração nova;
- erros de schema;
- uso de last-known-good.

Não registrar dados sensíveis — não existem credenciais necessárias para essa fonte.

---

## 23. Fixture incluída

`fixtures/normalized-president-2026-snapshot.json` contém um snapshot normalizado de referência para testes de UI, capturado do EA20 oficial em 25/10/2026 às 19:58:07.

Ela é somente fixture. A aplicação real deve consumir dados vivos.

---

## 24. Requisitos legais/editoriais de integração

Conforme Resolução TSE nº 23.751/2026, entidades interessadas podem buscar periodicamente os arquivos distribuídos, mas não devem alterar o conteúdo dos dados fornecidos.

No Astro Change:

- normalização de formato é permitida tecnicamente para exibição;
- valores oficiais não devem ser reescritos para favorecer narrativa;
- arredondamento exibido deve respeitar o valor oficial recebido;
- sempre identificar claramente a fonte;
- manter disclaimer de projeto independente.

Footer recomendado:

> Astro Change é um projeto independente e não possui vínculo institucional com a Justiça Eleitoral. Dados eleitorais fornecidos pelo Tribunal Superior Eleitoral (TSE).

---

## 25. Checklist de implementação

- [ ] EA11 integrado e testado.
- [ ] fallback 6258 documentado.
- [ ] EA20 nacional integrado.
- [ ] normalizador de vírgula decimal.
- [ ] candidatos ordenados por `seq`.
- [ ] fotos construídas por `sqcand`.
- [ ] `dv` respeitado.
- [ ] `idg` usado por igualdade/diferença, não ordenação.
- [ ] `tf`, `and` e `md` mapeados.
- [ ] last-known-good implementado.
- [ ] polling adaptativo.
- [ ] ETag/304 suportado no adapter.
- [ ] JWS validado com `jose` antes do selo “assinatura verificada”.
- [ ] rate limit protegido.
- [ ] erro 404 não entra em loop agressivo.
- [ ] fonte/horário expostos na UI.
