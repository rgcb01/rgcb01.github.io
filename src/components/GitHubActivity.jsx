import { ExternalLink, GitCommit, Github } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const FLAGSHIP_REPOS = new Set([
  "manufacturing-oee-dashboard",
  "opencv-industrial-inspection",
  "industrial-automation-cell-simulator",
  "rgcb01.github.io",
]);

function formatDate(value) {
  if (!value) return "Recently active";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function GitHubActivity({ activity }) {
  const [repos, setRepos] = useState(activity.repositories);
  const [events, setEvents] = useState([]);
  const [source, setSource] = useState("fallback");

  useEffect(() => {
    let cancelled = false;

    async function loadGitHub() {
      try {
        const [repoResponse, eventResponse] = await Promise.all([
          fetch(`https://api.github.com/users/${activity.username}/repos?sort=updated&per_page=20`),
          fetch(`https://api.github.com/users/${activity.username}/events/public?per_page=20`),
        ]);
        if (!repoResponse.ok || !eventResponse.ok) throw new Error("GitHub API unavailable");

        const repoData = await repoResponse.json();
        const eventData = await eventResponse.json();
        if (cancelled) return;

        const enriched = activity.repositories.map((fallbackRepo) => {
          const apiRepo = repoData.find((repo) => repo.name === fallbackRepo.name);
          return {
            ...fallbackRepo,
            description: apiRepo?.description || fallbackRepo.description,
            updatedAt: apiRepo?.updated_at,
            language: apiRepo?.language,
            stars: apiRepo?.stargazers_count,
          };
        });

        const recentCommits = eventData
          .filter((event) => event.type === "PushEvent" && FLAGSHIP_REPOS.has(event.repo.name.split("/").pop()))
          .slice(0, 4)
          .map((event) => ({
            repo: event.repo.name.split("/").pop(),
            date: event.created_at,
            message: event.payload?.commits?.[0]?.message || "Recent commit",
            url: `https://github.com/${event.repo.name}`,
          }));

        setRepos(enriched);
        setEvents(recentCommits);
        setSource("api");
      } catch {
        if (!cancelled) {
          setRepos(activity.repositories);
          setEvents([]);
          setSource("fallback");
        }
      }
    }

    loadGitHub();
    return () => {
      cancelled = true;
    };
  }, [activity]);

  const featuredRepos = useMemo(() => repos.filter((repo) => FLAGSHIP_REPOS.has(repo.name)), [repos]);

  return (
    <section className="section compact-section" id="engineering-activity">
      <div className="section-heading">
        <p className="eyebrow">GitHub / Engineering Activity</p>
        <h2>Recent repository work behind the portfolio.</h2>
        <p className="section-intro">{activity.description}</p>
      </div>
      <div className="github-activity-grid">
        <article className="repo-panel activity-summary">
          <Github size={26} />
          <h3>Actively Maintained Engineering Repositories</h3>
          <p>
            {source === "api"
              ? "Live public GitHub data loaded successfully. Static project data remains available as fallback."
              : "Showing curated repository data. Live GitHub enrichment is optional and never required for the site to work."}
          </p>
          <a href={activity.profileUrl} target="_blank" rel="noopener noreferrer">
            Full GitHub Profile <ExternalLink size={15} />
          </a>
        </article>

        <div className="repo-list">
          {featuredRepos.map((repo) => (
            <article className="repo-activity-card" key={repo.name}>
              <div className="card-topline">
                <h3>{repo.name}</h3>
                <a href={repo.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${repo.name} on GitHub`}>
                  <ExternalLink size={16} />
                </a>
              </div>
              <p>{repo.description}</p>
              <div className="mini-tag-list">
                {(repo.language ? [repo.language, ...repo.technologies] : repo.technologies).slice(0, 5).map((tag) => (
                  <span className="mini-tag" key={tag}>{tag}</span>
                ))}
              </div>
              <span className="repo-meta">
                {repo.updatedAt ? `Updated ${formatDate(repo.updatedAt)}` : "Curated portfolio repository"}
                {Number.isInteger(repo.stars) ? ` · ${repo.stars} stars` : ""}
              </span>
            </article>
          ))}
        </div>
      </div>

      <div className="recent-commit-panel">
        <div className="card-topline">
          <h3>Recent Commits</h3>
          <span className="status next">{source === "api" ? "Live API" : "Fallback"}</span>
        </div>
        {events.length ? (
          <div className="commit-list">
            {events.map((event) => (
              <a href={event.url} target="_blank" rel="noopener noreferrer" key={`${event.repo}-${event.date}-${event.message}`}>
                <GitCommit size={16} />
                <span>{event.repo}</span>
                <strong>{event.message}</strong>
                <em>{formatDate(event.date)}</em>
              </a>
            ))}
          </div>
        ) : (
          <p className="muted-copy">Recent commit data is unavailable right now; repository cards remain available.</p>
        )}
      </div>
    </section>
  );
}
