import { useEffect } from "react";

const CREDLY_SCRIPT_ID = "credly-embed-script";

export default function CredlyBadges({ badges, badgeIds }) {
  const credentialBadges = badges || badgeIds?.map((id) => ({ id, provider: "Credly" })) || [];

  useEffect(() => {
    if (document.getElementById(CREDLY_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = CREDLY_SCRIPT_ID;
    script.src = "https://cdn.credly.com/assets/utilities/embed.js";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);
  }, []);

  return (
    <section className="section section-wide" id="credentials">
      <div className="section-heading">
        <p className="eyebrow">Verified Digital Credentials</p>
        <h2>Credly badges for verifiable training and certifications.</h2>
        <p className="section-intro">
          Verified digital credentials issued through Credly. Click any badge to view credential details and issuing
          organization.
        </p>
      </div>
      <div className="credly-grid">
        {credentialBadges.map((badge) => (
          <div className="credly-card" key={badge.id} aria-label={`${badge.provider || "Credly"} credential badge`}>
            <div
              data-iframe-width="150"
              data-iframe-height="270"
              data-share-badge-id={badge.id}
              data-share-badge-host="https://www.credly.com"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
