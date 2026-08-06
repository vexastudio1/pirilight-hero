import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';

const PiriAboutScene = lazy(() => import('../hero/PiriAboutScene'));

// Mounted inside `.piri-about-visual` (see AboutSection.tsx) — the existing
// circular, clipped (overflow:hidden + border-radius:50%) "stage" that was
// already reserved for exactly this ("Future hook: reserved for a Piri
// illustration or a lightweight 3D/animated moment"). The circle's own
// clipping is what keeps Piri contained — no extra bounds-checking needed
// here.
//
// Two separate IntersectionObserver concerns, both required and distinct:
//  - entranceTriggeredRef / isMounted: fires ONCE (25-35% visible), mounts
//    the <Canvas> and plays the fly-in. Never fires again — the entrance
//    must not replay on subsequent scroll-into-view.
//  - sectionVisible: stays live for the Canvas's entire lifetime, toggling
//    r3f's own `frameloop` prop ('always' <-> 'never') so the indefinite
//    hover loop (which, unlike the flyby, never naturally ends) actually
//    stops doing any work — no rAF, no render calls — while the section is
//    scrolled out of view, and resumes exactly where it left off when it
//    scrolls back. document.visibilityState (tab backgrounded) folds into
//    the same decision.
export default function PiriAboutMoment() {
  const boxRef = useRef<HTMLDivElement>(null);
  const entranceTriggeredRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tabVisible, setTabVisible] = useState(() => document.visibilityState === 'visible');

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;

    const entranceObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !entranceTriggeredRef.current) {
          entranceTriggeredRef.current = true;
          setIsMounted(true);
          entranceObserver.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    entranceObserver.observe(node);

    // Generous threshold (any part visible at all) — this one keeps
    // observing for as long as the component is mounted, purely to gate
    // the render-loop pause/resume, not to trigger anything.
    const visibilityObserver = new IntersectionObserver(([entry]) => setSectionVisible(entry.isIntersecting), {
      threshold: 0,
    });
    visibilityObserver.observe(node);

    return () => {
      entranceObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  const frameloop = isMounted && sectionVisible && tabVisible ? 'always' : 'never';

  return (
    <div className="piri-about-visual" aria-hidden="true" ref={boxRef}>
      <span className={`piri-about-visual__glow${isMounted ? ' piri-about-visual__glow--dimmed' : ''}`} />
      {isMounted && (
        <Suspense fallback={null}>
          <Canvas
            className="piri-about-canvas"
            frameloop={frameloop}
            camera={{ position: [0, 0, 9], fov: 32 }}
            dpr={[1, 1.5]}
            gl={{ alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false }}
            style={{ willChange: 'transform, opacity' }}
          >
            <PiriAboutScene reducedMotion={reducedMotion} />
          </Canvas>
        </Suspense>
      )}
    </div>
  );
}
