import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Publications from "./components/Publications.jsx";
import GitHubActivity from "./components/GitHubActivity.jsx";
import PersonalPage from "./components/PersonalPage.jsx";
import ActivityPage from "./components/personal/ActivityPage.jsx";
import BuildLogPage from "./components/personal/BuildLogPage.jsx";
import GamingHub from "./components/personal/GamingHub.jsx";
import MediaHub from "./components/personal/MediaHub.jsx";
import SystemPage from "./components/personal/SystemPage.jsx";
import ThoughtsPage from "./components/personal/ThoughtsPage.jsx";
import TrophyRoom from "./components/personal/trophies/TrophyRoom.jsx";
import TrophyGamePage from "./components/personal/trophies/TrophyGamePage.jsx";
import ProjectCaseStudy from "./components/projects/ProjectCaseStudy.jsx";
import Highlights from "./components/Highlights.jsx";
import FeaturedGithub from "./components/FeaturedGithub.jsx";
import Experience from "./components/Experience.jsx";
import Education from "./components/Education.jsx";
import Skills from "./components/Skills.jsx";
import Certifications from "./components/Certifications.jsx";
import CredlyBadges from "./components/CredlyBadges.jsx";
import Awards from "./components/Awards.jsx";
import EngineeringNumbers from "./components/EngineeringNumbers.jsx";
import RecruiterSnapshot from "./components/RecruiterSnapshot.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import {
  about,
  awards,
  certifications,
  credentialBadges,
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
  siteMeta,
  skillGroups,
} from "./data.js";
import { caseStudies } from "./data/caseStudies.js";

function upsertMeta(selector, attributes) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function setCanonical(href) {
  let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function setPageMeta(title, description, options = {}) {
  const canonicalUrl = `${siteMeta.siteUrl}${options.path || window.location.pathname}`;
  const imageUrl = `${siteMeta.siteUrl}${options.image || siteMeta.socialImage}`;

  document.title = title;
  upsertMeta("meta[name='description']", { name: "description", content: description });
  upsertMeta("meta[property='og:title']", { property: "og:title", content: title });
  upsertMeta("meta[property='og:description']", { property: "og:description", content: description });
  upsertMeta("meta[property='og:url']", { property: "og:url", content: canonicalUrl });
  upsertMeta("meta[property='og:image']", { property: "og:image", content: imageUrl });
  upsertMeta("meta[name='twitter:card']", { name: "twitter:card", content: siteMeta.twitterCard });
  upsertMeta("meta[name='twitter:title']", { name: "twitter:title", content: title });
  upsertMeta("meta[name='twitter:description']", { name: "twitter:description", content: description });
  upsertMeta("meta[name='twitter:image']", { name: "twitter:image", content: imageUrl });
  upsertMeta("meta[name='theme-color']", { name: "theme-color", content: siteMeta.themeColor });
  setCanonical(canonicalUrl);
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const projectMatch = path.match(/^\/projects\/([^/]+)$/);
  const trophyGameMatch = path.match(/^\/personal\/trophies\/([^/]+)$/);

  if (path === "/personal") {
    setPageMeta(
      "Romulo Colorado | Personal Console",
      "Summary dashboard for rgcb01 with current activity, latest achievement, media context and launchers into dedicated console sections.",
      { path: "/personal" }
    );
    return <PersonalPage />;
  }

  if (path === "/personal/gaming") {
    setPageMeta(
      "Romulo Colorado | Gaming Hub",
      "Cross-platform gaming hub for rgcb01 with PlayStation trophy data and Steam library, playtime and achievement summaries.",
      { path: "/personal/gaming" }
    );
    return <GamingHub />;
  }

  if (path === "/personal/media") {
    setPageMeta(
      "Romulo Colorado | Media",
      "Personal media hub for current games, watching, reading and listening notes.",
      { path: "/personal/media" }
    );
    return <MediaHub />;
  }

  if (path === "/personal/activity") {
    setPageMeta(
      "Romulo Colorado | Activity",
      "Personal console activity timeline across gaming, builds and local notes.",
      { path: "/personal/activity" }
    );
    return <ActivityPage />;
  }

  if (path === "/personal/thoughts") {
    setPageMeta(
      "Romulo Colorado | Player Thoughts",
      "Short personal notes for games, design observations and project ideas.",
      { path: "/personal/thoughts" }
    );
    return <ThoughtsPage />;
  }

  if (path === "/personal/builds") {
    setPageMeta(
      "Romulo Colorado | Build Log",
      "Personal build log for projects, experiments and debugging notes.",
      { path: "/personal/builds" }
    );
    return <BuildLogPage />;
  }

  if (path === "/personal/system") {
    setPageMeta(
      "Romulo Colorado | Console System",
      "Personal console system page for platform connections, roadmap and milestones.",
      { path: "/personal/system" }
    );
    return <SystemPage />;
  }

  if (path === "/personal/trophies") {
    setPageMeta(
      "Romulo Colorado | Trophy Room",
      "PlayStation Trophy Room for rgcb01 with PSN trophy progress, IGDB game metadata and manual personal ratings.",
      { path: "/personal/trophies" }
    );
    return <TrophyRoom />;
  }

  if (trophyGameMatch) {
    setPageMeta(
      "Trophy Game File | Romulo Colorado",
      "Individual PlayStation trophy progress and manual review file.",
      { path }
    );
    return <TrophyGamePage slug={trophyGameMatch[1]} />;
  }

  if (projectMatch) {
    const study = caseStudies.find((item) => item.slug === projectMatch[1]);
    setPageMeta(
      study ? `${study.title} | Romulo Colorado Case Study` : "Project Case Study | Romulo Colorado",
      study?.summary || "Engineering project case study from Romulo Colorado's mechatronics portfolio.",
      { path, image: study?.image }
    );
    return <ProjectCaseStudy study={study} />;
  }

  setPageMeta(
    siteMeta.title,
    siteMeta.description,
    { path: "/" }
  );

  return (
    <>
      <Navbar navItems={navItems} resumePath={profile.resumePath} />
      <main>
        <Hero profile={profile} badges={heroBadges} />
        <RecruiterSnapshot snapshot={recruiterSnapshot} />
        <About about={about} />
        <Highlights highlights={highlights} />
        <FeaturedGithub projects={featuredProjects} />
        <Experience experiences={experiences} />
        <EngineeringNumbers metrics={engineeringMetrics} />
        <Publications publications={publications} />
        <Skills skillGroups={skillGroups} />
        <Education education={education} />
        <Certifications certifications={certifications} />
        <Awards awards={awards} />
        <CredlyBadges badges={credentialBadges} />
        <GitHubActivity activity={githubActivity} />
        <Contact profile={profile} />
      </main>
      <Footer profile={profile} />
    </>
  );
}
