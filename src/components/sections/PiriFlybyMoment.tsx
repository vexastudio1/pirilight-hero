import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const PiriFlybyScene = lazy(() => import('../hero/PiriFlybyScene'));

// Same breakpoint Header.tsx already uses to mean "mobile" — reused rather
// than inventing a second threshold.
const MOBILE_BREAKPOINT = '(max-width: 860px)';

// How much of the corridor's own box must be visible before the moment
// triggers — "approximately 25% to 35%". A literal IntersectionObserver
// `threshold`, not a rootMargin approximation: for that ratio to mean
// anything, the OBSERVED element needs its real rendered height, so
// `.piri-flyby-box` itself (not a zero-height proxy) is what gets observed
// — see below for why it can be a real-height, always-rendered element
// without adding to document height.
const VIEWPORT_TRIGGER_THRESHOLD = 0.3;

// The one-shot "supersonic pass" cinematic moment, sitting in the natural
// whitespace between Mission and Services. Zero LAYOUT footprint (the
// outer anchor is height:0, same convention as .piri-services-anchor /
// .piri-transition-anchor elsewhere in this codebase) — `.piri-flyby-box`
// itself is absolutely positioned, so it can be a real, always-mounted
// element (needed for accurate IntersectionObserver ratios) without ever
// adding to the page's scroll height. Clipped (overflow:hidden) to a
// height small enough that, even at each section's own minimum padding, it
// can never reach into actual text — see the height comment in
// global.css.
//
// The <Canvas> itself only exists in the DOM for the ~3s the moment plays:
// mounted on first qualifying intersection, unmounted the instant
// PiriFlybyScene reports completion. Before and after, this costs nothing
// — no WebGL context, no render loop, not even the lazy-loaded scene
// module (fetched only once actually needed).
export default function PiriFlybyMoment() {
  const boxRef = useRef<HTMLDivElement>(null);

  // hasEnteredViewport / isAnimationActive: hasEnteredViewport tracks
  // whether the trigger has fired at all (gates the observer, prevents a
  // second play); isAnimationActive gates whether the <Canvas> is mounted
  // (React state, drives the actual render). There's no separate
  // "hasPlayed" beyond hasEnteredViewportRef — once the trigger has fired,
  // it never fires again (observer.disconnect()), so "entered" and
  // "played-or-playing" are the same fact here.
  const hasEnteredViewportRef = useRef(false);
  const [isAnimationActive, setIsAnimationActive] = useState(false);
  // A short one-shot pass can still straddle a tab-backgrounding — pausing
  // the render loop while hidden (rather than letting it keep ticking
  // off-screen) matches the same "no wasted GPU work while the user can't
  // see it" principle as the About scene's own frameloop gating.
  const [tabVisible, setTabVisible] = useState(() => document.visibilityState === 'visible');
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);

  useEffect(() => {
    const onVisibilityChange = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Never plays under reduced motion — a cross-screen flight with a
      // particle trail is exactly the kind of motion that setting exists
      // to opt out of. Nothing else depends on this moment having played,
      // so simply never triggering it is sufficient (a static Piri isn't
      // shown either — there's nothing here without the animation, so
      // "skip the effect cleanly" is the correct reduced-motion behavior,
      // not a broken/empty-looking strip left behind).
      hasEnteredViewportRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasEnteredViewportRef.current) {
          hasEnteredViewportRef.current = true;
          setIsAnimationActive(true);
          observer.disconnect();
        }
      },
      { threshold: VIEWPORT_TRIGGER_THRESHOLD },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="piri-flyby-anchor" aria-hidden="true">
      {/* Always mounted (so it has real geometry for the observer above),
          but genuinely invisible/inert before the trigger fires: no canvas,
          nothing to flash. The only glow comes from PiriFlybyScene's own 3D
          sprites, which are anchored to Piri's real position — there is no
          separate DOM-level wash to keep in sync. */}
      <div className="piri-flyby-box" ref={boxRef}>
        {isAnimationActive && (
          <Suspense fallback={null}>
            <Canvas
              className="piri-flyby-canvas"
              frameloop={tabVisible ? 'always' : 'never'}
              camera={{ position: [0, 0, 9], fov: 32 }}
              dpr={isMobile ? 1 : [1, 1.5]}
              gl={{ alpha: true, antialias: !isMobile, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false }}
              style={{ willChange: 'transform, opacity' }}
            >
              <PiriFlybyScene onComplete={() => setIsAnimationActive(false)} isMobile={isMobile} />
            </Canvas>
          </Suspense>
        )}
      </div>
    </div>
  );
}
