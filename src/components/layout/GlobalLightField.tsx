// The single, page-wide replacement for the old per-section `.section__glow`
// divs (see the comment above `.global-light` in global.css for why those
// caused visible seams). Mounted once as the first child of `.content-flow`
// in App.tsx — never inside an individual `.section` — so none of these
// blobs can be clipped at a section boundary.
//
// Purely presentational: every blob's position/size/color is static CSS,
// and opacity is driven entirely by the `--page-light-t` custom property
// that useScrollDrift.ts already writes onto `<html>` every frame. No refs,
// no effects, no per-frame JS here — this component never re-renders.
export default function GlobalLightField() {
  return (
    <div className="global-light" aria-hidden="true">
      <div className="global-light__blob global-light__blob--a" />
      <div className="global-light__blob global-light__blob--b" />
      <div className="global-light__blob global-light__blob--c" />
      <div className="global-light__blob global-light__blob--d" />
      <div className="global-light__blob global-light__blob--e" />
    </div>
  );
}
