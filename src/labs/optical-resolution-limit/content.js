// Written content for "The Optical Resolution Limit": mathematical explanation, model limitations and
// references. Kept as plain data so the lab page, the crawler metadata and the validators can read it.
// Math uses KaTeX syntax (rendered at runtime by src/components/labs/MathTex.jsx).

export const mathSections = [
  {
    id: 'diffraction',
    title: '1. A periodic mask diffracts light into discrete orders',
    body: [
      'A mask with lines and spaces repeating every pitch p behaves like a diffraction grating. Light leaving it does not continue as a single beam. It splits into discrete orders m = 0, ±1, ±2, … whose directions obey the grating equation. Here θ is measured in the medium between lens and wafer, with refractive index n.',
    ],
    equations: [String.raw`n\sin\theta_m = \sin\theta_{\text{in}} + m\,\frac{\lambda}{p}`],
    after: [
      'Each order also carries a known amplitude. For a binary chrome mask with an open fraction d of each period (d = ½ for equal lines and spaces), the amplitudes are the Fourier coefficients of the mask:',
    ],
    afterEquations: [String.raw`c_0 = d, \qquad c_m = \frac{\sin(\pi m d)}{\pi m}`],
  },
  {
    id: 'pupil',
    title: '2. The lens keeps only the orders that fit inside its numerical aperture',
    body: [
      'The projection lens accepts directions only up to its numerical aperture NA = n sin θ_max. In the pupil plane, order m of an incident direction f_s lands at f_s + mλ/p, and it reaches the wafer only if that point falls inside the pupil disk:',
    ],
    equations: [String.raw`\left|\,\mathbf f_s + m\,\tfrac{\lambda}{p}\,\hat{\mathbf x}\,\right| \le \mathrm{NA}`],
    after: [
      'A pattern needs at least two interfering orders to form an image. If only the 0th order gets through, the wafer receives uniform light and the pattern is lost. The lens works like a low-pass filter on spatial frequency.',
    ],
  },
  {
    id: 'abbe',
    title: '3. Abbe: the coherent cut-off pitch',
    body: [
      'With on-axis (coherent) illumination, f_s = 0, the ±1 orders survive only while λ/p ≤ NA. This is Abbe’s condition (1873), and it sets the smallest pitch a coherently illuminated lens can image:',
    ],
    equations: [String.raw`p_{\min}^{\text{coherent}} = \frac{\lambda}{\mathrm{NA}}`],
  },
  {
    id: 'partial',
    title: '4. Partial coherence and off-axis illumination',
    body: [
      'Real scanners illuminate the mask from a range of directions, described by the partial-coherence factor σ: source directions reach |f_s| = σ·NA. Tilting the illumination moves the 0th order to one edge of the pupil, which leaves room for one first order at the opposite edge. This two-beam imaging extends the limit:',
    ],
    equations: [
      String.raw`p_{\min} = \frac{\lambda}{\mathrm{NA}\,(1+\sigma)} \;\xrightarrow{\;\sigma\to 1\;}\; \frac{\lambda}{2\,\mathrm{NA}}`,
    ],
    after: [
      'No illumination can do better than λ/(2NA), because the 0th order and a first order must both fit across the full pupil diameter 2NA. Lithographers usually quote the half-pitch with Rayleigh’s scaling form, and the k₁ factor measures how aggressive a process is:',
    ],
    afterEquations: [String.raw`\text{half-pitch} = k_1\,\frac{\lambda}{\mathrm{NA}}, \qquad k_1 = \frac{p}{2}\,\frac{\mathrm{NA}}{\lambda} \;\ge\; 0.25`],
  },
  {
    id: 'image',
    title: '5. The aerial image (what the simulation computes)',
    body: [
      'For each source direction, the field at the wafer is the sum of the surviving orders. Different source directions are mutually incoherent, so their intensities add. This is Abbe’s source-point integration, which is equivalent to Hopkins’ partially coherent imaging formulation (1953):',
    ],
    equations: [
      String.raw`I(x) = \sum_{s} w_s \left|\, \sum_{m} c_m\, P\!\left(\mathbf f_s + m\tfrac{\lambda}{p}\hat{\mathbf x}\right) e^{\,i 2\pi m x / p} \right|^2, \qquad P(\mathbf f) = \begin{cases} 1 & |\mathbf f| \le \mathrm{NA} \\ 0 & \text{otherwise} \end{cases}`,
    ],
    after: [
      'The lab reports two figures of merit for this image. Contrast (Michelson visibility) is how deep the modulation is. Normalized image log-slope (NILS) is how sharply the intensity changes at the nominal feature edge x_e, scaled by the feature width w. A steep log-slope makes the printed edge less sensitive to dose variation.',
    ],
    afterEquations: [
      String.raw`C = \frac{I_{\max}-I_{\min}}{I_{\max}+I_{\min}}, \qquad \mathrm{NILS} = w\,\left|\frac{d\ln I}{dx}\right|_{x = x_e}`,
    ],
    check: 'Check by hand: with coherent light, p = 300 nm, λ = 193 nm and NA = 0.93, only m = 0, ±1 pass (λ/p = 0.64 < 0.93). The image is I(x) = (½ + (2/π)·cos 2πx/p)². Its amplitude crosses zero, so I_min = 0 and C = 1; the 0.019 bump at the line centre is a side lobe. At the edge x = p/4, I = ¼ and |d ln I/dx| = 16/p, so NILS = (p/2)(16/p) = 8. The automated model check reproduces this image to 10⁻¹², and the lab reads C = 1.00 and NILS = 8.0.',
  },
  {
    id: 'rayleigh',
    title: '6. Rayleigh: two points instead of a grating',
    body: [
      'A circular aperture images a single point as an Airy pattern, not a point. Its first dark ring sits at 0.61 λ/NA. Rayleigh (1879) called two incoherent points “just resolved” when the peak of one falls on the first zero of the other. The summed profile then dips about 26.5 % between the peaks.',
    ],
    equations: [
      String.raw`I(r) = \left[\frac{2J_1(v)}{v}\right]^2,\quad v = \frac{2\pi\,\mathrm{NA}\,r}{\lambda}, \qquad R = 0.61\,\frac{\lambda}{\mathrm{NA}}`,
    ],
    after: [
      'The two criteria answer different questions. Rayleigh’s 0.61 applies to isolated incoherent points; Abbe’s λ/NA and λ/(2NA) apply to dense periodic patterns. Lithography reuses the form k₁·λ/NA from both.',
    ],
  },
];

export const limitations = [
  { title: 'Scalar diffraction', text: 'Light is treated as a scalar wave. Polarization and vector effects are ignored. Above roughly NA 0.8 they reduce contrast, especially for TM polarization, so high-NA immersion contrast here is optimistic.' },
  { title: 'Thin-mask (Kirchhoff) approximation', text: 'The mask is an infinitely thin binary transmission function. Mask topography (mask 3D effects, and shadowing in reflective EUV masks) is not modeled. Phase-shift masks and optical proximity correction (OPC) are not modeled either.' },
  { title: 'Ideal, focused optics', text: 'The pupil is a perfect top-hat disk. Lens aberrations, flare, defocus, depth of focus and dose errors are absent.' },
  { title: 'One-dimensional, infinite grating', text: 'Only equal (or set-duty) lines and spaces that repeat forever are imaged. Line ends, isolated features, two-dimensional layouts and the proximity effects that OPC corrects are outside the model.' },
  { title: 'Aerial image only', text: 'The model stops at the light intensity above the resist. Exposure dose, resist chemistry, acid diffusion, development and etch transfer are not simulated. The printability bands (contrast ≥ 0.5 strong, ≥ 0.2 weak) are teaching heuristics, not resist specifications.' },
  { title: 'Monochromatic, uniform sources', text: 'A single wavelength is used, with no laser bandwidth. Source shapes are uniform disks, rings or poles sampled on a 31 × 31 grid, so the curves have small discretization steps near cut-offs.' },
  { title: 'Illustrative presets', text: 'Wavelength and NA presets are typical public values for each technology generation, not the specification of any particular tool, fab or process. No employer or proprietary data was used.' },
];

export const references = [
  { id: 'abbe1873', authors: 'E. Abbe', year: 1873, title: 'Beiträge zur Theorie des Mikroskops und der mikroskopischen Wahrnehmung', source: 'Archiv für mikroskopische Anatomie 9, 413–468', doi: '10.1007/BF02956173', use: 'Coherent cut-off λ/NA; image formation by interference of diffracted orders.' },
  { id: 'rayleigh1879', authors: 'Lord Rayleigh', year: 1879, title: 'Investigations in optics, with special reference to the spectroscope', source: 'Philosophical Magazine, Series 5, Vol. 8, No. 49 (October 1879)', url: 'https://zenodo.org/record/1431143', use: 'Two-point resolution criterion, 0.61 λ/NA.' },
  { id: 'hopkins1953', authors: 'H. H. Hopkins', year: 1953, title: 'On the diffraction theory of optical images', source: 'Proceedings of the Royal Society of London A 217, 408–432', doi: '10.1098/rspa.1953.0071', use: 'Partially coherent imaging; effect of illumination on periodic objects.' },
  { id: 'mack2007', authors: 'C. A. Mack', year: 2007, title: 'Fundamental Principles of Optical Lithography: The Science of Microfabrication', source: 'John Wiley & Sons', doi: '10.1002/9780470723876', use: 'k₁ scaling, partial coherence, NILS and the lithographic aerial image.' },
  { id: 'wong2001', authors: 'A. K.-K. Wong', year: 2001, title: 'Resolution Enhancement Techniques in Optical Lithography', source: 'SPIE Press, Tutorial Texts TT47', doi: '10.1117/3.401208', use: 'Off-axis illumination and the λ/(2NA) two-beam limit.' },
  { id: 'lin2004', authors: 'B. J. Lin', year: 2004, title: 'Immersion lithography and its impact on semiconductor manufacturing', source: 'Journal of Micro/Nanolithography, MEMS, and MOEMS 3(3)', doi: '10.1117/1.1756917', use: 'Dry versus water-immersion ArF imaging; NA above 1.' },
  { id: 'bilski2019', authors: 'B. Bilski, J. Zimmermann, M. Roesch, J. Liddle, E. van Setten, G. Bottiglieri, J. van Schoot', year: 2019, title: 'High-NA EUV imaging: challenges and outlook', source: 'Proc. SPIE 11177, 35th European Mask and Lithography Conference, 111770I', doi: '10.1117/12.2536329', use: 'EUV at 13.5 nm with NA 0.33 and 0.55.' },
];
