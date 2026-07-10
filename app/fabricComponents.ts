// app/fabricComponents.ts

export interface FabricComponentLink {
  name: string;
  href: string;
}

export const FABRIC_COMPONENT_LINKS: FabricComponentLink[] = [
  { name: "Fabric", href: "https://docs.nfh.global/fabric/fabric" },
  { name: "UNITS", href: "https://docs.finternetlab.io/" },
  { name: "DeDi", href: "https://dedi.global/" },
  { name: "Vouch", href: "https://docs.nfh.global/#vouch" },
  { name: "Pincer", href: "https://docs.nfh.global/#pincer" },
];
