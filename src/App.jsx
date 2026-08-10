import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";
import Experience from "./components/Experience.jsx";
import Skills from "./components/Skills.jsx";
import Certifications from "./components/Certifications.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import { certifications, experiences, navItems, profile, projects, skillGroups } from "./data.js";

export default function App() {
  return (
    <>
      <Navbar navItems={navItems} resumePath={profile.resumePath} />
      <main>
        <Hero profile={profile} />
        <About />
        <Projects projects={projects} />
        <Experience experiences={experiences} />
        <Skills skillGroups={skillGroups} />
        <Certifications certifications={certifications} />
        <Contact profile={profile} />
      </main>
      <Footer name={profile.name} />
    </>
  );
}
