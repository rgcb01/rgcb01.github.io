import { FileText, Github, Linkedin, Mail, MapPin } from "lucide-react";
import LinkedInBadge from "./LinkedInBadge.jsx";

export default function Contact({ profile }) {
  const availabilityText = typeof profile.availability === "string" ? profile.availability : profile.availability?.text;
  const showAvailability = typeof profile.availability === "string" || profile.availability?.visible;
  const hasResume = profile.resumePath && !profile.resumePath.startsWith("#");

  return (
    <section className="section contact-section" id="contact">
      <div className="section-heading">
        <p className="eyebrow">Contact</p>
        <h2>Open to New College Grad and entry-level engineering opportunities.</h2>
      </div>
      <div className="contact-layout">
        <div className="contact-panel">
          {showAvailability && <p>{availabilityText}</p>}
          <div className="contact-links">
            <a href={`mailto:${profile.email}`}>
              <Mail size={18} /> {profile.email}
            </a>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
              <Linkedin size={18} /> LinkedIn
            </a>
            <a href={profile.resumePath} target={hasResume ? "_blank" : undefined} rel={hasResume ? "noopener noreferrer" : undefined}>
              <FileText size={18} /> {profile.resumeLabel || "View Resume"}
            </a>
            <a href={profile.github} target="_blank" rel="noopener noreferrer">
              <Github size={18} /> GitHub
            </a>
            <span>
              <MapPin size={18} /> {profile.location}
            </span>
          </div>
        </div>
        <LinkedInBadge />
      </div>
    </section>
  );
}
