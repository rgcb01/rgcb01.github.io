import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";
import Publications from "./components/Publications.jsx";
import GitHubActivity from "./components/GitHubActivity.jsx";
import PersonalPage from "./components/PersonalPage.jsx";
import ProjectCaseStudy from "./components/projects/ProjectCaseStudy.jsx";
import Highlights from "./components/Highlights.jsx";
import PortfolioRoadmap from "./components/PortfolioRoadmap.jsx";
import FeaturedGithub from "./components/FeaturedGithub.jsx";
import Experience from "./components/Experience.jsx";
import Education from "./components/Education.jsx";
import Skills from "./components/Skills.jsx";
import Certifications from "./components/Certifications.jsx";
import CredlyBadges from "./components/CredlyBadges.jsx";
import EngineeringNumbers from "./components/EngineeringNumbers.jsx";
import RecruiterSnapshot from "./components/RecruiterSnapshot.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import {
  certifications,
  credlyBadgeIds,
  education,
  engineeringMetrics,
  experiences,
  featuredProjects,
  githubActivity,
  heroBadges,
  highlights,
  navItems,
  profile,
  publications,
  recruiterSnapshot,
  roadmap,
  skillGroups,
  upcomingProjects,
} from "./data.js";
import { caseStudies } from "./data/caseStudies.js";

function setPageMeta(title, description) {
  document.title = title;
  const meta = document.querySelector("meta[name='description']");
  if (meta) meta.setAttribute("content", description);
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const projectMatch = path.match(/^\/projects\/([^/]+)$/);

  if (path === "/personal") {
    setPageMeta(
      "Romulo Colorado | Player Profile",
      "Personal space for gaming, media, devlogs, roadmaps and experiments."
    );
    return <PersonalPage />;
  }

  if (projectMatch) {
    const study = caseStudies.find((item) => item.slug === projectMatch[1]);
    setPageMeta(
      study ? `${study.title} | Romulo Colorado Case Study` : "Project Case Study | Romulo Colorado",
      study?.summary || "Engineering project case study from Romulo Colorado's mechatronics portfolio."
    );
    return <ProjectCaseStudy study={study} />;
  }

  setPageMeta(
    "Romulo Colorado | Mechatronics, Manufacturing & Automation Engineer",
    "Mechatronics engineering portfolio focused on manufacturing analytics, quality engineering, industrial computer vision, PLC automation, test and validation."
  );

  return (
    <>
      <Navbar navItems={navItems} resumePath={profile.resumePath} />
      <main>
        <Hero profile={profile} badges={heroBadges} />
        <About />
        <RecruiterSnapshot snapshot={recruiterSnapshot} />
        <Highlights highlights={highlights} />
        <FeaturedGithub projects={featuredProjects} />
        <Publications publications={publications} />
        <Projects upcomingProjects={upcomingProjects} />
        <GitHubActivity activity={githubActivity} />
        <PortfolioRoadmap roadmap={roadmap} />
        <EngineeringNumbers metrics={engineeringMetrics} />
        <Experience experiences={experiences} />
        <Education education={education} />
        <Skills skillGroups={skillGroups} />
        <Certifications certifications={certifications} />
        <CredlyBadges badgeIds={credlyBadgeIds} />
        <Contact profile={profile} />
      </main>
      <Footer profile={profile} />
    </>
  );
}
