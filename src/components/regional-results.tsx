import { useEffect, useRef, useState } from "react";
import { REGIONS, getRegion, type RegionCode } from "../lib/tse/geography";
import { useRegion } from "../lib/use-region";
import { fixtureMode } from "../lib/tse/client";
import {
  CandidateSpotlightCard,
  number,
  percent,
  dateTime,
  VoteCounter,
} from "./election";
export default function RegionalResults({ reduced }: { reduced: boolean }) {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState<RegionCode | null>(null);
  const [selectedUf, setSelectedUf] = useState<string | null>(null);
  const detail = useRef<HTMLHeadingElement>(null);
  const query = useRegion(open ? region : null);
  const data = query.data;
  const definition = region ? getRegion(region) : undefined;
  const selected = data?.states.find((s) => s.code === selectedUf);
  const candidates =
    data?.summary?.candidates ??
    data?.states.find((s) => s.data?.result.votingCanBeDisplayed)?.data?.result
      .candidates ??
    [];
  useEffect(() => {
    if (selectedUf) detail.current?.focus();
  }, [selectedUf]);
  return (
    <section className="regional-section" aria-labelledby="regional-heading">
      <div className="regional-heading">
        <div>
          <p className="eyebrow">OUTROS ÂNGULOS DO PICADEIRO</p>
          <h2 id="regional-heading">A apuração pelo Brasil</h2>
          <p>Explore as regiões e os resultados oficiais de cada estado.</p>
        </div>
        <button
          aria-expanded={open}
          aria-controls={open ? "regional-content" : undefined}
          onClick={() => setOpen(!open)}
        >
          {open ? "Fechar recortes" : "Explorar por região"}{" "}
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </div>
      {open && (
        <div id="regional-content">
          {fixtureMode ? (
            <p className="notice">
              Os recortes regionais estão disponíveis no modo live. A fixture
              nacional não contém dados estaduais.
            </p>
          ) : (
            <>
              <div
                className="region-options"
                role="group"
                aria-label="Selecionar região"
              >
                {REGIONS.map((item) => (
                  <button
                    key={item.code}
                    aria-pressed={region === item.code}
                    onClick={() => {
                      setRegion(item.code);
                      setSelectedUf(null);
                    }}
                  >
                    <span>{item.name}</span>
                    <small>
                      {item.code === "exterior"
                        ? "Fora do Brasil"
                        : `${item.states.length} UFs`}
                    </small>
                  </button>
                ))}
              </div>
              {!region && (
                <p className="regional-hint">
                  Selecione uma região. O placar nacional acima permanece como
                  referência do Brasil inteiro.
                </p>
              )}
              {region && (
                <section
                  key={region}
                  className="regional-content"
                  aria-label={`Resultados de ${definition!.name}`}
                >
                  <h3>{definition!.name}</h3>
                  <p className="regional-method">
                    {region === "exterior"
                      ? "Dados do arquivo oficial do TSE para o exterior."
                      : "Consolidação da aplicação a partir dos arquivos oficiais de todas as UFs da região. Os percentuais consolidados são calculados sobre os totais, não pela média dos percentuais estaduais."}
                  </p>
                  <p role="status" className="regional-status">
                    {query.isFetching
                      ? data
                        ? "Atualizando fontes regionais…"
                        : "Consultando fontes oficiais da região…"
                      : query.isError || data?.stale
                        ? "Reconectando às fontes regionais"
                        : data?.summary?.status === "final"
                          ? "Totalização deste recorte encerrada"
                          : data
                            ? "Fontes regionais recebidas"
                            : ""}
                  </p>
                  {(query.isError || data?.stale) && (
                    <div className="notice">
                      {data
                        ? "Exibindo os últimos dados recebidos de cada UF. As fontes indisponíveis estão identificadas abaixo."
                        : "Não foi possível carregar a região. O placar nacional permanece disponível."}{" "}
                      <button
                        disabled={query.isFetching}
                        onClick={() => void query.refetch()}
                      >
                        Tentar região novamente
                      </button>
                    </div>
                  )}
                  {data && (
                    <>
                      <p className="regional-trust">
                        {data.verifiedSources
                          ? "Assinaturas das fontes deste recorte verificadas"
                          : "Nem todas as fontes possuem assinatura verificada"}{" "}
                        · {data.states.filter((s) => s.data).length}/
                        {data.states.length} fontes recebidas
                      </p>
                      {data.generatedFrom && (
                        <p className="regional-generation">
                          Gerações oficiais de {dateTime(data.generatedFrom)} a{" "}
                          {dateTime(data.generatedTo!)} · Brasília
                        </p>
                      )}
                      {data.summary ? (
                        <div
                          className="regional-summary"
                          aria-label={`Consolidação de ${definition!.name}`}
                        >
                          <div className="regional-comparison">
                            {data.summary.candidates.map((c) => (
                              <div key={c.candidateId}>
                                <span>
                                  {c.ballotName} · {c.number}
                                </span>
                                <strong>
                                  {percent(c.percent)}
                                  <small>%</small>
                                </strong>
                                <p>
                                  <VoteCounter
                                    value={c.votes}
                                    reduced={reduced}
                                  />{" "}
                                  votos
                                </p>
                                <div
                                  className="regional-track"
                                  aria-hidden="true"
                                >
                                  <div
                                    style={{
                                      transform: `scaleX(${c.percent / 100})`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="regional-totals">
                            <span>
                              <b>
                                {percent(data.summary.progress.countedPercent)}%
                              </b>{" "}
                              das seções totalizadas
                            </span>
                            <span>
                              {number(data.summary.progress.countedSections)} /{" "}
                              {number(data.summary.progress.totalSections)}{" "}
                              seções ·{" "}
                              {number(data.summary.progress.pendingSections)}{" "}
                              restantes
                            </span>
                            <span>
                              Válidos: {number(data.summary.votes.valid)} ·
                              Brancos: {number(data.summary.votes.blank)} ·
                              Nulos: {number(data.summary.votes.null)}
                            </span>
                          </div>
                          <p className="regional-method">
                            {region === "exterior"
                              ? "Recorte do exterior, separado das cinco macrorregiões."
                              : "Totais somados pela aplicação. Percentual dos candidatos = votos do candidato ÷ soma dos votos dos candidatos recebidos. Progresso = seções totalizadas ÷ total de seções. As gerações estaduais podem ter horários diferentes."}
                          </p>
                        </div>
                      ) : (
                        <p className="notice">
                          {data.summaryUnavailableReason}
                        </p>
                      )}
                      <div
                        className="state-table-scroll"
                        tabIndex={0}
                        role="region"
                        aria-label="Tabela de resultados por UF, com rolagem horizontal quando necessário"
                      >
                        <table className="state-table">
                          <caption>
                            Resultados oficiais por UF · selecione um estado
                            para detalhar
                          </caption>
                          <thead>
                            <tr>
                              <th scope="col">UF</th>
                              {candidates.map((c) => (
                                <th scope="col" key={c.candidateId}>
                                  {c.ballotName}
                                </th>
                              ))}
                              <th scope="col">Seções</th>
                              <th scope="col">Fonte e geração</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.states.map((state) => (
                              <tr
                                key={state.code}
                                data-selected={state.code === selectedUf}
                              >
                                <th scope="row">
                                  <button
                                    onClick={() => setSelectedUf(state.code)}
                                    aria-pressed={selectedUf === state.code}
                                    disabled={!state.data}
                                  >
                                    {state.name}
                                    <small>
                                      {state.code.toUpperCase()} · Detalhar
                                    </small>
                                  </button>
                                </th>
                                {candidates.map((c) => (
                                  <td
                                    key={c.candidateId}
                                    data-label={c.ballotName}
                                  >
                                    {state.data?.result.votingCanBeDisplayed
                                      ? (() => {
                                          const result =
                                            state.data.result.candidates.find(
                                              (item) =>
                                                item.candidateId ===
                                                c.candidateId,
                                            );
                                          return result ? (
                                            <>
                                              <strong>
                                                {percent(result.percent)}%
                                              </strong>
                                              <span>
                                                {number(result.votes)} votos
                                              </span>
                                            </>
                                          ) : (
                                            "Não informado"
                                          );
                                        })()
                                      : state.data
                                        ? "Aguardando divulgação"
                                        : "Fonte indisponível"}
                                  </td>
                                ))}
                                <td data-label="Seções totalizadas">
                                  {state.data ? (
                                    <>
                                      <strong>
                                        {percent(
                                          state.data.result.progress
                                            .countedPercent,
                                        )}
                                        %
                                      </strong>
                                      <span>
                                        {number(
                                          state.data.result.progress
                                            .countedSections,
                                        )}{" "}
                                        /{" "}
                                        {number(
                                          state.data.result.progress
                                            .totalSections,
                                        )}
                                      </span>
                                    </>
                                  ) : (
                                    "Indisponível"
                                  )}
                                </td>
                                <td data-label="Fonte e geração">
                                  {state.data ? (
                                    <>
                                      <a
                                        href={state.data.sourceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        EA20 {state.code.toUpperCase()} ↗
                                      </a>
                                      <span>
                                        {state.data.verified
                                          ? "Assinatura verificada"
                                          : "Sem verificação JWS"}
                                      </span>
                                      <time
                                        dateTime={state.data.result.generatedAt}
                                      >
                                        {dateTime(
                                          state.data.result.generatedAt,
                                        )}
                                      </time>
                                      {state.data.stale && (
                                        <span>
                                          Último dado recebido · reconectando
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    state.error
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {selected?.data && (
                        <section
                          className="state-detail"
                          aria-labelledby="state-detail-heading"
                        >
                          <div className="state-detail-heading">
                            <div>
                              <p className="eyebrow">
                                RECORTE ESTADUAL · {selected.code.toUpperCase()}
                              </p>
                              <h4
                                id="state-detail-heading"
                                tabIndex={-1}
                                ref={detail}
                              >
                                {selected.name}
                              </h4>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedUf(null);
                                document
                                  .querySelector<HTMLButtonElement>(
                                    '.state-table button[aria-pressed="true"]',
                                  )
                                  ?.focus();
                              }}
                            >
                              Fechar detalhe
                            </button>
                          </div>
                          <p className="regional-method">
                            Votos neste recorte. A votação estadual não declara
                            o resultado nacional.{" "}
                            {selected.data.stale
                              ? "Exibindo o último dado estadual recebido."
                              : ""}
                          </p>
                          {selected.data.result.votingCanBeDisplayed ? (
                            <div className="candidate-grid">
                              {selected.data.result.candidates.map(
                                (candidate) => (
                                  <CandidateSpotlightCard
                                    key={`${selected.code}-${candidate.candidateId}`}
                                    candidate={candidate}
                                    reduced={reduced}
                                  />
                                ),
                              )}
                            </div>
                          ) : (
                            <p className="notice">
                              O TSE ainda não autorizou a divulgação neste
                              recorte.
                            </p>
                          )}
                          <p className="regional-generation">
                            Eleitorado:{" "}
                            {number(selected.data.result.electorate.total)} ·
                            Comparecimento:{" "}
                            {number(selected.data.result.electorate.turnout)} ·
                            Abstenção:{" "}
                            {number(
                              selected.data.result.electorate.abstentions,
                            )}
                          </p>
                        </section>
                      )}
                    </>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
