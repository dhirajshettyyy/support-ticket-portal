// app/fabricComponents.ts

export interface FabricComponentLink {
  name: string;
  href: string;
}

export const FABRIC_COMPONENT_LINKS: FabricComponentLink[] = [
  { name: "Fabric", href: "https://docs.nfh.global/fabric/fabric" },
  { name: "UNITS", href: "https://docs.finternetlab.io/" },
  { name: "DeDi", href: "https://dedi-global.gitbook.io/docs" },
  { name: "Vouch", href: "https://vouch.finance/" },
  { name: "Pincer", href: "https://pincer.network/" },
];
