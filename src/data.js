export const profile = {
  name: "Romulo Giancarlo Colorado Balboa",
  location: "Puebla, Mexico",
  email: "rgcb01@live.com.mx",
  linkedin: "https://www.linkedin.com/in/rgcb",
  github: "https://github.com/rgcb01",
  resumePath: "#contact",
  headline:
    "Mechatronics Engineer | Manufacturing Data | Automation | Industrial Vision | Production Engineering",
  summary:
    "I build practical engineering tools that combine Python, manufacturing data, computer vision, automation logic and process improvement to support production, quality and engineering decision-making.",
};

export const navItems = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Skills", href: "#skills" },
  { label: "Certifications", href: "#certifications" },
  { label: "Contact", href: "#contact" },
];

export const projects = [
  {
    title: "Manufacturing OEE Dashboard",
    status: "Published",
    description:
      "Built a manufacturing analytics dashboard using synthetic production data to analyze OEE, scrap rate, downtime, throughput and shift performance.",
    tags: ["Python", "Streamlit", "pandas", "Plotly", "Manufacturing KPIs"],
    github: "https://github.com/rgcb01/manufacturing-oee-dashboard",
    caseStudy: "",
  },
  {
    title: "OpenCV Industrial Inspection",
    status: "In progress",
    description:
      "Computer vision portfolio project for industrial-style visual inspection, defect detection, dimensional checks and pass/fail classification.",
    tags: ["Python", "OpenCV", "Computer Vision", "Quality Inspection"],
    github: "",
    caseStudy: "",
  },
  {
    title: "Industrial Log Analyzer",
    status: "Planned",
    description:
      "Python tool concept for parsing equipment-style logs and summarizing downtime, alarms, MTBF and MTTR trends.",
    tags: ["Python", "Logs", "Troubleshooting", "MTBF", "MTTR"],
    github: "",
    caseStudy: "",
  },
  {
    title: "Test & Validation Data Analyzer",
    status: "Planned",
    description:
      "Validation-style data analysis tool for pass/fail results, test limits, drift trends and engineering reports.",
    tags: ["Python", "Validation", "Test Data", "Cp/Cpk"],
    github: "",
    caseStudy: "",
  },
  {
    title: "Six Sigma DMAIC Case Study",
    status: "Planned",
    description:
      "Synthetic scrap reduction case study using DMAIC, Pareto analysis, control charts and process improvement documentation.",
    tags: ["Six Sigma", "DMAIC", "SPC", "Quality"],
    github: "",
    caseStudy: "",
  },
  {
    title: "PLC-Style Automation Cell Simulator",
    status: "Planned",
    description:
      "Automation logic simulator concept with sensors, actuators, state-machine behavior, interlocks and fault handling.",
    tags: ["Automation", "PLC Logic", "Sensors", "State Machines"],
    github: "",
    caseStudy: "",
  },
];

export const experiences = [
  {
    company: "Recyctum",
    role: "Industrial Vision Developer",
    dates: "January 2025 - December 2025",
    location: "Puebla, Mexico",
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
    bullets: [
      "Supported automotive program execution by managing schedules, engineering releases, prototype manufacturing, validations and delivery milestones.",
      "Coordinated 40 to 60 part numbers and 80 to 100 engineering changes with internal teams, suppliers and cross-functional stakeholders.",
      "Reduced prototype delivery time by 15% through control dashboards, daily follow-up, priority tracking and escalation of risks.",
    ],
  },
];

export const skillGroups = [
  {
    title: "Programming & Data",
    skills: ["Python", "C++", "Linux command line", "MATLAB", "Simulink", "Excel", "pandas", "data analysis"],
  },
  {
    title: "Manufacturing & Quality",
    skills: ["OEE", "scrap analysis", "downtime analysis", "Six Sigma", "production tracking", "technical documentation"],
  },
  {
    title: "Computer Vision",
    skills: ["OpenCV", "preprocessing", "segmentation", "edge detection", "contour analysis", "camera and lighting setup"],
  },
  {
    title: "Automation & Industrial Systems",
    skills: ["PLC Siemens", "TIA Portal", "Ladder logic", "sensors", "actuators", "SAP", "Teamcenter", "MES", "FANUC", "RobotStudio"],
  },
  {
    title: "Engineering Tools",
    skills: ["SolidWorks", "Fusion 360", "CATIA", "AutoCAD", "ANSYS", "Simscape"],
  },
];

export const certifications = [
  "EF SET English Certificate - C2 Proficient, 87/100",
  "Six Sigma White Belt - CSSC",
  "Modern Robotics: Foundations of Robot Motion - Northwestern University",
  "Manufacturing Process with Autodesk Fusion 360 - Autodesk",
  "MATLAB/Simulink/Simscape - MathWorks",
];
