// app/communityLinks.ts

export const SITE_URL = "https://networksforhumanity.org";
export const DOCS_URL = "https://docs.nfh.global";
export const HELP_CENTER_URL = "https://support.nfh.global/";

export const SOCIAL_LINKS = {
  discord: "https://discord.com/invite/pbayfsrMR9?utm_source=website&utm_medium=BOCCTAButton&utm_campaign=BecknProtocol",
  linkedin: "https://www.linkedin.com/company/networks-for-humanity",
  github: "https://github.com/Networks-for-Humanity/fabric-support",
};

// Distinct from SOCIAL_LINKS.github (used by the header icon) - the
// Contribute tile points at Discussions specifically.
export const CONTRIBUTE_URL = "https://github.com/Networks-for-Humanity/fabric-support/discussions";

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
    description: "Help shape Fabric. Contribute, share ideas, and build with us.",
    href: CONTRIBUTE_URL,
    buttonText: "Join Discussions",
  },
];

