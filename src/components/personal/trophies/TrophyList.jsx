import { useMemo, useState } from "react";
import { formatDate, trophyTypeLabel } from "./trophyUtils.js";

const filters = [
  ["all", "All"],
  ["earned", "Earned"],
  ["locked", "Locked"],
  ["bronze", "Bronze"],
  ["silver", "Silver"],
  ["gold", "Gold"],
  ["platinum", "Platinum"],
];

export default function TrophyList({ trophies = [] }) {
  const [filter, setFilter] = useState("all");
  const visible = useMemo(() => {
    return trophies.filter((trophy) => {
      if (filter === "all") return true;
      if (filter === "earned") return trophy.earned;
      if (filter === "locked") return !trophy.earned;
      return trophy.type === filter;
    });
  }, [filter, trophies]);

  return (
    <section className="personal-section trophy-detail-section">
      <div className="section-toolbar">
        <div className="personal-heading">
          <p className="console-kicker">Trophy List</p>
          <h2>Earned and locked trophies from PSN.</h2>
        </div>
      </div>
      <div className="filter-row" aria-label="Filter trophies">
        {filters.map(([value, label]) => (
          <button className={filter === value ? "active" : ""} key={value} type="button" onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>
      {visible.length ? (
        <div className="trophy-list">
          {visible.map((trophy) => (
            <article className={`trophy-list-item ${trophy.earned ? "earned" : "locked"} ${trophy.type}`} key={`${trophy.groupId}-${trophy.id}`}>
              {trophy.icon ? <img src={trophy.icon} alt="" loading="lazy" /> : <div className={`trophy-medal ${trophy.type}`} aria-hidden="true" />}
              <div>
                <div className="card-topline">
                  <h3>{trophy.hidden && !trophy.earned ? "Hidden Trophy" : trophy.name || "Unnamed trophy"}</h3>
                  <span>{trophyTypeLabel(trophy.type)}</span>
                </div>
                <p>{trophy.hidden && !trophy.earned ? "Details hidden until earned." : trophy.description || "No trophy description provided by PSN."}</p>
                <div className="trophy-card-meta">
                  <b>{trophy.earned ? `Earned ${formatDate(trophy.earnedDate)}` : "Locked"}</b>
                  {trophy.groupId && <b>{trophy.groupId === "default" ? "Base Game" : `Group ${trophy.groupId}`}</b>}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-slot">No trophies match this filter.</div>
      )}
    </section>
  );
}
