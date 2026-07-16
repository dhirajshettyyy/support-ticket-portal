// app/help-embed/[...path]/route.ts
import { NextRequest } from "next/server";
import { proxyToUpstream } from "../proxyShared";

type RouteParams = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxyToUpstream(req, (path ?? []).join("/"));
}

export const GET = handle;
export const POST = handle;
export const HEAD = handle;
