// Written content for Lab 002, "Why We Intentionally Distort Photomasks": math, model limitations and references.
// Plain data (read by the lab page, the validators and the publication scripts). Math is KaTeX.
// Numbers quoted here come from published.json, which scripts/labs/check-opc-published.mjs verifies against
// model.js.

export const mathSections = [
  {
    id: 'proximity',
    title: '1. Why shapes change: the lens is a low-pass filter',
    body: [
      'A projection lens accepts spatial frequencies only up to its cut-off, NA/λ, about 4.8 µm⁻¹ for dry ArF at NA 0.93. A sharp corner or a line end contains far higher frequencies, so the image of the mask is a smoothed version of it. The smoothing reaches across neighbouring features, so the image of each feature depends on what surrounds it. This is the optical proximity effect.',
    ],
    equations: [String.raw`E_s(x,y) = \sum_{k_x,k_y} \hat M(k_x,k_y)\, P\!\left(\tfrac{k_x}{L_x} + f_{s,x},\ \tfrac{k_y}{L_y} + f_{s,y}\right) e^{\,i2\pi\left(\frac{k_x x}{L_x} + \frac{k_y y}{L_y}\right)}, \qquad P(\mathbf f) = \begin{cases}1 & |\mathbf f| \le \mathrm{NA}/\lambda \\ 0 & \text{otherwise}\end{cases}`],
    after: [
      'Here M̂ are the Fourier coefficients of the mask on a periodic field of size Lx × Ly, and f_s is one illumination direction. The mask is a sum of rectangles, so its coefficients have a closed form (a product of two sinc-like terms per rectangle). Edges can therefore sit anywhere, not only on a grid.',
    ],
  },
  {
    id: 'image',
    title: '2. Partially coherent aerial image',
    body: [
      'A conventional source with partial coherence σ illuminates the mask from a disk of directions |f_s| ≤ σ·NA/λ. Directions are mutually incoherent, so intensities add (Abbe’s formulation, equivalent to Hopkins’ transmission cross-coefficients):',
    ],
    equations: [String.raw`I(x,y) = \sum_{s=1}^{N_s} w_s\, \bigl|E_s(x,y)\bigr|^2, \qquad \sum_s w_s = 1`],
    after: [
      'The lab samples the source disk with a 97-point Vogel spiral (equal weights). With a 1000-point reference, every reported metric changes by at most 0.13 nm. Intensity is relative to a fully clear mask (I = 1).',
    ],
  },
  {
    id: 'resist',
    title: '3. Resist: blur, then a threshold (and which side prints)',
    body: [
      'The mask is bright field: clear glass with opaque chrome lines. The resist is positive tone: exposed resist dissolves. So a line survives where little light arrives, and the printed feature is the region where the blurred image stays below a threshold t. Blur stands in for acid diffusion during baking, with an assumed 12 nm Gaussian:',
    ],
    equations: [String.raw`I_r = I * G_{\sigma_d}, \quad \sigma_d = 12\ \text{nm}, \qquad \text{printed} = \{(x,y) : I_r(x,y) < t\}`],
    after: [
      'The threshold is set by dose-to-size: t is chosen so that the middle dense line prints exactly at its target width (t = 0.341 at the default settings). This constant-threshold model is the simplest resist model. It ignores resist chemistry, development and etch.',
    ],
  },
  {
    id: 'epe',
    title: '4. Edge placement error and the other metrics',
    body: [
      'EPE is measured at evaluation sites every 10 nm along each target edge. From the target edge, the lab follows the outward normal n̂ to where the printed contour crosses it. A positive value means the printed edge lies outside the target:',
    ],
    equations: [
      String.raw`\mathrm{EPE} = s^\ast\ \ \text{such that}\ \ I_r(\mathbf x_0 + s^\ast\hat{\mathbf n}) = t, \qquad \mathrm{RMS} = \sqrt{\tfrac{1}{N}\sum_i \mathrm{EPE}_i^2}`,
    ],
    after: [
      'Sites closer than 0.4·CD to a vertex are skipped: no band-limited image can reproduce a mathematical corner, so those points would only measure the unavoidable rounding. Corners get their own metric instead, the pull-back along the corner’s diagonal. Line-end shortening is the EPE at the centre of each line tip. Iso-dense bias is the printed-width error of the isolated line minus that of a dense line, at mid-height.',
      'The search runs from the feature’s centre outward to halfway towards its neighbour. If the feature is missing at its own centre, the site is reported as pinched; if it still prints halfway to the neighbour, as bridged. The crossing is refined by bisection to 0.001 nm.',
    ],
  },
  {
    id: 'opc',
    title: '5. Model-based OPC: let the model move the edges',
    body: [
      'Each target edge is cut into fragments: two 35 nm corner fragments and middle fragments of at most 120 nm. Each line-end tip is a single fragment. Each fragment j moves along its normal by an offset d_j. The loop simulates the image, measures the EPE at each fragment’s control point and moves the fragment against its error:',
    ],
    equations: [String.raw`d_j^{(n+1)} = \operatorname{clip}\!\left(d_j^{(n)} - g\,\mathrm{EPE}_j^{(n)},\ d_{\min},\ d_{\max}\right), \qquad g = 0.5,\ \ n = 0 \dots 16`],
    after: [
      'Mask-rule-like limits keep it manufacturable: a fragment may move at most 0.6·CD outward, must keep a 20 nm gap to its neighbours, and may move at most 0.35·CD inward. Control points on corner fragments sit 0.2·CD from the vertex, a target that can only be partly reached. Pushing toward it is what grows the shapes nobody drew: the side fragments next to a line tip bulge into a hammerhead, and the outer corner sprouts a serif. The code contains no serif or hammerhead rule.',
      'OPC strength s scales every offset, s·d_j, so s = 0 is the original mask and s = 1 the full correction. Rule-based OPC (advanced mode) instead applies fixed geometric rules: an edge bias, square serifs on outer corners and hammerheads on line ends. A grid search over 288 rule combinations finds a best RMS EPE of 6.2 nm, against 9.4 nm uncorrected and 3.4 nm model-based. One global bias cannot correct the isolated and the dense lines at the same time; moving each fragment separately can.',
    ],
    check: 'Check by hand: for coherent light and a long straight chrome edge, the image field at the geometric edge is half the clear-field amplitude, so I = (½)² = ¼. With a band-limited lens the lab computes 0.259 (σ = 0, no blur). Grid convergence: refining the FFT grid from 128 to 512 points changes no metric (by design: the grid has at least 4K + 2 points per axis, enough to hold |E|² without aliasing).',
  },
  {
    id: 'limits',
    title: '6. Where this simple loop stops working',
    body: [
      'At CD = space = 80 nm (k₁ = 0.39) this fixed-gain loop no longer converges, and some sites pinch or bridge. That is a limit of this algorithm, not of lithography or of OPC. The pitch is still above the optical cut-off for these settings, λ/(NA(1+σ)) ≈ 138 nm. Industrial solvers account for how moving one fragment affects its neighbours (coupled, sensitivity-based updates). They also use sub-resolution assist features, process-window objectives and inverse lithography.',
    ],
  },
];

export const educationalVsIndustrial = [
  ['Imaging', 'Scalar Abbe sum over 97 source points, thin mask', 'Vector imaging, SOCS/TCC kernels, mask 3D effects, flare, aberrations'],
  ['Resist', 'Constant threshold after a 12 nm Gaussian blur', 'Calibrated resist models fitted to wafer measurements (CD-SEM)'],
  ['Layout', 'One synthetic clip, 86 fragments', 'Full chips, billions of fragments, hierarchical processing'],
  ['Correction', 'Fixed-gain feedback, simple mask-rule limits', 'Coupled solvers, mask rule checks, assist features, process-window and inverse-lithography methods'],
  ['Verification', 'EPE at 644 sites, nominal dose and focus only', 'Full-chip verification over the process window (dose, focus, mask error)'],
];

export const limitations = [
  { title: 'Scalar, thin-mask optics', text: 'Light is a scalar wave and the mask an infinitely thin on/off transmission. Polarization and mask-topography effects are ignored. NA 0.93 is used because scalar optics stays reasonable there.' },
  { title: 'In focus, no aberrations', text: 'A perfect pupil at best focus and nominal dose. Process-window effects (defocus, dose and mask errors) are not modeled, so the corrections are tuned for one condition only.' },
  { title: 'Simplest resist model', text: 'A constant threshold on a Gaussian-blurred image, with a positive-tone resist and a bright-field mask. The blur length (12 nm) is an assumption. Real resist models are calibrated and depend on local image properties.' },
  { title: 'Periodic field', text: 'The FFT treats the 4096 × 2048 nm field as periodic. Features sit at least 1.3 µm from their periodic copies, well beyond the optical interaction range.' },
  { title: 'Educational OPC', text: 'A fixed-gain feedback loop with simple limits, no assist features and no coupling between fragments. It converges at the default settings but fails at k₁ ≈ 0.39, where industrial solvers still work.' },
  { title: 'Measured on a synthetic clip', text: 'Metrics come from one synthetic layout: three dense lines, an isolated line and an elbow. They are not data from any product, tool, fab or process. No employer or proprietary information was used.' },
];

export const references = [
  { id: 'hopkins1953', authors: 'H. H. Hopkins', year: 1953, title: 'On the diffraction theory of optical images', source: 'Proceedings of the Royal Society of London A 217, 408–432', doi: '10.1098/rspa.1953.0071', use: 'Partially coherent imaging, the basis of every OPC model.' },
  { id: 'otto1994', authors: 'O. W. Otto, J. G. Garofalo, K. K. Low, C.-M. Yuan, R. C. Henderson, C. Pierrat, R. L. Kostelak, S. Vaidya, P. K. Vasudev', year: 1994, title: 'Automated optical proximity correction: a rules-based approach', source: 'Proc. SPIE 2197, Optical/Laser Microlithography VII, 278–293', doi: '10.1117/12.175422', use: 'Rule-based OPC: edge biasing and corner rules.' },
  { id: 'cobb1995', authors: 'N. B. Cobb, A. Zakhor', year: 1995, title: 'Fast, low-complexity mask design', source: 'Proc. SPIE 2440, Optical/Laser Microlithography VIII', doi: '10.1117/12.209263', use: 'Early automated, model-driven mask correction.' },
  { id: 'cobb1998', authors: 'N. B. Cobb', year: 1998, title: 'Fast Optical and Process Proximity Correction Algorithms for Integrated Circuit Manufacturing', source: 'PhD dissertation, University of California, Berkeley', url: 'https://typeset.io/pdf/fast-optical-and-process-proximity-correction-algorithms-for-telex7u167.pdf', use: 'Model-based OPC with edge fragments and the sum-of-coherent-systems (SOCS) imaging decomposition.' },
  { id: 'wong2001', authors: 'A. K.-K. Wong', year: 2001, title: 'Resolution Enhancement Techniques in Optical Lithography', source: 'SPIE Press, Tutorial Texts TT47', doi: '10.1117/3.401208', use: 'Proximity effects, serifs, hammerheads and OPC strategies.' },
  { id: 'liebmann2003', authors: 'L. W. Liebmann', year: 2003, title: 'Layout impact of resolution enhancement techniques: impediment or opportunity?', source: 'Proceedings of the International Symposium on Physical Design (ISPD), 110–117', doi: '10.1145/640000.640026', use: 'How RET and OPC shape layouts; line-end and corner effects in design.' },
  { id: 'mack2007', authors: 'C. A. Mack', year: 2007, title: 'Fundamental Principles of Optical Lithography: The Science of Microfabrication', source: 'John Wiley & Sons', doi: '10.1002/9780470723876', use: 'Aerial image, threshold resist models, iso-dense bias and line-end shortening.' },
];
