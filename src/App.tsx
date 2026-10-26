import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, useReducedMotion } from "motion/react";
import { Volume2, VolumeX, Accessibility } from "lucide-react";
import {
  CircusShell,
  CurtainIntro,
  GrandFinale,
  MarqueeHeader,
} from "./components/circus";
import {
  CandidateSpotlightCard,
  ElectionProgress,
  LiveIndicator,
  ResultSummary,
  TSESourceBadge,
} from "./components/election";
const BackstageDrawer = lazy(() =>
  import("./components/backstage").then((m) => ({
    default: m.BackstageDrawer,
  })),
);
const SourceMethodModal = lazy(() =>
  import("./components/backstage").then((m) => ({
    default: m.SourceMethodModal,
  })),
);
import { Skeleton } from "./components/ui/skeleton";
import { useElection } from "./lib/use-election";
import { fixtureMode } from "./lib/tse/client";
import { audio, type SoundLevel } from "./lib/audio";
import {
  markSession,
  readPreference,
  savePreference,
  sessionValue,
} from "./lib/preferences";
export default function App() {
  const systemReduced = useReducedMotion();
  const [manualReduced, setManualReduced] = useState(
    () => readPreference("motion", "full") === "reduced",
  );
  const reduced = !!systemReduced || manualReduced;
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);
  const [entered, setEntered] = useState(
    () => sessionValue("entered") === "yes",
  );
  const [sound, setSound] = useState<SoundLevel>("mute");
  const query = useElection(),
    data = query.data,
    result = data?.result;
  const generation = useRef<string | undefined>(undefined);
  const [age, setAge] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setAge(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!result || !entered) return;
    if (generation.current && generation.current !== result.generationId)
      audio.effect("update-tick");
    generation.current = result.generationId;
  }, [result, entered]);
  useEffect(() => {
    if (!entered) return;
    const timer = setTimeout(
      () => document.getElementById("stage-heading")?.focus(),
      reduced ? 0 : 950,
    );
    return () => clearTimeout(timer);
  }, [entered, reduced]);
  function enter(withSound: boolean) {
    const stored = readPreference("audio.level", "on");
    const level: SoundLevel = withSound
      ? stored === "low"
        ? "low"
        : "on"
      : "mute";
    audio.setLevel(level);
    setSound(level);
    savePreference("audio.level", level);
    audio.effect("curtain-open");
    markSession("entered");
    setEntered(true);
  }
  function toggleSound() {
    const next = sound === "mute" ? "on" : sound === "on" ? "low" : "mute";
    audio.setLevel(next);
    setSound(next);
    savePreference("audio.level", next);
  }
  const old =
    !!data &&
    result?.status !== "final" &&
    age - new Date(data.checkedAt).getTime() > 30000;
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <CircusShell reduced={reduced}>
        {fixtureMode && (
          <div className="fixture-banner">
            MODO FIXTURE · DADOS DE DESENVOLVIMENTO · NÃO É APURAÇÃO AO VIVO
          </div>
        )}
        <AnimatePresence>
          {!entered && (
            <CurtainIntro key="intro" reduced={reduced} onEnter={enter} />
          )}
        </AnimatePresence>
        <div inert={!entered}>
          <a className="skip-link" href="#stage-heading">
            Ir para os resultados
          </a>
          <nav className="utility" aria-label="Controles da experiência">
            <div className="utility-brand">
              <img src="/assets/svg/astro-change-mark.svg" alt="" />
              <span>
                2º TURNO · BRASIL
                <br />
                PRESIDENTE · 2026
              </span>
            </div>
            <div className="controls">
              <button
                onClick={toggleSound}
                aria-label={`Som: ${sound === "mute" ? "mudo" : sound === "low" ? "reduzido" : "ligado"}. Alterar som.`}
              >
                {sound === "mute" ? <VolumeX /> : <Volume2 />}
                <span>
                  Som{" "}
                  {sound === "mute"
                    ? "desligado"
                    : sound === "low"
                      ? "reduzido"
                      : "ligado"}
                </span>
              </button>
              <button
                aria-pressed={reduced}
                aria-label="Reduzir movimentos"
                onClick={() => {
                  setManualReduced(!manualReduced);
                  savePreference("motion", !manualReduced ? "reduced" : "full");
                }}
              >
                <Accessibility />
                <span className="control-text">Menos movimento</span>
              </button>
              <Suspense fallback={<span>Sobre os dados</span>}>
                <SourceMethodModal />
              </Suspense>
            </div>
          </nav>
          <main>
            <MarqueeHeader />
            <p className="stage-kicker">
              ELEIÇÕES PRESIDENCIAIS · 25 OUTUBRO 2026
            </p>
            <LiveIndicator
              data={data}
              error={query.isError || old}
              fetching={query.isFetching}
            />
            {(data?.stale || query.isError || old) && (
              <div className="notice" role="status">
                {data
                  ? `${data.error || "Atualização temporariamente indisponível."} Exibindo o último dado oficial recebido. Reconectando…`
                  : query.error?.message}
                <div>
                  <button
                    disabled={query.isFetching}
                    onClick={() => void query.refetch()}
                  >
                    Tentar novamente
                  </button>{" "}
                  <a
                    href="https://resultados.tse.jus.br/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir resultados oficiais
                  </a>
                </div>
              </div>
            )}
            {!data && !query.isError && (
              <>
                <p className="notice">
                  Preparando o picadeiro… Conectando à fonte oficial.
                </p>
                <div className="loading-cards">
                  <Skeleton className="loading-card" />
                  <Skeleton className="loading-card" />
                </div>
              </>
            )}
            {result && (
              <>
                {result.votingCanBeDisplayed ? (
                  <>
                    <section
                      className="candidate-grid"
                      aria-label="Resultados oficiais por candidato"
                    >
                      {result.candidates.map((candidate) => (
                        <CandidateSpotlightCard
                          key={candidate.candidateId}
                          candidate={candidate}
                          reduced={reduced}
                        />
                      ))}
                    </section>
                    <ElectionProgress result={result} reduced={reduced} />
                    <ResultSummary result={result} />
                  </>
                ) : (
                  <div className="notice">
                    O TSE ainda não autorizou a divulgação da votação.
                    Aguardando liberação oficial.
                  </div>
                )}
                {entered && (
                  <GrandFinale
                    defined={result.mathematicallyDefined === "elected"}
                    reduced={reduced}
                  />
                )}
                <Suspense fallback={null}>
                  <BackstageDrawer data={data} />
                </Suspense>
              </>
            )}
            <TSESourceBadge data={data} />
          </main>
          <footer className="footer">
            <img src="/assets/svg/ticket-divider.svg" alt="" />
            <strong>Astro Change é um projeto independente.</strong>
            <p>
              Dados eleitorais fornecidos pelo Tribunal Superior Eleitoral
              (TSE).
            </p>
            <p>
              Este site não possui vínculo institucional com a Justiça
              Eleitoral.
            </p>
          </footer>
        </div>
      </CircusShell>
    </MotionConfig>
  );
}
