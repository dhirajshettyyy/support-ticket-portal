// app/communityLinks.ts

export const SITE_URL = "https://networksforhumanity.org";
export const DOCS_URL = "https://docs.nfh.global";
export const HELP_CENTER_URL = "https://fabric.support.site/";

export const SOCIAL_LINKS = {
  discord: "https://discord.com/invite/beckn",
  linkedin: "https://www.linkedin.com/company/networks-for-humanity",
  github: "https://github.com/Networks-for-Humanity",
};

export type TileIconKey = "book" | "chat" | "link" | "handshake";

export interface CommunityTile {
  iconKey: TileIconKey;
  title: string;
  description: string;
  href: string;
  buttonText: string;
}

export const COMMUNITY_TILES: CommunityTile[] = [
  {
    iconKey: "book",
    title: "Learn",
    description: "Explore comprehensive documentation on DeDi Registry, CATALG, ONIX, and the full Fabric stack.",
    href: DOCS_URL,
    buttonText: "Explore Docs",
  },
  {
    iconKey: "chat",
    title: "Interact",
    description: "Join our Discord community. Ask questions, share insights, and connect with other builders.",
    href: SOCIAL_LINKS.discord,
    buttonText: "Join Discord",
  },
  {
    iconKey: "link",
    title: "Connect",
    description: "Meet the global Fabric community on LinkedIn. Stay updated, network, and collaborate.",
    href: SOCIAL_LINKS.linkedin,
    buttonText: "Follow on LinkedIn",
  },
  {
    iconKey: "handshake",
    title: "Contribute",
    description: "Help shape Fabric. Contribute to open-source, share ideas, and build with us.",
    href: SOCIAL_LINKS.github,
    buttonText: "View on GitHub",
  },
];

