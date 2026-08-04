import { useEffect, useRef } from 'react';
import { useIntroFrame } from '../../hooks/useIntroFrame';
import { introState } from '../../lib/introState';
import { getBeamOpacity, getLivingFlicker, getRevealProgress } from '../../lib/introTimeline';
import { LOGO_BANDS } from '../../lib/logoLayout';

const LOGO_SRC = '/brand/pirilight-logo.png';

// Reveal maps 0..1 reveal-progress onto these logo-image percentages, so the
// sweep naturally lands as icon -> wordmark -> studio+lines without any
// special-casing — it's just where those bands happen to sit in the image.
const REVEAL_START_PCT = LOGO_BANDS.icon.top * 100 - 3;
const REVEAL_END_PCT = 106;
const SHARP_FEATHER_PCT = 20; // wide, soft transition — diffusion, not a wipe
const BLOOM_LEAD_PCT = 14; // the soft glow leads the crisp reveal by this much
const BLOOM_FEATHER_PCT = 32;

function reducedMotionQuery() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function maskGradient(pct: number, feather: number) {
  return `linear-gradient(to bottom, #000 0%, #000 ${Math.max(0, pct - feather)}%, transparent ${pct}%, transparent 100%)`;
}

// Renders BEHIND the 3D canvas: the volumetric light beam, tracking the
// abdomen's real projected screen position every frame (introState.abdomenX/
// YFrac) rather than any fixed point — see PiriModel for how that's computed.
export function BeamLayer() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const coneRef = useRef<HTMLDivElement>(null);
  const coneOuterRef = useRef<HTMLDivElement>(null);
  const centerGlowRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);

  useIntroFrame((elapsed) => {
    if (reducedMotionQuery()) return;

    if (anchorRef.current) {
      anchorRef.current.style.left = `${introState.abdomenXFrac * 100}%`;
      anchorRef.current.style.top = `${introState.abdomenYFrac * 100}%`;
    }

    const beamOpacity = getBeamOpacity(elapsed);
    // "Living light": small, slow, multi-frequency wobble — never static,
    // never a visible flicker.
    const flicker = beamOpacity > 0.01 ? 1 + getLivingFlicker(elapsed, 0) * 0.05 : 1;
    const flickerB = beamOpacity > 0.01 ? 1 + getLivingFlicker(elapsed, 2.4) * 0.06 : 1;
    const flickerC = beamOpacity > 0.01 ? 1 + getLivingFlicker(elapsed, 4.8) * 0.07 : 1;

    if (coneRef.current) coneRef.current.style.opacity = String(beamOpacity * 0.9 * flicker);
    if (coneOuterRef.current) coneOuterRef.current.style.opacity = String(beamOpacity * 0.6 * flickerC);
    if (centerGlowRef.current) centerGlowRef.current.style.opacity = String(beamOpacity * 0.85 * flickerB);
    if (coreRef.current) coreRef.current.style.opacity = String(beamOpacity * flickerB);
    if (particlesRef.current) particlesRef.current.style.opacity = String(beamOpacity * 0.8 * flicker);
    if (washRef.current) washRef.current.style.opacity = String(beamOpacity * 0.16 * flickerB);
  });

  return (
    <div className="intro-beam-layer" aria-hidden="true">
      <div ref={anchorRef} className="beam-anchor">
        <div ref={washRef} className="beam-wash" />
        <div ref={coneOuterRef} className="beam-cone-outer" />
        <div ref={coneRef} className="beam-cone" />
        <div ref={centerGlowRef} className="beam-center-glow" />
        <div ref={coreRef} className="beam-core" />
        <div ref={particlesRef} className="beam-particles">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={`beam-particle beam-particle--${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Renders IN FRONT of the 3D canvas: the logo, illuminated into existence
// from darkness rather than wiped or faded in — a wide feathered mask plus a
// leading, blurred/brightened "bloom" layer that the crisp image catches up
// to, so it reads as light diffusing into the logo.
export function LogoRevealLayer() {
  const sharpRef = useRef<HTMLImageElement>(null);
  const bloomRef = useRef<HTMLImageElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const lightGlowRef = useRef<HTMLDivElement>(null);
  const ambientGlowRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const sweepPlayed = useRef(false);
  const pulsePlayed = useRef(false);
  const lastResetSignal = useRef(0);

  useEffect(() => {
    if (!reducedMotionQuery() || !sharpRef.current || !bloomRef.current) return;
    // Short-circuit straight to the final state: no reveal animation, just a
    // brief fade so the logo isn't jarringly instantaneous.
    sharpRef.current.style.setProperty('mask-image', 'none');
    sharpRef.current.style.setProperty('-webkit-mask-image', 'none');
    sharpRef.current.style.opacity = '0';
    bloomRef.current.style.opacity = '0';
    if (ambientGlowRef.current) ambientGlowRef.current.style.opacity = '0';
    if (statementRef.current) statementRef.current.style.opacity = '0';
    requestAnimationFrame(() => {
      if (!sharpRef.current) return;
      sharpRef.current.style.transition = 'opacity 0.4s ease-out';
      sharpRef.current.style.opacity = '1';
      if (statementRef.current) {
        statementRef.current.style.transition = 'opacity 0.4s ease-out';
        statementRef.current.style.transform = 'translateX(-50%) translateY(0)';
        statementRef.current.style.opacity = '1';
      }
      // Ambient glow is left at 0 here, matching the normal-motion path's
      // eventual resting state (beam/glow fully faded once Piri departs) —
      // the final static state is always just the crisp logo + starfield.
    });
  }, []);

  useIntroFrame((elapsed, resetSignal) => {
    if (reducedMotionQuery()) return;

    if (resetSignal !== lastResetSignal.current) {
      lastResetSignal.current = resetSignal;
      sweepPlayed.current = false;
      pulsePlayed.current = false;
      if (sharpRef.current) sharpRef.current.style.transition = '';
      if (statementRef.current) statementRef.current.style.transition = '';
      if (pulseRef.current) pulseRef.current.classList.remove('logo-reveal-pulse--playing');
    }

    const reveal = getRevealProgress(elapsed);

    if (sharpRef.current) {
      const sharpPct = REVEAL_START_PCT + reveal * (REVEAL_END_PCT - REVEAL_START_PCT);
      const gradient = maskGradient(sharpPct, SHARP_FEATHER_PCT);
      sharpRef.current.style.setProperty('mask-image', gradient);
      sharpRef.current.style.setProperty('-webkit-mask-image', gradient);
      sharpRef.current.style.opacity = reveal > 0.01 ? '1' : '0';
    }

    if (bloomRef.current) {
      const sharpPct = REVEAL_START_PCT + reveal * (REVEAL_END_PCT - REVEAL_START_PCT);
      const bloomPct = Math.min(112, sharpPct + BLOOM_LEAD_PCT);
      const gradient = maskGradient(bloomPct, BLOOM_FEATHER_PCT);
      bloomRef.current.style.setProperty('mask-image', gradient);
      bloomRef.current.style.setProperty('-webkit-mask-image', gradient);
      // Strongest early (leading the crisp reveal), fading to 0 exactly as
      // the reveal completes, so the settled logo stays crisp and readable.
      bloomRef.current.style.opacity = reveal > 0.01 ? String(Math.max(0, 0.65 * (1 - reveal))) : '0';
    }

    // A brief, stronger blue-white bloom pulse right as the reveal
    // completes — a one-shot CSS keyframe (see `.logo-reveal-pulse` in
    // global.css) so its 0.3s ease-in/ease-out timing lives in one place
    // instead of being hand-rolled per frame here. `mix-blend-mode: screen`
    // means it can only ever add light, never cover or darken the crisp
    // logo underneath, so it can't read as a harsh flash or hurt legibility.
    if (pulseRef.current && reveal >= 0.995 && !pulsePlayed.current) {
      pulsePlayed.current = true;
      pulseRef.current.classList.add('logo-reveal-pulse--playing');
    }

    if (sweepRef.current && reveal > 0.08 && reveal < 0.95 && !sweepPlayed.current) {
      sweepPlayed.current = true;
      sweepRef.current.style.transition = 'none';
      sweepRef.current.style.transform = 'translateX(-120%)';
      sweepRef.current.style.opacity = '0.7';
      requestAnimationFrame(() => {
        if (!sweepRef.current) return;
        sweepRef.current.style.transition = 'transform 1.1s ease-in-out, opacity 1.1s ease-in-out';
        sweepRef.current.style.transform = 'translateX(120%)';
        sweepRef.current.style.opacity = '0';
      });
    }

    if (lightGlowRef.current) {
      const glowT = Math.min(1, Math.max(0, (reveal - 0.5) / 0.4));
      lightGlowRef.current.style.opacity = String(glowT * 0.7);
    }

    // The logo's own "reflected" glow tracks the beam's presence directly
    // (not reveal progress) — it should feel like the logo is lit by the
    // beam, brightening and fading with it rather than the reveal sweep.
    if (ambientGlowRef.current) {
      ambientGlowRef.current.style.opacity = String(getBeamOpacity(elapsed) * 0.55);
    }

    // The brand statement is "the final completion of the logo reveal": it
    // only starts appearing once the reveal sweep has nearly finished
    // (studio is already the last thing that sweep uncovers), with a soft
    // fade and a small upward settle — no new timeline phase needed, it's
    // purely a function of the existing reveal progress.
    if (statementRef.current) {
      const statementT = Math.min(1, Math.max(0, (reveal - 0.82) / 0.18));
      const eased = statementT * statementT * (3 - 2 * statementT);
      statementRef.current.style.opacity = String(eased);
      statementRef.current.style.transform = `translateX(-50%) translateY(${(1 - eased) * 8}px)`;
    }
  });

  return (
    <div className="intro-logo-layer">
      <div className="intro-stage" role="img" aria-label="PiriLight Studio">
        <div ref={ambientGlowRef} className="logo-ambient-glow" aria-hidden="true" />
        <div ref={lightGlowRef} className="logo-glow-light" aria-hidden="true" />
        <img ref={bloomRef} className="logo-layer logo-layer--bloom" src={LOGO_SRC} alt="" aria-hidden="true" />
        <img ref={sharpRef} className="logo-layer logo-layer--sharp" src={LOGO_SRC} alt="" aria-hidden="true" />
        <div ref={pulseRef} className="logo-reveal-pulse" aria-hidden="true" />
        <div ref={sweepRef} className="logo-sweep" aria-hidden="true" />
      </div>
      {/* A separate scroll-drift wrapper (not the intro's own settle-in
          transform on statementRef below) so the tagline can lag shortly
          behind the logo's own drift instead of moving in exact lockstep —
          see --tagline-t in global.css. */}
      <div className="hero__tagline-drift">
        <div ref={statementRef} className="brand-statement">
          <span className="brand-statement__line brand-statement__line--primary">NÃO CRIAMOS APENAS WEBSITES.</span>
          <span className="brand-statement__line brand-statement__line--accent">ILUMINAMOS NEGÓCIOS.</span>
        </div>
      </div>
    </div>
  );
}
