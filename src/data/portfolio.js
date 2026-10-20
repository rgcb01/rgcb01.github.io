export const profile = {
  "name": "Rómulo Colorado",
  "fullName": "Rómulo Giancarlo Colorado Balboa",
  "location": "Guadalajara, Mexico",
  "email": "rgcb01@live.com.mx",
  "linkedin": "https://www.linkedin.com/in/rgcb",
  "github": "https://github.com/rgcb01",
  "resumePath": "/assets/resume/romulo-colorado-resume.pdf",
  "resumeLabel": "Download Resume",
  "resumeNote": "Previous resume edition; current role is reflected on this website.",
  "photo": "/assets/profile/romulo-colorado-profile.jpg",
  "photoAlt": "Professional portrait of Rómulo Colorado.",
  "role": "OPC Production Engineer",
  "employer": "Micron Technology",
  "since": "October 2026–Present",
  "headline": "OPC Production Engineer | Semiconductor Manufacturing | Mechatronics Engineering",
  "summary": "Mechatronics Engineer working at the intersection of semiconductor manufacturing, automation, and software-driven engineering.",
  "availability": {
    "visible": false,
    "text": ""
  },
  "heroPanel": {
    "label": "Current role",
    "title": "Semiconductor Engineering",
    "items": [
      "OPC Production Engineering",
      "Micron Technology",
      "Guadalajara, Mexico"
    ]
  }
};

export const siteMeta = {
  "siteUrl": "https://rgcb01.github.io",
  "title": "Rómulo Colorado | OPC Production Engineer | Semiconductor Engineering",
  "description": "Rómulo Colorado, OPC Production Engineer at Micron Technology in Guadalajara. Mechatronics background spanning computer vision, automation and manufacturing analytics. Personal engineering portfolio.",
  "socialImage": "/assets/social/engineering-preview.png",
  "twitterCard": "summary_large_image",
  "themeColor": "#080B12"
};

export const navItems = [
  {
    "label": "About",
    "href": "/#about"
  },
  {
    "label": "Experience",
    "href": "/#experience"
  },
  {
    "label": "Projects",
    "href": "/#projects"
  },
  {
    "label": "Research",
    "href": "/#publications"
  },
  {
    "label": "Contact",
    "href": "/#contact"
  }
];

export const heroBadges = [
  "Semiconductor Manufacturing",
  "Mechatronics",
  "Automation & Software"
];

export const highlights = [
  {
    "label": "EF SET C2",
    "title": "English proficiency",
    "detail": "87/100"
  },
  {
    "label": "Six Sigma White Belt",
    "title": "Process improvement credential",
    "detail": "Quality and problem-solving fundamentals"
  }
];

export const about = {
  "eyebrow": "Engineering background",
  "title": "A multidisciplinary foundation. A semiconductor direction.",
  "paragraphs": [
    "I am a Mechatronics Engineer and OPC Production Engineer at Micron Technology in Guadalajara, Mexico. My engineering path connects automotive program support, industrial computer vision, and my current professional development in semiconductor manufacturing.",
    "At FORVIA, I supported engineering coordination and automotive production programs. At Recyctum, I developed Python and OpenCV workflows for material inspection and classification. These experiences shaped how I approach software, manufacturing processes, validation, and technical collaboration.",
    "My independent projects explore manufacturing analytics, explainable visual inspection, and industrial automation. As I begin my semiconductor career, I am building domain knowledge around OPC and photolithography while continuing to develop practical engineering software."
  ]
};

export const recruiterSnapshot = {
  "availableFor": [],
  "strengths": [
    "Semiconductor engineering",
    "Industrial computer vision",
    "Manufacturing analytics",
    "Automation & software"
  ]
};

export const featuredProjects = [
  {
    title: "Manufacturing OEE Dashboard",
    status: "Released",
    statusClass: "released",
    problem:
      "Manufacturing teams need a practical way to identify where OEE losses originate across lines, shifts, products, downtime and scrap.",
    solution:
      "A Streamlit analytics and diagnostics platform using reproducible synthetic production data, SQLite, KPI logic, Pareto analysis and engineering insight rules.",
    tags: ["Python", "Streamlit", "pandas", "Plotly", "SQLite", "pytest", "OEE", "Pareto Analysis"],
    evidence: [
      "Aggregate OEE calculated from production quantities, not row averages",
      "Downtime and scrap Pareto analysis",
      "Line, shift and product diagnostics",
      "Before/after improvement analysis",
      "SPC-style monitoring and automated tests",
      "DOI: 10.5281/zenodo.21879822",
    ],
    github: "https://github.com/rgcb01/manufacturing-oee-dashboard",
    caseStudy: "/projects/manufacturing-oee-dashboard",
    caseStudyLabel: "View Case Study",
    paper: "https://doi.org/10.5281/zenodo.21879822",
    screenshot: "/assets/projects/manufacturing-oee-dashboard.png",
    screenshotAlt:
      "Manufacturing OEE Dashboard showing KPI scorecards, manufacturing status and production loss analysis.",
    note: "Synthetic manufacturing study / portfolio engineering project.",
  },
  {
    title: "Automated Visual Quality Inspection",
    status: "Released",
    statusClass: "released",
    problem:
      "Quality teams need explainable visual inspection workflows that measure parts, classify pass/fail results and expose inspection risk.",
    solution:
      "A released classical computer vision project using OpenCV for industrial-style inspection, dimensional measurement, SPC, capability and threshold studies.",
    tags: ["Python", "OpenCV", "Computer Vision", "SPC", "Dimensional Inspection", "pytest"],
    evidence: [
      "Frozen reproducible experiment: 240 images, seed 42",
      "Baseline threshold 95 with nominal 50.00 mm, LSL 49.80 mm, USL 50.20 mm",
      "Technical paper and GitHub release v1.0.0",
      "DOI: 10.5281/zenodo.21883473",
    ],
    github: "https://github.com/rgcb01/opencv-industrial-inspection",
    caseStudy: "/projects/automated-visual-quality-inspection",
    caseStudyLabel: "View Case Study",
    paper: "https://doi.org/10.5281/zenodo.21883473",
    screenshot: "/assets/projects/opencv-industrial-inspection.png",
    screenshotAlt:
      "Automated visual quality inspection dashboard showing inspection summary and quality metrics.",
    note: "Released reproducible engineering project using classical computer vision, not AI or deep learning.",
  },
  {
    title: "Industrial Automation Cell Simulator",
    status: "Working Prototype",
    statusClass: "prototype",
    problem:
      "Controls engineers need software-in-the-loop environments to reason about sensors, actuators, interlocks, PLC logic, faults and recovery before hardware is available.",
    solution:
      "A C++17 DigitalPlant connected to OpenPLC Runtime v4 through Modbus TCP, with Streamlit HMI diagnostics, logs, metrics and deterministic control logic.",
    tags: ["C++17", "OpenPLC", "IEC 61131-3", "Ladder Logic", "Modbus TCP", "Streamlit HMI"],
    evidence: [
      "Real OpenPLC-controlled normal cycle completed through Modbus TCP",
      "Validated local result: 1 total part, 1 good part, 0 rejected, active fault code 0",
      "Mean cycle time approximately 6.12 s",
      "Local software-in-the-loop Modbus average round trip approximately 0.395 ms",
    ],
    github: "https://github.com/rgcb01/industrial-automation-cell-simulator",
    caseStudy: "/projects/industrial-automation-cell-simulator",
    caseStudyLabel: "View Case Study",
    screenshot: "/assets/projects/industrial-automation-cell-simulator.png",
    screenshotAlt:
      "Industrial automation cell simulator screenshot showing a normal production cycle and control state.",
    note:
      "Working software-in-the-loop prototype. Final PLC fault/reset validation is pending because generated ST execution ordering still requires validation.",
  },
];

export const publications = [
  {
    title: "Classical Computer Vision for Automated Industrial Quality Inspection",
    author: "Romulo Colorado",
    year: "2026",
    type: "Technical Paper",
    doi: "10.5281/zenodo.21883473",
    doiUrl: "https://doi.org/10.5281/zenodo.21883473",
    repository: "https://github.com/rgcb01/opencv-industrial-inspection",
    description:
      "Reproducible engineering study documenting a classical OpenCV inspection workflow, dimensional limits, threshold sensitivity and quality metrics.",
  },
  {
    title: "OEE-Based Manufacturing Loss Diagnostics",
    author: "Romulo Colorado",
    year: "2026",
    type: "Engineering Case Study",
    doi: "10.5281/zenodo.21879822",
    doiUrl: "https://doi.org/10.5281/zenodo.21879822",
    repository: "https://github.com/rgcb01/manufacturing-oee-dashboard",
    description:
      "Synthetic manufacturing case study documenting OEE loss analysis, Pareto diagnostics, improvement comparison and limitations.",
  },
];

export const githubActivity = {
  username: "rgcb01",
  title: "GitHub / Engineering Activity",
  description:
    "Current GitHub work focuses on reproducible manufacturing analytics, classical computer vision for inspection, software-in-the-loop PLC automation and this portfolio site.",
  repositories: [
    {
      name: "manufacturing-oee-dashboard",
      url: "https://github.com/rgcb01/manufacturing-oee-dashboard",
      description: "Manufacturing analytics and OEE loss diagnostics with synthetic production data.",
      technologies: ["Python", "Streamlit", "pandas", "Plotly", "SQLite"],
    },
    {
      name: "opencv-industrial-inspection",
      url: "https://github.com/rgcb01/opencv-industrial-inspection",
      description: "Classical OpenCV quality inspection study with dimensional measurement and DOI.",
      technologies: ["Python", "OpenCV", "SPC", "pytest"],
    },
    {
      name: "industrial-automation-cell-simulator",
      url: "https://github.com/rgcb01/industrial-automation-cell-simulator",
      description: "OpenPLC, Modbus TCP and C++ DigitalPlant software-in-the-loop prototype.",
      technologies: ["C++17", "OpenPLC", "Modbus TCP", "Ladder Logic"],
    },
    {
      name: "rgcb01.github.io",
      url: "https://github.com/rgcb01/rgcb01.github.io",
      description: "React/Vite professional portfolio and personal profile site.",
      technologies: ["React", "Vite", "CSS", "GitHub Pages"],
    },
  ],
  profileUrl: "https://github.com/rgcb01",
};

export const upcomingProjects = [
  {
    title: "Semiconductor Test & Yield Analyzer",
    status: "Planned / Next",
    focus:
      "Semiconductor manufacturing test data, yield analysis, wafer maps, statistical diagnostics, failure-bin analysis and anomaly investigation.",
    tags: ["Python", "pandas", "NumPy", "Statistics", "Yield Analysis", "Semiconductor Manufacturing"],
  },
];

export const roadmap = [
  {
    stage: "Released",
    statusClass: "released",
    items: ["Manufacturing OEE Dashboard", "Automated Visual Quality Inspection"],
  },
  {
    stage: "Working Prototype",
    statusClass: "prototype",
    items: ["Industrial Automation Cell Simulator"],
  },
  {
    stage: "Planned / Next",
    statusClass: "next",
    items: ["Semiconductor Test & Yield Analyzer"],
  },
];

export const engineeringMetrics = [
  {
    value: "95%",
    label: "Industrial vision classification accuracy",
    context: "Recyctum industrial vision work with Python and OpenCV.",
    sourceHref: "#experience",
  },
  {
    value: "40%",
    label: "Reduction in material classification time",
    context: "Material classification workflow improvement at Recyctum.",
    sourceHref: "#experience",
  },
  {
    value: "15%",
    label: "Reduction in prototype delivery time",
    context: "FORVIA Lucid Air serial life program support.",
    sourceHref: "#experience",
  },
  {
    value: "80-100",
    label: "Engineering changes coordinated",
    context: "Engineering release and change coordination across internal and supplier teams.",
    sourceHref: "#experience",
  },
];

export const experiences = [
  {
    "company": "Micron Technology",
    "role": "OPC Production Engineer",
    "dates": "October 2026–Present",
    "location": "Guadalajara, Mexico",
    "tags": [
      "Semiconductor Manufacturing",
      "OPC",
      "Professional Development"
    ],
    "bullets": [
      "Beginning my role in OPC Production Engineering within the semiconductor manufacturing industry.",
      "The technical domain involves optical proximity correction: computational adjustments to mask patterns that account for pattern-transfer effects in photolithography.",
      "Developing semiconductor domain knowledge on a foundation of mechatronics, manufacturing, software, and engineering validation."
    ]
  },
  {
    "company": "Recyctum",
    "role": "Industrial Vision Developer",
    "dates": "January 2025 - December 2025",
    "location": "Puebla, Mexico",
    "tags": [
      "Python",
      "OpenCV",
      "Industrial Vision",
      "Validation"
    ],
    "bullets": [
      "Improved automatic material inspection and classification, achieving approximately 95% accuracy through industrial vision systems developed with Python and OpenCV.",
      "Reduced material classification time by approximately 40% using image processing algorithms, segmentation, edge detection and contour analysis.",
      "Integrated cameras, lighting and acquisition hardware while documenting technical tests, validating results and following up on operational adjustments."
    ]
  },
  {
    "company": "FORVIA",
    "role": "Program Management Assistant - Lucid Air Serial Life Program",
    "dates": "January 2024 - December 2024",
    "location": "Puebla, Mexico",
    "tags": [
      "Program Management",
      "Engineering Changes",
      "Suppliers",
      "Dashboards"
    ],
    "bullets": [
      "Supported automotive program execution by managing schedules, engineering releases, prototype manufacturing, validations and delivery milestones.",
      "Coordinated 40 to 60 part numbers and 80 to 100 engineering changes with internal teams, suppliers and cross-functional stakeholders.",
      "Reduced prototype delivery time by 15% through control dashboards, daily follow-up, priority tracking and escalation of risks."
    ]
  }
];

export const education = {
  "school": "Universidad Anáhuac México",
  "degree": "Bachelor's Degree in Mechatronics Engineering",
  "dates": "2019–2025",
  "location": "Puebla, Mexico",
  "sourceNote": "Current brief specifies Anáhuac México. Existing resume and repository record Anáhuac Puebla, 2019–2025; campus confirmation requested."
};

export const awards = [
  {
    title: "Premio CENEVAL al Desempeno de Excelencia - EGEL",
    issuer: "CENEVAL",
    issued: "2025",
    category: "Academic Recognition",
    description:
      "Academic performance recognition connected to the EGEL professional exam.",
    verificationUrl: "",
  },
];

export const skillGroups = [
  {
    "title": "Semiconductor Engineering",
    "context": "Current professional domain · developing knowledge",
    "skills": [
      "Optical Proximity Correction",
      "Semiconductor Manufacturing",
      "Photolithography",
      "Semiconductor Process Engineering"
    ]
  },
  {
    "title": "Software & Computing",
    "context": "Professional experience & independent projects",
    "skills": [
      "Python",
      "C++",
      "Data Analysis",
      "Software Development",
      "Technical Automation",
      "pandas",
      "SQLite"
    ]
  },
  {
    "title": "Manufacturing & Quality",
    "context": "Experience, project evidence & foundational certification",
    "skills": [
      "Process Improvement",
      "Six Sigma White Belt",
      "OEE",
      "Statistical Process Control",
      "Engineering Validation",
      "Pareto Analysis"
    ]
  },
  {
    "title": "Computer Vision",
    "context": "Professional experience & reproducible project evidence",
    "skills": [
      "OpenCV",
      "Image Processing",
      "Industrial Inspection",
      "Dimensional Analysis",
      "Segmentation",
      "Camera & Lighting Setup"
    ]
  },
  {
    "title": "Industrial Automation",
    "context": "Independent prototype & technical practice",
    "skills": [
      "PLC",
      "Industrial Control",
      "Modbus TCP",
      "Sensors and Actuators",
      "Process Automation",
      "IEC 61131-3"
    ]
  }
];

export const certifications = [
  {
    title: "EF SET English Certificate 87/100 (C2 Proficient)",
    issuer: "EF SET",
    issued: "August 2026",
    credentialUrl: "https://cert.efset.org/en/Z5GzgZ",
    image: "/assets/certificates/ef-set-c2.jpg",
    imageAlt: "EF SET English Certificate showing 87 out of 100 and C2 Proficient level.",
  },
  {
    title: "Six Sigma White Belt Certification",
    issuer: "The Council for Six Sigma Certification (CSSC)",
    issued: "August 2026",
    credentialId: "jpLmkjonk7",
    credentialUrl: "",
    image: "/assets/certificates/six-sigma-white-belt.jpg",
    imageAlt: "Six Sigma White Belt certificate issued by The Council for Six Sigma Certification.",
  },
  {
    title: "Modern Robotics, Course 1: Foundations of Robot Motion",
    issuer: "Northwestern University",
    issued: "September 2024",
    credentialId: "5KF88OEVOY5E",
    credentialUrl: "https://www.coursera.org/account/accomplishments/records/5KF88OEVOY5E",
    image: "/assets/certificates/modern-robotics-northwestern.jpg",
    imageAlt: "Northwestern University Coursera certificate for Modern Robotics Course 1.",
  },
  {
    title: "Manufacturing Process with Autodesk Fusion 360",
    issuer: "Autodesk",
    issued: "October 2024",
    credentialId: "9KJ0Y30YK9E9",
    credentialUrl: "https://www.coursera.org/account/accomplishments/records/9KJ0Y30YK9E9",
    image: "/assets/certificates/autodesk-fusion-manufacturing.jpg",
    imageAlt: "Autodesk Coursera certificate for Manufacturing Process with Autodesk Fusion 360.",
  },
  {
    title: "MATLAB Analisis de Datos",
    issuer: "Universidad Anahuac de Oaxaca",
    issued: "November 2023",
    credentialId: "87678215",
    credentialUrl: "https://diplomasuao.anahuac.mx/e73eb58c-07dc-4a37-bd85-087100418d48",
    image: "/assets/certificates/matlab-data-analysis.jpg",
    imageAlt: "MATLAB data analysis credential certificate.",
  },
];

export const credentialBadges = [
  { id: "95a74172-2d89-4da6-aa0f-6767840e1ae4", provider: "Credly" },
  { id: "9a4cb8cd-628f-4a15-a56b-8f1751a4d7f7", provider: "Credly" },
  { id: "81d1985d-fa62-488e-9b0b-808df047bf97", provider: "Credly" },
  { id: "d41d8656-5e83-4904-8211-ff6e56b2dcc4", provider: "Credly" },
  { id: "80e03361-1634-464d-96a8-7feda88d2bb6", provider: "Credly" },
  { id: "7ae696ff-4463-47c7-9ed7-978fbb212ecc", provider: "Credly" },
  { id: "e997c114-bcf3-4e50-9fe3-ff944e308176", provider: "Credly" },
  { id: "df4c78a0-90f2-4091-ba3e-d6b32c8f87a8", provider: "Credly" },
  { id: "a80d7fc3-bde1-497b-a15b-a02014e161e9", provider: "Credly" },
  { id: "e28c277e-2fa8-41ea-8b28-b0964e6e0f05", provider: "Credly" },
];

export const credlyBadgeIds = credentialBadges.map((badge) => badge.id);

export const semiconductorInterests = [
  {
    "title": "Optical Proximity Correction",
    "description": "Current professional direction; developing knowledge of OPC and its role in pattern transfer."
  },
  {
    "title": "Computational Lithography",
    "description": "Exploring the relationship between computation, mask patterns, and lithographic imaging."
  },
  {
    "title": "Semiconductor Process Optimization",
    "description": "An area of ongoing learning, connecting process behavior, variation, and structured problem solving."
  },
  {
    "title": "Manufacturing Data Analysis",
    "description": "Extending an existing interest in reproducible manufacturing analytics toward semiconductor applications."
  },
  {
    "title": "Semiconductor Test & Yield Analysis",
    "description": "Future independent project direction; no completed semiconductor yield study is claimed."
  },
  {
    "title": "Engineering Automation",
    "description": "Exploring opportunities for software to support repeatable analysis and technical workflows."
  }
];
