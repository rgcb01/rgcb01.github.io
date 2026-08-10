import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";
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
  currentProject,
  education,
  engineeringMetrics,
  experiences,
  featuredProject,
  heroBadges,
  highlights,
  navItems,
  profile,
  recruiterSnapshot,
  roadmap,
  skillGroups,
  upcomingProjects,
} from "./data.js";

export default function App() {
  return (
    <>
      <Navbar navItems={navItems} resumePath={profile.resumePath} />
      <main>
        <Hero profile={profile} badges={heroBadges} />
        <About />
        <RecruiterSnapshot snapshot={recruiterSnapshot} />
        <Highlights highlights={highlights} />
        <FeaturedGithub project={featuredProject} />
        <Projects currentProject={currentProject} upcomingProjects={upcomingProjects} />
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
