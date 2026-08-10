import { GraduationCap } from "lucide-react";

export default function Education({ education }) {
  return (
    <section className="section compact-section" id="education">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Education</p>
        <h2>Academic foundation in mechatronics engineering.</h2>
      </div>
      <article className="education-card">
        <GraduationCap size={24} />
        <div>
          <p className="company">{education.school}</p>
          <h3>{education.degree}</h3>
          <p className="meta">
            {education.dates} | {education.location}
          </p>
          <span className="recognition-badge">{education.recognition}</span>
        </div>
      </article>
    </section>
  );
}
