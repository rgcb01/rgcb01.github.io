export const profile = {
  name: "Romulo Giancarlo Colorado Balboa",
  location: "Puebla, Mexico",
  email: "rgcb01@live.com.mx",
  linkedin: "https://www.linkedin.com/in/rgcb",
  github: "https://github.com/rgcb01",
  resumePath: "/assets/resume/romulo-colorado-resume.pdf",
  resumeLabel: "View Resume",
  photo: "/assets/profile/romulo-colorado-profile.jpg",
  photoAlt: "Professional portrait of Romulo Giancarlo Colorado Balboa.",
  headline:
    "Mechatronics Engineer | Manufacturing | Quality | Automation | Industrial Data & Vision",
  summary:
    "I build practical engineering systems that combine manufacturing data, quality engineering, computer vision, PLC automation and software tools to analyze production losses, automate industrial processes and support engineering decision-making.",
  availability: {
    visible: true,
    text:
      "Available for entry-level engineering opportunities in manufacturing, automation, quality, production, validation and process improvement.",
  },
  heroPanel: {
    label: "Target Roles",
    title: "Entry-Level Engineering",
    items: [
      "Manufacturing Analytics",
      "Quality Diagnostics",
      "Industrial Computer Vision",
      "PLC / Modbus Automation",
      "Test & Validation",
    ],
  },
};

export const siteMeta = {
  siteUrl: "https://rgcb01.github.io",
  title: "Romulo Colorado | Mechatronics, Manufacturing & Automation Engineer",
  description:
    "Mechatronics engineering portfolio focused on manufacturing analytics, quality engineering, industrial computer vision, PLC automation, test and validation.",
  socialImage: "/assets/profile/romulo-colorado-profile.jpg",
  twitterCard: "summary_large_image",
  themeColor: "#1f4e79",
};

export const navItems = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Publications", href: "#publications" },
  { label: "Skills", href: "#skills" },
  { label: "Credentials", href: "#certifications" },
  { label: "Contact", href: "#contact" },
];

export const heroBadges = [
  "Manufacturing",
  "Quality",
  "Automation",
  "Python",
  "C++",
  "Industrial Vision",
  "Test & Validation",
  "English C2",
];

export const highlights = [
  {
    label: "EF SET C2",
    title: "English proficiency",
    detail: "87/100",
  },
  {
    label: "Six Sigma White Belt",
    title: "Process improvement credential",
    detail: "Quality and problem-solving fundamentals",
  },
  {
    label: "Manufacturing OEE Dashboard",
    title: "Released manufacturing analytics project",
    detail: "Synthetic data, KPI monitoring and loss analysis",
  },
  {
    label: "Visual Quality Inspection",
    title: "Published computer vision case study",
    detail: "Classical OpenCV inspection with DOI and technical paper",
  },
  {
    label: "Open to Relocation",
    title: "Entry-level engineering opportunities",
    detail: "Manufacturing, quality, automation and validation roles",
  },
];

export const about = {
  eyebrow: "About",
  title: "Practical engineering tools for production and quality teams.",
  paragraphs: [
    "I am a recently graduated Mechatronics Engineer with experience in industrial vision, automotive manufacturing support, technical documentation and cross-functional coordination. My work combines Python, OpenCV, manufacturing data analysis and structured problem solving to build practical tools for engineering decisions.",
    "I am especially interested in entry-level roles where I can support production monitoring, quality analysis, automation projects, validation work and continuous improvement. My portfolio uses synthetic or portfolio datasets so every project is transparent, reproducible and safe to discuss in interviews.",
  ],
};

export const recruiterSnapshot = {
  availableFor: [
    "Manufacturing Engineer Jr",
    "Process Engineer Jr",
    "Quality Engineer Jr",
    "Automation Engineer Jr",
    "Production Engineer",
    "Test / Validation Engineer",
    "Engineering Trainee",
  ],
  strengths: [
    "Manufacturing analytics",
    "Quality diagnostics",
    "Industrial computer vision",
    "PLC / Modbus automation",
    "Python & C++ engineering tools",
    "Technical documentation",
    "Cross-functional coordination",
    "English C2",
  ],
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
    company: "Recyctum",
    role: "Industrial Vision Developer",
    dates: "January 2025 - December 2025",
    location: "Puebla, Mexico",
    tags: ["Python", "OpenCV", "Industrial Vision", "Validation"],
    bullets: [
      "Improved automatic material inspection and classification, achieving approximately 95% accuracy through industrial vision systems developed with Python and OpenCV.",
      "Reduced material classification time by approximately 40% using image processing algorithms, segmentation, edge detection and contour analysis.",
      "Integrated cameras, lighting and acquisition hardware while documenting technical tests, validating results and following up on operational adjustments.",
    ],
  },
  {
    company: "FORVIA",
    role: "Program Management Assistant - Lucid Air Serial Life Program",
    dates: "January 2024 - December 2024",
    location: "Puebla, Mexico",
    tags: ["Program Management", "Engineering Changes", "Suppliers", "Dashboards"],
    bullets: [
      "Supported automotive program execution by managing schedules, engineering releases, prototype manufacturing, validations and delivery milestones.",
      "Coordinated 40 to 60 part numbers and 80 to 100 engineering changes with internal teams, suppliers and cross-functional stakeholders.",
      "Reduced prototype delivery time by 15% through control dashboards, daily follow-up, priority tracking and escalation of risks.",
    ],
  },
];

export const education = {
  school: "Universidad Anahuac Puebla",
  degree: "Bachelor's Degree in Mechatronics Engineering",
  dates: "2019 - 2025",
  location: "Puebla, Mexico",
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
    title: "Programming & Data",
    skills: ["Python", "C++", "pandas", "NumPy", "SQLite", "MATLAB", "Simulink", "Excel", "Linux command line"],
  },
  {
    title: "Manufacturing & Quality",
    skills: [
      "OEE",
      "SPC",
      "Pareto Analysis",
      "Scrap Analysis",
      "Downtime Analysis",
      "Six Sigma",
      "Process Improvement",
      "Dimensional Inspection",
      "Technical Documentation",
    ],
  },
  {
    title: "Computer Vision",
    skills: [
      "OpenCV",
      "Image Processing",
      "Segmentation",
      "Edge Detection",
      "Contour Analysis",
      "Classical Computer Vision",
      "Industrial Inspection",
      "Camera / Lighting Setup",
    ],
  },
  {
    title: "Automation & Controls",
    skills: [
      "PLC",
      "OpenPLC",
      "IEC 61131-3",
      "Ladder Logic",
      "Modbus TCP",
      "Sensors",
      "Actuators",
      "Interlocks",
      "Fault Handling",
      "State Machines",
      "TIA Portal",
      "Siemens PLC",
    ],
  },
  {
    title: "Test & Validation",
    skills: [
      "Test Data Analysis",
      "Pass/Fail Analysis",
      "Engineering Validation",
      "Measurement Limits",
      "Reproducible Experiments",
      "Automated Testing",
    ],
  },
  {
    title: "Engineering Tools & Systems",
    skills: [
      "SolidWorks",
      "Fusion 360",
      "CATIA",
      "AutoCAD",
      "ANSYS",
      "Simscape",
      "SAP",
      "Teamcenter",
      "MES",
      "FANUC",
      "RobotStudio",
    ],
  },
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
];

export const credlyBadgeIds = credentialBadges.map((badge) => badge.id);
