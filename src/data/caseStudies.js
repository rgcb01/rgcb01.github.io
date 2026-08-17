export const caseStudies = [
  {
    slug: "manufacturing-oee-dashboard",
    title: "Manufacturing OEE Dashboard",
    status: "Released",
    statusClass: "released",
    summary:
      "A manufacturing analytics and engineering diagnostics platform built on reproducible synthetic production data.",
    repository: "https://github.com/rgcb01/manufacturing-oee-dashboard",
    image: "/assets/projects/manufacturing-oee-dashboard.png",
    imageAlt: "Manufacturing OEE Dashboard showing KPI scorecards and OEE loss diagnostics.",
    problem:
      "Manufacturing engineers need to know whether production is meeting targets and where losses originate across availability, performance, quality, downtime, scrap, shifts, lines and products.",
    objectives: [
      "Calculate OEE, availability, performance and quality from production quantities.",
      "Identify downtime and scrap contributors through Pareto analysis.",
      "Compare line, shift and product performance without exposing confidential factory data.",
      "Generate deterministic engineering insights from filtered synthetic data.",
    ],
    approach: [
      "Synthetic production, downtime and scrap records are generated reproducibly.",
      "Data is loaded through a SQLite-backed analytics flow.",
      "Reusable Python modules calculate KPIs, previous-period deltas, Pareto contributors and engineering insights.",
      "Streamlit presents the diagnostic workflow as a manufacturing engineering dashboard.",
    ],
    decisions: [
      "Aggregate OEE is calculated from totals instead of averaging row-level OEE values.",
      "Synthetic data is explicitly labeled to avoid implying real factory production data.",
      "Rule-based insight generation keeps recommendations deterministic and interview-defensible.",
    ],
    validation: [
      "Automated tests cover OEE calculations, edge cases, Pareto logic, previous-period comparison and insight behavior.",
      "Dashboard sections are validated against known synthetic patterns documented in the repository.",
    ],
    results: [
      "Released GitHub project with diagnostic sections for KPI scorecards, line/shift heatmaps, product analysis, Pareto loss analysis and improvement comparison.",
      "Provides a reproducible synthetic manufacturing case study for discussing OEE, downtime, scrap and engineering actions.",
    ],
    limitations: [
      "The dataset is synthetic and does not represent a real factory.",
      "Results should be discussed as portfolio experiment outcomes, not production-line improvements.",
      "The dashboard supports engineering investigation; it does not prove root cause without process evidence.",
    ],
    learned: [
      "Manufacturing KPIs are only useful when aggregation is mathematically correct.",
      "A recruiter-friendly dashboard needs engineering interpretation, not only charts.",
      "Synthetic data can be valuable when the assumptions and limitations are documented.",
    ],
    technologies: ["Python", "Streamlit", "pandas", "Plotly", "SQLite", "pytest", "OEE", "Pareto Analysis"],
    evidence: [
      { label: "GitHub Repository", href: "https://github.com/rgcb01/manufacturing-oee-dashboard" },
      { label: "README / Case Study", href: "https://github.com/rgcb01/manufacturing-oee-dashboard#readme" },
    ],
    nextSteps: [],
  },
  {
    slug: "automated-visual-quality-inspection",
    title: "Automated Visual Quality Inspection",
    status: "Released",
    statusClass: "released",
    summary:
      "A reproducible industrial-style quality inspection study using classical computer vision, dimensional measurement and quality metrics.",
    repository: "https://github.com/rgcb01/opencv-industrial-inspection",
    paper: "https://doi.org/10.5281/zenodo.21879822",
    doi: "10.5281/zenodo.21879822",
    image: "/assets/projects/opencv-industrial-inspection.png",
    imageAlt: "Automated visual inspection dashboard with quality inspection summary metrics.",
    problem:
      "Quality engineers need explainable inspection systems that detect visible defects, measure dimensions, classify pass/fail results and communicate inspection risk.",
    objectives: [
      "Build a classical OpenCV inspection pipeline without machine learning or deep learning.",
      "Measure a legitimate continuous part characteristic against LSL/USL limits.",
      "Evaluate pass/fail classification, false accepts, false rejects and threshold sensitivity.",
      "Freeze a reproducible experiment for technical paper publication.",
    ],
    approach: [
      "Synthetic/self-generated inspection images are processed with thresholding, segmentation, edge detection and contour analysis.",
      "The pipeline produces defect masks, overlays, dimensional measurements and pass/fail decisions.",
      "SPC and capability sections analyze the measured continuous characteristic.",
      "A threshold study documents operating-point tradeoffs.",
    ],
    decisions: [
      "Classical computer vision was chosen to keep the inspection logic explainable and appropriate for entry-level quality engineering discussion.",
      "The positive classification class is defective part, making recall/detection-rate terminology explicit.",
      "Frozen experiment parameters make the project reproducible: 240 images, seed 42, threshold 95, nominal 50.00 mm, LSL 49.80 mm, USL 50.20 mm.",
    ],
    validation: [
      "Final report metrics are generated directly from the frozen experiment.",
      "Automated tests cover inspection metrics, threshold study, capability, SPC, measurement error and deterministic generation.",
      "A technical paper and DOI document methodology, experiment design, results and limitations.",
    ],
    results: [
      "Released GitHub project with v1.0.0 release, technical paper and DOI.",
      "Frozen reproducible experiment: dataset 240, seed 42, baseline threshold 95.",
      "Specification model: nominal 50.00 mm, LSL 49.80 mm, USL 50.20 mm.",
    ],
    limitations: [
      "This is not AI, machine learning or deep learning.",
      "The inspection context is synthetic/self-generated and does not prove industrial deployment.",
      "Lighting, camera variation and real production variation would require additional validation.",
    ],
    learned: [
      "False accepts and false rejects must be framed in quality-risk language.",
      "Threshold selection depends on inspection objectives, not a universal best value.",
      "Capability analysis requires a legitimate continuous measurement and explicit specification limits.",
    ],
    technologies: ["Python", "OpenCV", "Classical Computer Vision", "Quality Engineering", "SPC", "Dimensional Inspection", "pytest"],
    evidence: [
      { label: "GitHub Repository", href: "https://github.com/rgcb01/opencv-industrial-inspection" },
      { label: "DOI / Zenodo", href: "https://doi.org/10.5281/zenodo.21879822" },
    ],
    nextSteps: [],
  },
  {
    slug: "industrial-automation-cell-simulator",
    title: "Industrial Automation Cell Simulator",
    status: "Working Prototype",
    statusClass: "prototype",
    summary:
      "A software-in-the-loop automation cell prototype using OpenPLC Runtime v4, Modbus TCP, a C++17 DigitalPlant and Streamlit HMI.",
    repository: "https://github.com/rgcb01/industrial-automation-cell-simulator",
    image: "/assets/projects/industrial-automation-cell-simulator.png",
    imageAlt: "Industrial automation cell simulator showing normal cycle output and control metrics.",
    problem:
      "Controls engineering work often requires validating sequences, interlocks, sensor feedback, actuator behavior and fault response before physical hardware is available.",
    objectives: [
      "Separate PLC control decisions from physical plant simulation.",
      "Use OpenPLC Runtime as the controller and Modbus TCP as the communication layer.",
      "Model sensors, actuators, interlocks, sequence states, fault injection and HMI diagnostics.",
      "Validate a real software-in-the-loop normal production cycle.",
    ],
    approach: [
      "OpenPLC Runtime v4 runs the IEC 61131-3 Ladder program.",
      "The C++17 DigitalPlant simulates conveyor motion, clamp dynamics, process completion, inspection and reject behavior.",
      "Modbus TCP exchanges located PLC variables between OpenPLC and the plant.",
      "Streamlit reads logs and snapshots for operator-style visibility.",
    ],
    decisions: [
      "C++ simulates physical behavior while PLC logic owns the sequence, timers, interlocks and alarms.",
      "Fault injection is modeled as physical/sensor behavior, not direct assignment of PLC fault codes.",
      "Project status is intentionally labeled Working Prototype until final generated-ST ordering and live fault validation are complete.",
    ],
    validation: [
      "Live OpenPLC Modbus health check passed on 127.0.0.1:5020.",
      "A real normal software-in-the-loop production cycle completed successfully under OpenPLC control through Modbus TCP.",
      "Static PLC XML tests verify located variables, command writers and scan-phase ordering.",
    ],
    results: [
      "Completed: true",
      "Total parts: 1; good parts: 1; rejected parts: 0",
      "Mean cycle time: approximately 6.12 s",
      "Communication failures: 0",
      "Local Modbus round trip: average approximately 0.395 ms, median approximately 0.374 ms, P95 approximately 0.582 ms, max approximately 0.875 ms",
    ],
    limitations: [
      "Measurements are local software-in-the-loop values, not hardware PLC benchmarks.",
      "No physical PLC hardware or certified safety logic is involved.",
      "OpenPLC-generated Structured Text ordering still requires final stabilization for deterministic fault/reset behavior.",
      "Final live reject, E-stop, clamp timeout and recovery validation are pending.",
    ],
    learned: [
      "A realistic automation simulation needs a strict distinction between PLC commands, physical state and sensor feedback.",
      "Generated PLC execution order can be as important as the boolean equations themselves.",
      "Honest prototype status is more credible than overclaiming incomplete fault validation.",
    ],
    technologies: ["C++17", "OpenPLC", "IEC 61131-3", "Ladder Logic", "Modbus TCP", "Digital Plant Simulation", "Streamlit HMI"],
    evidence: [
      { label: "GitHub Repository", href: "https://github.com/rgcb01/industrial-automation-cell-simulator" },
      { label: "Known Limitation", href: "https://github.com/rgcb01/industrial-automation-cell-simulator#known-limitation" },
    ],
    architecture: ["OpenPLC Runtime v4", "Modbus TCP", "C++17 Digital Plant", "HMI / Logging / Metrics"],
    nextSteps: [
      "Reimport stabilized PLCOpen XML into OpenPLC Editor.",
      "Validate generated Structured Text dependency order.",
      "Run live reject, F004 clamp timeout, F001 E-stop and recovery validation.",
      "Run a deterministic multi-cycle software-in-the-loop experiment.",
    ],
  },
];
