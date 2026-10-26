import {
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { audio } from "../lib/audio";
import { markSession, sessionValue } from "../lib/preferences";
import { motionTokens } from "../lib/motion-tokens";
export function CircusShell({
  children,
  reduced,
}: {
  children: ReactNode;
  reduced: boolean;
}) {
  return (
    <div className="circus-shell" data-motion={reduced ? "reduced" : "full"}>
      <div className="stage-scenery" aria-hidden="true">
        <img
          className="side-curtain left"
          src="/assets/svg/curtain-left.svg"
          alt=""
        />
        <img
          className="side-curtain right"
          src="/assets/svg/curtain-right.svg"
          alt=""
        />
        <img
          className="spotlight beam-left"
          src="/assets/svg/spotlight-beam.svg"
          alt=""
        />
        <img
          className="spotlight beam-right"
          src="/assets/svg/spotlight-beam.svg"
          alt=""
        />
        <div className="grain" />
      </div>
      {children}
    </div>
  );
}
export function MarqueeHeader() {
  return (
    <header className="marquee">
      <img
        className="marquee-frame"
        src="/assets/svg/marquee-frame.svg"
        alt=""
      />
      <div className="bulbs" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--chase-delay": `${i * 0.06}s`,
                animationDelay: `-${i * 0.37}s`,
                animationDuration: `${3 + (i % 4)}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <p className="eyebrow">UMA NOITE NO MIDNIGHT BIG TOP</p>
      <h1 id="stage-heading" tabIndex={-1}>
        ASTRO CHANGE
      </h1>
      <p className="tagline">O espetáculo da apuração</p>
    </header>
  );
}
export function CurtainIntro({
  onEnter,
  reduced,
}: {
  onEnter: (sound: boolean) => void;
  reduced: boolean;
}) {
  const [opening, setOpening] = useState(false);
  function enter(sound: boolean) {
    onEnter(sound);
    setOpening(true);
  }
  return (
    <motion.section
      className="intro"
      role="dialog"
      aria-modal="true"
      aria-label="Entrada do picadeiro"
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : motionTokens.scene }}
    >
      <motion.img
        className="intro-curtain curtain-left"
        src="/assets/svg/curtain-left.svg"
        alt=""
        animate={{ x: opening && !reduced ? "-100%" : 0 }}
        transition={{
          duration: motionTokens.scene,
          ease: motionTokens.curtain,
        }}
      />
      <motion.img
        className="intro-curtain curtain-right"
        src="/assets/svg/curtain-right.svg"
        alt=""
        animate={{ x: opening && !reduced ? "100%" : 0 }}
        transition={{
          duration: motionTokens.scene,
          ease: motionTokens.curtain,
        }}
      />
      <div className="intro-content">
        <img
          width="100"
          height="100"
          src="/assets/svg/astro-change-mark.svg"
          alt=""
        />
        <p className="eyebrow">RESPEITÁVEL PÚBLICO</p>
        <h1>
          ASTRO
          <br />
          CHANGE
        </h1>
        <p className="tagline">O espetáculo da apuração</p>
        <p className="intro-election">2º turno · Presidente · Brasil</p>
        <p className="source-ticket">DADOS OFICIAIS DO TSE</p>
        <button
          autoFocus
          className="primary-button"
          onClick={() => enter(true)}
        >
          ENTRAR NO PICADEIRO <span aria-hidden="true">↗</span>
        </button>
        <button className="quiet-button" onClick={() => enter(false)}>
          Entrar sem som
        </button>
        <small>Atualizações automáticas durante a totalização</small>
      </div>
    </motion.section>
  );
}
export function GrandFinale({
  defined,
  reduced,
}: {
  defined: boolean;
  reduced: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const handled = useRef(false);
  useEffect(() => {
    if (!defined || handled.current || sessionValue("finale.6258")) {
      setPlaying(false);
      return;
    }
    markSession("finale.6258");
    handled.current = true;
    setPlaying(true);
    const soundTimer = setTimeout(
      () => audio.effect("finale-sting"),
      reduced ? 0 : 900,
    );
    const timer = setTimeout(() => setPlaying(false), reduced ? 150 : 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(soundTimer);
    };
  }, [defined, reduced]);
  return (
    <>
      <AnimatePresence>
        {playing && (
          <motion.div
            key="finale"
            className="finale-light"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      {defined && (
        <section className="finale-message" role="status">
          <img
            src="/assets/svg/starburst-8.svg"
            width="30"
            height="30"
            alt=""
          />
          <h2>O resultado está matematicamente definido</h2>
          <p>Conforme indicação oficial do TSE.</p>
        </section>
      )}
    </>
  );
}
