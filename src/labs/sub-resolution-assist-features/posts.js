// Post drafts for Lab 003, written from published.json (numbers verified against model.js by
// scripts/labs/check-sraf-published.mjs). Used by scripts/labs/publish.mjs.
const gain = (a, b) => `${Math.round((b / a - 1) * 100)} %`;

export function posts({ url, published: P }) {
  const d = P.designs, o = P.optics, c = P.criteria, s = P.sharedDose, cv = P.conventional;
  const linkedin = `Some of the most useful features on a photomask are the ones we never want to print.

Sub-resolution assist features (SRAFs, or scattering bars) are thin lines placed beside an isolated feature. They are designed to stay below the printing threshold. Their job is not to appear on the wafer but to change how the light behaves through focus.

I built a small, validated model to see how much that matters: ${o.wavelength} nm, NA ${o.na}, annular illumination (σ ${o.sigmaIn}–${o.sigmaOut}), a ${c.cd} nm isolated line, 1D partially coherent imaging with exact scalar defocus, and a constant-threshold resist after a ${c.blur} nm blur.

The figure of merit is the focus-exposure process window: the depth of focus (DOF) over which one dose interval with ${Math.round(c.exposureLatitude * 100)} % exposure latitude keeps the CD within ±${Math.round(c.cdTolerance * 100)} %, and nothing else prints.

• Dense lines at 200 nm pitch: ${d.dense200.dofCdOnly} nm DOF
• The same line isolated: ${d.none.dofDefectFree} nm
• With 2 × 30 nm assists per side: ${d.recommended.dofDefectFree} nm (+${gain(d.none.dofDefectFree, d.recommended.dofDefectFree)}), every assist at least ${Math.round(d.recommended.marginInCdWindow * 100)} % above threshold
• With 2 × 60 nm assists: the CD-only window grows to ${d.oversized.dofCdOnly} nm, but the assists print inside it. Defect-free DOF: ${d.oversized.dofDefectFree} nm.

Three things surprised me:
1. At best focus the image barely changes (NILS ${d.none.nilsAerial.toFixed(2)} → ${d.recommended.nilsAerial.toFixed(2)} in this example). The benefit is robustness through focus, not a sharper image.
2. At a shared dose, the assists only close about half of the iso-dense bias (${s.isoCd} → ${s.isoWithRecommendedCd} nm, target ${s.target}). OPC still has work to do.
3. They are not universally good. Under conventional illumination (σ 0.6), the same bars raise DOF (${cv.none.dofDefectFree} → ${cv.recommended.dofDefectFree} nm) but lower best-focus NILS (${cv.none.nilsAerial.toFixed(2)} → ${cv.recommended.nilsAerial.toFixed(2)}).

The lab includes the math, validation (exact two-beam defocus, convergence in grid, source, focus and dose, and a point-by-point check that nothing prints inside the accepted windows), references, limitations and a challenge: maximise the defect-free DOF without printing your helpers.
${url}

Synthetic example and public textbook physics only. The 10 % assist margin is an educational heuristic, not a specification.

#Lithography #ComputationalLithography #Semiconductors #Optics #EngineeringEducation`;
  const x = `Some of the most useful features on a photomask are the ones we never want to print.

Thin assist bars widen an isolated line's focus window ${d.none.dofDefectFree} → ${d.recommended.dofDefectFree} nm. Make them too big and they print: ${d.oversized.dofDefectFree} nm.

Interactive lab: ${url}`;
  return { linkedin, x };
}
