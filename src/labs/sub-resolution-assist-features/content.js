// Written content for Lab 003, sub-resolution assist features: math, definitions, limitations and references.
// Numbers quoted here come from published.json (verified against model.js by scripts/labs/check-sraf-published.mjs).

export const mathSections = [
  {
    id: 'iso-dense',
    title: '1. Why an isolated line behaves differently',
    body: [
      'A line in a dense array diffracts its light into a few sharp orders. Off-axis illumination is tuned to such patterns: each source direction sends its 0th order and one 1st order through the pupil at almost the same angle, so defocus barely changes their relative phase. An isolated line has no orders. Its spectrum is a broad sinc, and most of that light travels at angles whose phase changes quickly with defocus. At 193 nm, NA 0.85 and annular illumination (σ 0.55–0.85), the dense 90 nm lines at 200 nm pitch keep their CD over 607 nm of focus. The isolated 90 nm line manages 223 nm.',
    ],
    equations: [String.raw`\phi(\mathbf f, z) = 2\pi z\left(\sqrt{\lambda^{-2} - |\mathbf f|^2} - \lambda^{-1}\right), \qquad E_s(x, z) = \sum_k \hat M_k\, P(\mathbf f_{k,s})\, e^{\,i\phi(\mathbf f_{k,s}, z)}\, e^{\,i 2\pi k x / L}`],
    after: [
      'The defocus phase is exact scalar propagation, with no paraxial approximation. Here f_{k,s} = (k/L + s_x, s_y) is the direction of order k under source direction s. Intensities add over source directions, which are sampled point-symmetrically. With an aberration-free lens and a symmetric mask, that pairing makes I(x, z) = I(x, −z) exactly.',
    ],
  },
  {
    id: 'helpers',
    title: '2. Assist features reshape the spectrum without printing',
    body: [
      'Scattering bars are narrow chrome lines placed beside an isolated feature, below the size that prints (Chen and Matthews 1993). They add structure to the mask spectrum near the frequencies that the annular source images in a focus-tolerant way, so the isolated line starts to behave more like a dense one. Each bar still darkens the image locally. It is safe only while that dip stays above the printing threshold, so it never forms a contour of its own.',
    ],
    equations: [String.raw`|\hat M(f)|^2 = \Bigl|\sum_j \int_{a_j}^{b_j} e^{-i 2\pi f x}\,dx\Bigr|^2 \quad \text{(main line and bars, each an interval } [a_j, b_j])`],
  },
  {
    id: 'resist',
    title: '3. Dose, threshold and printing (and which side prints)',
    body: [
      'The mask is bright field (chrome on clear glass) and the resist is positive tone. Dose E is measured in units of the dose that just clears a fully open area, so resist clears where E·I_r ≥ 1. The printed feature, the resist that remains, is therefore where I_r < t, with t = 1/E. A higher dose shrinks dark features. Assist bars are dark features too, which makes them most likely to print at low dose.',
    ],
    equations: [String.raw`I_r = I * G_{\sigma_d},\ \ \sigma_d = 12\ \text{nm}, \qquad t = \frac{1}{E}, \qquad \text{printed} = \{x : I_r(x) < t\}`],
    after: [
      'NILS is computed on the aerial image I (before blur) at the target edge x = CD/2: NILS = CD·|d ln I/dx|. The lab also reports the value on the blurred image I_r, which is lower: 1.82 instead of 1.97 for the recommended design.',
    ],
  },
  {
    id: 'window',
    title: '4. The process window, three ways',
    body: [
      'At each focus z, the CD-only window is the dose range [E_lo(z), E_hi(z)] that keeps the main line within ±10 % of its 90 nm target. A dose interval [E_a, E_b] has exposure latitude EL = (E_b − E_a)/E_mid, with E_mid its midpoint. DOF at 5 % EL is the longest focus range over which one such interval fits inside the window at every focus. That is the exposure-defocus window method of B. J. Lin (1994).',
    ],
    equations: [
      String.raw`\mathrm{EL} = \frac{E_b - E_a}{(E_a + E_b)/2} \ge 5\,\%, \qquad \mathrm{DOF} = \max\,\bigl\{\, z_1 - z_0 : [E_a, E_b] \subseteq W(z)\ \ \forall z \in [z_0, z_1] \,\bigr\}`,
    ],
    after: [
      'The CD-only window ignores everything except the main line. The defect-free window also requires that nothing else prints anywhere, neither assist bars nor side lobes. At focus z that means E ≥ 1/m(z), where m(z) is the darkest separate minimum of I_r outside the main line. The safe window adds an educational margin: E ≥ 1.1/m(z), so every unwanted dip stays at least 10 % brighter than the threshold. Each window is a dose floor applied on top of the previous one, so safe ⊆ defect-free ⊆ CD-only.',
    ],
    check: 'Check by hand: for a synthetic window with E_lo = 1 and E_hi = 1.2 − k z², the best interval sits at E_a = 1, so E_mid = 1/0.975 and E_b = 1.0513. DOF = 2√(0.1487/k), which is 545.4 nm for k = 2·10⁻⁶ nm⁻². The lab’s window search returns 545.3 nm.',
  },
  {
    id: 'results',
    title: '5. What the model finds',
    body: [
      'Each design here is measured at its own dose-to-size. Two 30 nm bars per side, 110 nm from the line, lift the defect-free DOF from 223 to 293 nm, with every assist at least 31 % above threshold everywhere in the window. Two 40 nm bars reach 324 nm, but the margin drops to 9.9 %: marginal. Two 60 nm bars give the largest CD-only window, 395 nm, yet they print inside it. Their defect-free DOF is 0 nm, because no 5 % dose interval at any focus keeps the bars from printing while the line stays in specification.',
      'At best focus the gain is small in this example: aerial NILS goes from 1.95 to 1.97. The benefit here is robustness through focus, not a sharper in-focus image. Other layouts, illuminations and assist designs can change NILS more, in either direction.',
      'Shared dose tells a different story from individual dose-to-size. At the dense lines’ dose (2.986), the isolated line prints 73.7 nm instead of 90 nm. With the recommended assists it prints 82.0 nm. The assists close about half of the iso-dense bias; the rest is left to OPC, which in practice is re-run with the assists in place.',
      'Assists are not universally good. With conventional illumination (σ 0.6), the same bars raise DOF from 177 to 216 nm but cut aerial NILS from 2.41 to 1.96 at best focus.',
    ],
  },
];

export const educationalVsIndustrial = [
  ['Geometry', '1D cross-section of infinitely long lines, one main feature', 'Full 2D layouts: line ends, corners and assist ends, millions of features'],
  ['Imaging', 'Scalar Abbe, thin mask, 601 symmetric source points, exact scalar defocus', 'Vector imaging, mask 3D effects (which strongly affect assist printability), aberrations, flare'],
  ['Resist', 'Constant threshold after a 12 nm blur', 'Calibrated resist models; dedicated assist-printing checks'],
  ['Assist placement', 'Rule-like: count, width and spacing chosen by the user', 'Rule-based tables, or model-based / inverse-lithography placement co-optimised with OPC and the source'],
  ['Robustness', 'Focus and dose only; a 10 % margin heuristic', 'Process-variation bands including mask error and dose/focus, with mask-rule and inspectability limits'],
];

export const limitations = [
  { title: 'One dimension', text: 'Lines are infinitely long, so line-end shortening, assist-bar ends and 2D side lobes are absent. Long lines are where scattering bars are used most, which is why the cross-section is a reasonable teaching model.' },
  { title: 'Scalar, thin, perfect optics', text: 'No polarization, no mask topography, no aberrations or flare. Assist printability is especially sensitive to mask 3D effects in real masks.' },
  { title: 'Simplest resist', text: 'Constant threshold after a 12 nm blur (an assumption). Simple threshold models are known to predict assist printing poorly; real flows use calibrated models.' },
  { title: 'Heuristic margins', text: 'The ±10 % CD tolerance, the 5 % EL criterion and the 10 % assist margin are teaching choices, labelled as such. They are not specifications.' },
  { title: 'Focus and dose only', text: 'The process window ignores mask CD error, stage and lens variation, and resist-thickness effects. The DOF values carry about ±1 nm numerical uncertainty.' },
  { title: 'Synthetic example', text: 'One 90 nm line at typical public optical settings. No employer, product or process data is used.' },
];

export const references = [
  { id: 'chen1993', authors: 'J. F. Chen, J. A. Matthews', year: 1993, title: 'Mask for photolithography (scattering or intensity-leveling bars)', source: 'US Patent 5,242,770', url: 'https://patents.google.com/patent/US5242770', use: 'Origin of scattering bars next to isolated edges.' },
  { id: 'garofalo1993', authors: 'J. G. Garofalo, C. J. Biddick, R. L. Kostelak, S. Vaidya', year: 1993, title: 'Mask assisted off-axis illumination technique for random logic', source: 'Journal of Vacuum Science & Technology B 11(6), 2651', doi: '10.1116/1.586579', use: 'Assist features extend off-axis illumination gains to isolated features.' },
  { id: 'lin1994', authors: 'B. J. Lin', year: 1994, title: 'The exposure-defocus forest', source: 'Japanese Journal of Applied Physics 33, 6756–6764', doi: '10.1143/JJAP.33.6756', use: 'Exposure-defocus windows, DOF and exposure latitude.' },
  { id: 'mansfield2000', authors: 'S. M. Mansfield, L. W. Liebmann, A. F. Molless, A. K. K. Wong', year: 2000, title: 'Lithographic comparison of assist feature design strategies', source: 'Proc. SPIE 4000, Optical Microlithography XIII, 63–76', doi: '10.1117/12.389061', use: 'One to four assists per space with off-axis illumination; process-window benefit and mask cost.' },
  { id: 'wong2001', authors: 'A. K.-K. Wong', year: 2001, title: 'Resolution Enhancement Techniques in Optical Lithography', source: 'SPIE Press, Tutorial Texts TT47', doi: '10.1117/3.401208', use: 'Scattering bars and off-axis illumination.' },
  { id: 'mack2007', authors: 'C. A. Mack', year: 2007, title: 'Fundamental Principles of Optical Lithography: The Science of Microfabrication', source: 'John Wiley & Sons', doi: '10.1002/9780470723876', use: 'Defocus, NILS, exposure latitude and process windows.' },
  { id: 'yu2008', authors: 'J.-C. Yu, P. Yu, H.-Y. Chao', year: 2008, title: 'Model-based sub-resolution assist features using an inverse lithography method', source: 'Proc. SPIE 7140, Lithography Asia 2008, 714014', doi: '10.1117/12.804678', use: 'Placing assists together with main-feature sizing.' },
  { id: 'yenikaya2009', authors: 'B. Yenikaya, O. Alexandrov, S. Chen, A. Liu, A. Mokhberi, A. Sezginer', year: 2009, title: 'Model-based assist features', source: 'Proc. SPIE 7379, Photomask and Next-Generation Lithography Mask Technology XVI, 73792Z', doi: '10.1117/12.824350', use: 'Focus-sensitivity-driven assist placement; assists and side lobes must not print.' },
];
