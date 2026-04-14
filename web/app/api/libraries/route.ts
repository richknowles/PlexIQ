import { NextResponse } from "next/server";

const PLEX_HOST  = process.env.PLEX_HOST  || "http://10.0.0.10:32400";
const PLEX_TOKEN = process.env.PLEX_TOKEN || "GifXg9g3Ao4LcRbpCzwZ";

export async function GET() {
  try {
    const res = await fetch(
      `${PLEX_HOST}/library/sections?X-Plex-Token=${PLEX_TOKEN}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Plex returned ${res.status}`);
    const data = await res.json();
    const dirs = data?.MediaContainer?.Directory || [];
    return NextResponse.json(
      dirs.map((d: Record<string, string>) => ({
        key:   d.key,
        title: d.title,
        type:  d.type,
      }))
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
