import { useEffect, useRef } from "react";
import { animate, motion } from "motion/react";
import type {
  CandidateResult,
  ElectionResult,
  ResultEnvelope,
} from "../lib/tse/types";
import { motionTokens } from "../lib/motion-tokens";
import photoManifest from "../../public/assets/tse/candidates/manifest.json";
export const number = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);
export const percent = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
export const time = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
export function VoteCounter({
  value,
  reduced,
}: {
  value: number;
  reduced: boolean;
}) {
  const node = useRef<HTMLSpanElement>(null),
    previous = useRef(value);
  useEffect(() => {
    if (reduced || previous.current === value) {
      if (node.current) node.current.textContent = number(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: motionTokens.counter,
      ease: motionTokens.ease,
      onUpdate: (v) => {
        if (node.current) node.current.textContent = number(Math.round(v));
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduced]);
  return (
    <span aria-label={number(value)} ref={node}>
      {number(value)}
    </span>
  );
}
export function CandidateSpotlightCard({
  candidate,
  reduced,
}: {
  candidate: CandidateResult;
  reduced: boolean;
}) {
  return (
    <motion.article
      className="candidate"
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : motionTokens.panel }}
    >
      <img className="corner" src="/assets/svg/corner-ornament.svg" alt="" />
      <div className="portrait-frame">
        <img
          className="portrait"
          width="220"
          height="240"
          src={
            photoManifest.some((p) => p.sqcand === candidate.candidateId)
              ? `/assets/tse/candidates/${photoManifest.find((p) => p.sqcand === candidate.candidateId)!.file}`
              : candidate.photoUrl
          }
          alt={`Foto oficial de ${candidate.ballotName}`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/assets/svg/astro-change-mark.svg";
            e.currentTarget.classList.add("placeholder");
          }}
        />
        <span className="candidate-number">{candidate.number}</span>
      </div>
      <div className="candidate-copy">
        <p className="eyebrow">PRESIDENTE · {candidate.party}</p>
        <h2>{candidate.ballotName}</h2>
        <div className="percentage">
          {percent(candidate.percent)}
          <span>%</span>
        </div>
        <p className="vote-total">
          <VoteCounter value={candidate.votes} reduced={reduced} />
          <span> votos</span>
        </p>
        <p className="official-status">
          {candidate.status || "Votação oficial recebida"}
        </p>
      </div>
    </motion.article>
  );
}
export function ElectionProgress({
  result,
  reduced,
}: {
  result: ElectionResult;
  reduced: boolean;
}) {
  const p = result.progress;
  return (
    <section className="progress-panel" aria-labelledby="progress-heading">
      <div className="progress-title">
        <div>
          <p className="eyebrow">CADA SEÇÃO, UMA PARTE DA HISTÓRIA</p>
          <h2 id="progress-heading">A apuração em cena</h2>
        </div>
        <strong>
          {percent(p.countedPercent)}
          <small>%</small>
        </strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Seções totalizadas"
        aria-valuenow={p.countedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          initial={false}
          animate={{ scaleX: p.countedPercent / 100 }}
          transition={{ duration: reduced ? 0 : motionTokens.counter }}
        />
      </div>
      <div className="progress-caption">
        <span>
          <b>{number(p.countedSections)}</b> / {number(p.totalSections)} seções
          totalizadas
        </span>
        <span>{number(p.pendingSections)} restantes</span>
      </div>
    </section>
  );
}
export function LiveIndicator({
  data,
  error,
  fetching,
}: {
  data?: ResultEnvelope;
  error: boolean;
  fetching: boolean;
}) {
  const stale = error || data?.stale;
  const waiting =
    !!data && Date.now() - new Date(data.result.generatedAt).getTime() > 60000;
  const label = stale
    ? data
      ? "RECONECTANDO · ÚLTIMO DADO OFICIAL"
      : "FONTE TEMPORARIAMENTE INDISPONÍVEL"
    : data?.result.status === "final"
      ? "APURAÇÃO ENCERRADA"
      : data?.result.mathematicallyDefined === "elected"
        ? "RESULTADO MATEMATICAMENTE DEFINIDO"
        : !data
          ? "CONECTANDO AO TSE"
          : fetching
            ? "ATUALIZANDO"
            : data.result.status === "not_started"
              ? "AGUARDANDO TSE"
              : waiting
                ? "AGUARDANDO NOVA TOTALIZAÇÃO"
                : "APURAÇÃO AO VIVO";
  return (
    <p className="live-indicator" role="status">
      <span className={stale ? "status-dot stale" : "status-dot"} />
      {label}
    </p>
  );
}
export function TSESourceBadge({ data }: { data?: ResultEnvelope }) {
  return (
    <section className="source">
      <a href="https://resultados.tse.jus.br/" target="_blank" rel="noreferrer">
        Fonte: Tribunal Superior Eleitoral <span aria-hidden="true">↗</span>
      </a>
      <span>
        Última atualização oficial{" "}
        {data ? (
          <time dateTime={data.result.generatedAt}>
            {dateTime(data.result.generatedAt)} · Brasília
          </time>
        ) : (
          "—"
        )}
      </span>
      <span>
        {data?.verified
          ? "Assinatura oficial verificada"
          : "Assinatura digital não verificada"}
      </span>
    </section>
  );
}
export function ResultSummary({ result }: { result: ElectionResult }) {
  return (
    <section className="summary" aria-label="Resumo da votação">
      {[
        ["Votos válidos", result.votes.valid],
        ["Brancos", result.votes.blank],
        ["Nulos", result.votes.null],
        ["Comparecimento", result.electorate.turnout],
      ].map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{number(Number(value))}</strong>
        </div>
      ))}
    </section>
  );
}
