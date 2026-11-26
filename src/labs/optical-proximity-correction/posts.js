// Post drafts for Lab 002, written from published.json (numbers verified against model.js by
// scripts/labs/check-opc-published.mjs). Used by scripts/labs/publish.mjs.
const n1 = (v) => Math.abs(v).toFixed(1);
const pct = (v) => `${Math.round(v * 100)} %`;

export function posts({ url, published: P }) {
  const u = P.uncorrected, m = P.modelBased, isoDense = u.isoCdError - u.denseCdError, stop = P.pitchStudy.find(r => !r.loopConverged);
  const linkedin = `Why would anyone draw the wrong shape on a photomask on purpose?

A projection lens is a low-pass filter. At ${P.optics.wavelength} nm and NA ${P.optics.na}, it passes no spatial frequency above NA/λ ≈ ${(P.optics.na / P.optics.wavelength * 1000).toFixed(1)} µm⁻¹, so the sharp corners and line ends drawn on a mask never reach the wafer intact. In a simulated clip of ${P.layout.cd} nm lines and spaces (k₁ ≈ ${P.optics.k1}), the uncorrected mask prints:
• line ends ${n1(u.lineEndTip)} nm short
• outer corners pulled back ${n1(u.outerCorner)} nm along the diagonal
• an isolated line ${n1(isoDense)} nm wider than its dense neighbours
• an RMS edge placement error (EPE) of ${n1(u.rmsEpe)} nm over ${u.sites} edge sites

Optical proximity correction (OPC) turns the question around: which mask prints the target after the lens has blurred it? I built a minimal model-based version: 2D partially coherent imaging (Abbe formulation, ${P.numerics.sourcePoints} source points), a constant-threshold resist after a ${P.resist.blur} nm blur, and edge fragments that each move against their own EPE.

No serif or hammerhead is coded anywhere. They emerge. The fragments beside each line end push outward until they reach a mask-rule limit, and the outer corner grows a serif.

Under identical optics:
• RMS EPE ${n1(u.rmsEpe)} → ${n1(m.rmsEpe)} nm
• edge sites within ±${P.numerics.toleranceNm} nm: ${pct(u.withinTolerance)} → ${pct(m.withinTolerance)}
• corner pull-back ${n1(u.outerCorner)} → ${n1(m.outerCorner)} nm, still round, because no mask makes a band-limited image carry a sharp corner

The teaching model also shows its own limits. At k₁ ≈ ${stop ? stop.k1 : 0.39} this fixed-gain loop stops converging. That is a limit of the simple algorithm, not of lithography: production OPC uses coupled solvers, calibrated resist models and process-window objectives.

The interactive lab covers the math, the validation (grid and illumination-sampling convergence, sub-pixel EPE accuracy, evaluation at independent sites) and the references. It also lets you try to beat the model with your own serifs and hammerheads:
${url}

Synthetic layout and public textbook physics only.

#Lithography #ComputationalLithography #Semiconductors #Optics #EngineeringEducation`;
  const x = `Sometimes, printing the correct shape requires designing the wrong one.

The distorted mask prints better: edge error ${n1(u.rmsEpe)} → ${n1(m.rmsEpe)} nm, same lens, same light. Nobody drew its serifs and hammerheads. A simple optical model grew them.

Interactive lab: ${url}`;
  return { linkedin, x };
}
