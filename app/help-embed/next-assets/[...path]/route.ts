// app/help-embed/next-assets/[...path]/route.ts
// Mirrors the upstream help-center's /_next/* build assets so HTML rewritten
// by app/help-embed/[...path]/route.ts (which points asset references here
// instead of /_next/) can still load them, without colliding with this app's
// own /_next/ build output.
import { NextRequest } from "next/server";
import { proxyToUpstream } from "../../proxyShared";

type RouteParams = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxyToUpstream(req, `_next/${(path ?? []).join("/")}`);
}

export const GET = handle;
export const HEAD = handle;
