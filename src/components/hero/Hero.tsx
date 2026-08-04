import { Suspense, lazy, useRef, useState } from 'react';
import { Environment } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import NightSky from './NightSky';
import AmbientParticles from './AmbientParticles';
import { BeamLayer, LogoRevealLayer } from './IntroOverlay';
import { useScrollDrift } from '../../hooks/useScrollDrift';

const PiriModel = lazy(() => import('./PiriModel'));

export default function Hero() {
  const [resetSignal, setResetSignal] = useState(0);
  const transitionRegionRef = useRef<HTMLDivElement>(null);
  useScrollDrift(transitionRegionRef);

  return (
    <>
      {/* The starfield is the persistent night environment for the whole
          page (Hero + ProblemSection, for now), not scoped to the hero's own
          sticky/clipped box — mounted once here, `position: fixed` in CSS,
          so it never scrolls away with `.hero` and is never duplicated. */}
      <NightSky />

      <div className="hero-transition-region" ref={transitionRegionRef} id="inicio">
        <section className="hero">
          <AmbientParticles />

          {/* Logo, beam and 3D canvas move/fade/shrink together as one
              "subject" once scrolling begins — see useScrollDrift +
              scrollTimeline.ts. The starfield is handled independently (see
              NightSky above) since it persists past the hero itself. */}
          <div className="hero__subject-drift">
            <BeamLayer />

            <div className="hero__canvas">
              <Canvas camera={{ position: [0, 0, 9], fov: 32 }} dpr={[1, 1.5]} gl={{ preserveDrawingBuffer: true }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[3, 4, 5]} intensity={1.3} />
                <Suspense fallback={null}>
                  <PiriModel resetSignal={resetSignal} />
                  <Environment preset="city" />
                </Suspense>
              </Canvas>
            </div>

            <LogoRevealLayer />
          </div>

          {import.meta.env.DEV && (
            <button className="hero__replay" onClick={() => setResetSignal((n) => n + 1)}>
              Repetir animação
            </button>
          )}
        </section>
      </div>
    </>
  );
}
