# ASTRO CHANGE — ACCEPTANCE CRITERIA

## 1. Dados e integração

- [ ] A aplicação obtém a configuração eleitoral via EA11 ou usa fallback validado.
- [ ] O resultado presidencial vem do EA20 nacional oficial.
- [ ] Nenhum valor de voto/percentual é mockado em produção.
- [ ] `sqcand` é usado para fotos oficiais.
- [ ] Candidatos são ordenados por `seq`, não por liderança.
- [ ] `dv` é respeitado antes de divulgar votação.
- [ ] `idg` detecta nova geração por diferença, sem assumir monotonicidade.
- [ ] `tf`, `and` e `md` são interpretados corretamente.
- [ ] O app não declara vencedor por cálculo próprio.
- [ ] Percentuais com vírgula são normalizados sem perda indevida.
- [ ] O último snapshot válido é preservado em falha de rede.
- [ ] Polling não ultrapassa política definida e possui backoff.
- [ ] URLs inválidas/404 não entram em tentativa agressiva.
- [ ] Fonte TSE e data/hora da geração ficam visíveis.

## 2. JWS / confiança

- [ ] Se o selo “assinatura verificada” existir, houve validação real do JWS.
- [ ] A chave oficial está fixa em configuração confiável.
- [ ] `kid` é validado.
- [ ] Erro de assinatura impede promover o payload como verificado.
- [ ] JSON simples pode existir como fallback explicitamente rotulado, se necessário.

## 3. Neutralidade visual

- [ ] Cards usam exatamente a mesma estrutura.
- [ ] Fotos têm mesmo tamanho/crop.
- [ ] Tipografia de votos/percentuais é idêntica.
- [ ] Ordem não muda com liderança.
- [ ] Nenhum candidato recebe glow/áudio/motion exclusivo.
- [ ] Não há confete, comemoração partidária ou caricatura.
- [ ] O Grande Finale depende de estado oficial.

## 4. Design system

- [ ] Tokens de `assets/design-tokens.css` são adotados.
- [ ] Logo/mark fornecido é aplicado com fidelidade ou refinado sem romper conceito.
- [ ] Veludo/preto/dourado/marfim formam a base.
- [ ] Horror é atmosférico, não gore.
- [ ] UI não parece template Halloween.
- [ ] Dados são mais legíveis que a decoração.

## 5. Responsividade

- [ ] 360px sem overflow horizontal.
- [ ] 390/430px testados.
- [ ] 768px testado.
- [ ] 1024px testado.
- [ ] 1440px testado.
- [ ] 1920px não fica excessivamente esticado.

## 6. Acessibilidade

- [ ] Navegação por teclado completa.
- [ ] Focus ring visível.
- [ ] Contraste funcional >= WCAG AA.
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Áudio não inicia sem gesto.
- [ ] Mute acessível e persistente.
- [ ] Informações não dependem só de cor.
- [ ] Status utiliza live region apropriada, sem spam.
- [ ] Fotos têm alt neutro.

## 7. Motion

- [ ] Intro <= ~1.1s até interface utilizável.
- [ ] Atualização numérica não bloqueia leitura.
- [ ] Nenhuma animação contínua pesada.
- [ ] Bulbs não piscam rapidamente.
- [ ] Reduced motion elimina deslocamentos grandes.
- [ ] Grand Finale não reposiciona candidatos.

## 8. Áudio

- [ ] Ambience é opcional.
- [ ] Loop não tem clique perceptível excessivo.
- [ ] Tick toca uma vez por nova geração no máximo.
- [ ] Finale toca uma vez por evento oficial.
- [ ] Preferência persiste.
- [ ] Volume inicial é baixo.

## 9. Performance

Metas de referência:

- [ ] LCP desktop < 2.5s em conexão razoável.
- [ ] CLS < 0.1.
- [ ] Candidate photos têm dimensão/reserva de espaço para evitar layout shift.
- [ ] Audio/ornamentos são lazy/preload seletivo.
- [ ] Nenhum polling provoca rerender global desnecessário.

## 10. Erros

- [ ] Primeiro carregamento falho mostra mensagem clara.
- [ ] Refetch falho preserva último dado.
- [ ] JWS inválido possui estado distinto de rede indisponível.
- [ ] Foto ausente usa placeholder neutro.
- [ ] Dados inesperados geram log e fallback seguro.

## 11. Conteúdo legal/editorial

- [ ] Disclaimer de projeto independente no footer.
- [ ] Link para fonte oficial.
- [ ] Nenhum uso de brasão/logo TSE que sugira afiliação institucional.
- [ ] Dados não são alterados para narrativa.
- [ ] Horário exibido deixa claro que é horário de geração do TSE.

## 12. Testes mínimos

- [ ] parser EA20 unit test.
- [ ] decimal parser unit test.
- [ ] `idg` change test.
- [ ] `dv=n` gate test.
- [ ] final-state test.
- [ ] mathematically-defined transition test.
- [ ] stale/last-known-good test.
- [ ] candidate order test.
- [ ] keyboard smoke test.
- [ ] reduced motion smoke test.
- [ ] mobile screenshot regression smoke test.
