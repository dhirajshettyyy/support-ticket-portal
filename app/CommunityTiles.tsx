// app/CommunityTiles.tsx
import type { ReactElement } from "react";
import { COMMUNITY_TILES, type TileIconKey } from "./communityLinks";
import { BookIcon, ChatIcon, HandshakeIcon, LinkIcon } from "./TileIcons";

const TILE_ICONS: Record<TileIconKey, () => ReactElement> = {
  book: BookIcon,
  chat: ChatIcon,
  link: LinkIcon,
  handshake: HandshakeIcon,
};

export function CommunityTiles() {
  return (
    <section className="community-tiles" aria-labelledby="community-tiles-heading">
      <h2 id="community-tiles-heading" className="visually-hidden">
        Ways to get involved
      </h2>
      <div className="community-tiles-grid">
        {COMMUNITY_TILES.map((tile) => {
          const Icon = TILE_ICONS[tile.iconKey];
          return (
            <article key={tile.title} className="community-tile">
              <span className="community-tile-icon" aria-hidden="true">
                <Icon />
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
          );
        })}
      </div>
    </section>
  );
}
