import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";
import Highlights from "./components/Highlights.jsx";
import PortfolioRoadmap from "./components/PortfolioRoadmap.jsx";
import FeaturedGithub from "./components/FeaturedGithub.jsx";
import Experience from "./components/Experience.jsx";
import Skills from "./components/Skills.jsx";
import Certifications from "./components/Certifications.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import {
  certifications,
  experiences,
  featuredGithub,
  heroBadges,
  highlights,
  navItems,
  profile,
  projects,
  roadmap,
  skillGroups,
} from "./data.js";

export default function App() {
  return (
    <>
      <Navbar navItems={navItems} resumePath={profile.resumePath} />
      <main>
        <Hero profile={profile} badges={heroBadges} />
        <About />
        <Highlights highlights={highlights} />
        <Projects projects={projects} />
        <PortfolioRoadmap roadmap={roadmap} />
        <FeaturedGithub project={featuredGithub} />
        <Experience experiences={experiences} />
        <Skills skillGroups={skillGroups} />
        <Certifications certifications={certifications} />
        <Contact profile={profile} />
      </main>
      <Footer profile={profile} />
    </>
  );
}
