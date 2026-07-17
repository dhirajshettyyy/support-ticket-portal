// app/CommunityTiles.tsx
import { COMMUNITY_TILES } from "./communityLinks";

export function CommunityTiles() {
  return (
    <section className="community-tiles" aria-labelledby="community-tiles-heading">
      <h2 id="community-tiles-heading" className="visually-hidden">
        Ways to get involved
      </h2>
      <div className="community-tiles-grid">
        {COMMUNITY_TILES.map((tile) => (
          <article key={tile.title} className="community-tile">
            <span className="community-tile-icon" aria-hidden="true">
              {tile.icon}
            </span>
            <h3>{tile.title}</h3>
            <p>{tile.description}</p>
            <a
              className="community-tile-link"
              href={tile.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tile.buttonText}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
