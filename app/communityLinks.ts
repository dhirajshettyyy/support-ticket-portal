// app/communityLinks.ts

export const SITE_URL = "https://networksforhumanity.org";
export const DOCS_URL = "https://docs.nfh.global";
export const HELP_CENTER_URL = "https://fabric.support.site/";

export const SOCIAL_LINKS = {
  discord: "https://discord.com/invite/beckn",
  linkedin: "https://www.linkedin.com/company/networks-for-humanity",
  github: "https://github.com/Networks-for-Humanity",
};

export interface CommunityTile {
  icon: string;
  title: string;
  description: string;
  href: string;
  buttonText: string;
}

export const COMMUNITY_TILES: CommunityTile[] = [
  {
    icon: "\u{1F4DA}",
    title: "Learn",
    description: "Explore comprehensive documentation on DeDi Registry, CATALG, ONIX, and the full Fabric stack.",
    href: DOCS_URL,
    buttonText: "Explore Docs",
  },
  {
    icon: "\u{1F4AC}",
    title: "Interact",
    description: "Join our Discord community. Ask questions, share insights, and connect with other builders.",
    href: SOCIAL_LINKS.discord,
    buttonText: "Join Discord",
  },
  {
    icon: "\u{1F517}",
    title: "Connect",
    description: "Meet the global Fabric community on LinkedIn. Stay updated, network, and collaborate.",
    href: SOCIAL_LINKS.linkedin,
    buttonText: "Follow on LinkedIn",
  },
  {
    icon: "\u{1F91D}",
    title: "Contribute",
    description: "Help shape Fabric. Contribute to open-source, share ideas, and build with us.",
    href: SOCIAL_LINKS.github,
    buttonText: "View on GitHub",
  },
];

export interface HelpArticle {
  title: string;
  href: string;
}

// Real, verified pages from docs.nfh.global — not placeholders.
export const TOP_HELP_ARTICLES: HelpArticle[] = [
  { title: "Getting started with Fabric", href: `${DOCS_URL}/build/getting-started-with-fabric` },
  { title: "REGISTR — build trusted networks", href: `${DOCS_URL}/product-documentation/products/registr` },
  { title: "CATALG — publish catalogs", href: `${DOCS_URL}/product-documentation/products/catalg` },
  { title: "DISCOVR — find catalogs", href: `${DOCS_URL}/product-documentation/products/discovr` },
  { title: "ONIX — connect to everything", href: `${DOCS_URL}/product-documentation/products/onix` },
];
