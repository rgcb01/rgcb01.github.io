import { useState } from 'react';
import { ArrowUpRight, ArrowDown, Download, Github, Linkedin, Mail, MapPin, Menu, X, Cpu, Code2, ScanLine, Workflow, ChartNoAxesCombined } from 'lucide-react';
import { profile, navItems, about, experiences, featuredProjects, skillGroups, semiconductorInterests, upcomingProjects, publications, education, certifications, awards, credentialBadges } from '../data/portfolio.js';

export function ProfessionalNav() {
  const [open, setOpen] = useState(false);
  return <header className="pro-header"><nav className="pro-nav pro-width" aria-label="Professional navigation" onKeyDown={event => {if (event.key === 'Escape') {setOpen(false); event.currentTarget.querySelector('.pro-menu')?.focus();}}}>
    <a className="pro-brand" href="/#home" aria-label="Rómulo Colorado home"><span className="pro-monogram">RC<span>⊞</span></span><span>RÓMULO COLORADO<small>ENGINEERING PORTFOLIO</small></span></a>
    <button className="pro-menu" aria-expanded={open} aria-controls="pro-links" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? <X/> : <Menu/>}</button>
    <div className={`pro-links ${open ? 'is-open' : ''}`} id="pro-links">
      {navItems.map(item => <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>)}
      <a className="pro-nav-resume" href={profile.resumePath} download>Resume <Download size={14}/></a>
    </div>
  </nav></header>;
}

export function ProfessionalFooter() {
  return <footer className="pro-footer pro-width"><div><a className="pro-footer-name" href="/">Rómulo Colorado</a><p>Personal engineering portfolio. Opinions and projects are my own and do not represent my employer.</p></div><div className="pro-footer-right"><a href="/personal">Off the clock <ArrowUpRight size={14}/></a><span>© 2026 · Guadalajara, Mexico</span></div></footer>;
}

function SectionHeading({number, label, title, children}) {
  return <div className="pro-section-heading"><div><p className="pro-eyebrow"><span>{number}</span> / {label}</p><h2>{title}</h2></div>{children && <p className="pro-section-intro">{children}</p>}</div>;
}
function Tags({items}) {return <div className="pro-tags">{items.map(item => <span key={item}>{item}</span>)}</div>;}
const icons = [Cpu, Code2, ChartNoAxesCombined, ScanLine, Workflow];

export default function ProfessionalPortfolio() {
  return <div className="pro-site">
    <a className="pro-skip" href="#pro-content">Skip to content</a>
    <ProfessionalNav/>
    <main id="pro-content">
      <section className="pro-hero pro-width" id="home" aria-labelledby="hero-title">
        <div className="pro-hero-copy">
          <p className="pro-eyebrow"><span className="pro-signal"/> SEMICONDUCTOR ENGINEERING</p>
          <h1 id="hero-title">Rómulo<br/><span>Colorado</span><span className="pro-title-dot">.</span></h1>
          <p className="pro-role">OPC Production Engineer<br/><span>at Micron Technology</span></p>
          <p className="pro-hero-summary">{profile.summary}</p>
          <p className="pro-location"><MapPin size={15}/> {profile.location}<span>·</span> Since October 2026</p>
          <div className="pro-actions"><a className="pro-button pro-primary" href="#projects">Explore Engineering Projects <ArrowUpRight size={17}/></a><a className="pro-button" href={profile.resumePath} download><Download size={16}/> Download Resume</a></div>
          <p className="pro-resume-note">{profile.resumeNote}</p>
          <div className="pro-social"><a href={profile.linkedin}><Linkedin size={17}/>LinkedIn <ArrowUpRight size={13}/></a><a href={profile.github}><Github size={17}/>GitHub <ArrowUpRight size={13}/></a><span>SOFTWARE × MANUFACTURING</span></div>
        </div>
        <div className="pro-hero-art">
          <div className="pro-art-top"><span>ENGINEERING / PATTERN & PROCESS</span><span>01 — 03</span></div>
          <img className="pro-wafer" src="/assets/engineering/wafer.svg" alt="Original conceptual silicon wafer artwork with patterned dies and lithography-inspired geometry. Not a production diagram." width="680" height="680" fetchPriority="high"/>
          <div className="pro-portrait"><img src={profile.photo} alt={profile.photoAlt} width="76" height="88"/><div><span>THE ENGINEER</span><strong>Multidisciplinary by design.</strong><p>Mechatronics → Semiconductors</p></div></div>
          <p className="pro-art-caption">CONCEPTUAL WAFER STUDY / ORIGINAL ARTWORK</p>
        </div>
      </section>
      <div className="pro-discipline-strip"><div className="pro-width"><span>01 <strong>Semiconductor manufacturing</strong></span><span>02 <strong>Automation & computer vision</strong></span><span>03 <strong>Software-driven engineering</strong></span><a href="#about" aria-label="Read engineering background"><ArrowDown size={18}/></a></div></div>

      <section className="pro-section pro-width" id="about">
        <SectionHeading number="01" label="BACKGROUND" title={about.title}/>
        <div className="pro-about"><p className="pro-about-lead">Connecting the physical world<br/>with <em>computational thinking.</em></p><div>{about.paragraphs.map(p => <p key={p}>{p}</p>)}</div></div>
        <div className="pro-path" aria-label="Engineering career progression">{['Mechatronics Engineering', 'Automotive Engineering', 'Industrial Computer Vision', 'Semiconductor Engineering'].map((step,i) => <div key={step}><span>0{i+1}</span><strong>{step}</strong>{i<3 && <ArrowUpRight size={18}/>}</div>)}</div>
      </section>

      <section className="pro-section pro-width" id="experience">
        <SectionHeading number="02" label="PROFESSIONAL EXPERIENCE" title="Engineering across industries.">From automotive coordination to industrial vision and semiconductor production engineering.</SectionHeading>
        <div className="pro-timeline">{experiences.map((job,i) => <article className={`pro-job ${i===0?'pro-job-current':''}`} key={job.company}><div className="pro-job-meta"><span className="pro-mono">{i===0?'CURRENT POSITION':`0${i+1} / EXPERIENCE`}</span><h3>{job.company}</h3><p>{job.dates}</p><span>{job.location}</span></div><div className="pro-job-content"><h4>{job.role}</h4><ul>{job.bullets.map(b => <li key={b}>{b}</li>)}</ul><Tags items={job.tags}/></div></article>)}</div>
      </section>

      <section className="pro-section pro-width" id="skills">
        <SectionHeading number="03" label="TECHNICAL DOMAINS" title="A connected engineering toolkit.">Experience and project evidence are distinguished from developing semiconductor domain knowledge.</SectionHeading>
        <div className="pro-domain-grid">{skillGroups.map((group,i) => {const Icon=icons[i];return <article className="pro-domain" key={group.title}><div className="pro-domain-top"><Icon size={24}/><span>0{i+1}</span></div><h3>{group.title}</h3><p>{group.context}</p><Tags items={group.skills}/></article>;})}</div>
      </section>

      <section className="pro-section pro-width" id="projects">
        <SectionHeading number="04" label="SELECTED ENGINEERING PROJECTS" title="Built. Tested. Documented.">Independent projects with public methods, reproducible evidence, and explicit limitations.</SectionHeading>
        <div className="pro-projects">{featuredProjects.map((project,i) => <article className="pro-project" key={project.title}>
          <a className="pro-project-image" href={project.caseStudy}><div className="pro-image-bar"><span>PROJECT / 0{i+1}</span><span>{project.status}</span></div><img src={project.screenshot} alt={project.screenshotAlt} loading="lazy" width="1200" height="720"/></a>
          <div className="pro-project-copy"><div className="pro-project-title"><span className={`pro-status ${project.statusClass}`}>{project.status}</span><h3><a href={project.caseStudy}>{project.title}</a></h3></div><dl><dt>Engineering problem</dt><dd>{project.problem}</dd><dt>Technical approach</dt><dd>{project.solution}</dd></dl><Tags items={project.tags}/><details className="pro-evidence"><summary>Validation & results <span>+</span></summary><ul>{project.evidence.map(e => <li key={e}>{e}</li>)}</ul></details><p className="pro-project-note">{project.note}</p><div className="pro-project-links"><a href={project.caseStudy}>Case study <ArrowUpRight size={16}/></a><a href={project.github}><Github size={15}/> Repository</a>{project.paper && <a href={project.paper}>DOI / Publication <ArrowUpRight size={14}/></a>}</div></div>
        </article>)}</div>
      </section>

      <section className="pro-focus-band" id="semiconductors"><div className="pro-width pro-section">
        <SectionHeading number="05" label="SEMICONDUCTOR DIRECTION" title="The next layer of engineering.">Current professional focus, areas of exploration, and future independent research. These topics do not imply completed semiconductor project work.</SectionHeading>
        <div className="pro-interests">{semiconductorInterests.map((topic,i) => <article key={topic.title}><span className="pro-mono">0{i+1} / {i===0?'PROFESSIONAL FOCUS':'EXPLORATION'}</span><h3>{topic.title}</h3><p>{topic.description}</p></article>)}</div>
        {upcomingProjects.map(project => <article className="pro-planned" key={project.title}><div><span className="pro-status">PLANNED / INDEPENDENT PROJECT</span><h3>{project.title}</h3><p>{project.focus}</p></div><div><Tags items={project.tags}/><p>Concept stage · implementation and validation have not started.</p></div></article>)}
      </div></section>

      <section className="pro-section pro-width" id="publications">
        <SectionHeading number="06" label="RESEARCH & PUBLICATIONS" title="Methods made reproducible.">Public technical writing supporting the independent engineering projects.</SectionHeading>
        <div className="pro-publications">{publications.map((paper,i) => <article key={paper.doi}><span className="pro-paper-index">0{i+1}</span><div><p className="pro-mono">{paper.type} / {paper.year}</p><h3><a href={paper.doiUrl}>{paper.title} <ArrowUpRight size={19}/></a></h3><p>{paper.description}</p><span className="pro-paper-author">{paper.author} · Independent technical publication</span><div className="pro-project-links"><a href={paper.doiUrl}>DOI: {paper.doi} <ArrowUpRight size={14}/></a><a href={paper.repository}>Repository <Github size={14}/></a></div></div></article>)}</div>
      </section>

      <section className="pro-section pro-width" id="certifications">
        <SectionHeading number="07" label="EDUCATION & RECOGNITION" title="Foundations for what comes next."/>
        <div className="pro-education"><div><p className="pro-mono">EDUCATION / {education.dates}</p><h3>Mechatronics Engineering</h3><p>{education.school}</p></div><div>{awards.map(award => <div key={award.title}><p className="pro-mono">ACADEMIC RECOGNITION / {award.issued}</p><h3>CENEVAL Academic Excellence Award</h3><p>{award.title}</p></div>)}</div></div>
        <div className="pro-credential-feature">{certifications.slice(0,2).map(cert => <a href={cert.credentialUrl || cert.image} key={cert.title}><span className="pro-mono">{cert.issuer} / {cert.issued}</span><h3>{cert.title}<ArrowUpRight size={20}/></h3><span>View credential</span></a>)}</div>
        <details className="pro-credentials"><summary>Technical certifications & digital credentials <span>+</span></summary><div className="pro-cert-list">{certifications.slice(2).map(cert => <article key={cert.title}><h4>{cert.title}</h4><p>{cert.issuer} · {cert.issued}</p><a href={cert.credentialUrl || cert.image}>Verify credential <ArrowUpRight size={14}/></a><a href={cert.image}>Certificate image</a></article>)}</div><div className="pro-badges">{credentialBadges.map((badge,i) => <a href={`https://www.credly.com/badges/${badge.id}/public_url`} key={badge.id}>Credly credential {String(i+1).padStart(2,'0')} <ArrowUpRight size={13}/></a>)}</div></details>
      </section>

      <section className="pro-contact-band" id="contact"><div className="pro-width pro-section"><p className="pro-eyebrow">08 / CONNECT</p><div className="pro-contact-grid"><div><h2>Let’s talk<br/><span>engineering.</span></h2><p>For professional connections, technical conversations,<br/>and exchanges across engineering disciplines.</p></div><div className="pro-contact-links"><a href={`mailto:${profile.email}`}><Mail size={21}/><span>{profile.email}</span><ArrowUpRight/></a><a href={profile.linkedin}><Linkedin size={21}/><span>Connect on LinkedIn</span><ArrowUpRight/></a><a href={profile.github}><Github size={21}/><span>Explore GitHub</span><ArrowUpRight/></a><a href={profile.resumePath} download><Download size={21}/><span>Download Resume</span><ArrowUpRight/></a><p className="pro-resume-note">{profile.resumeNote}</p></div></div></div></section>
    </main><ProfessionalFooter/>
  </div>;
}
