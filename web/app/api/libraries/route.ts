import { NextResponse } from "next/server";

const PLEX_HOST  = process.env.PLEX_HOST  || "http://10.0.0.10:32400";
const PLEX_TOKEN = process.env.PLEX_TOKEN || "GifXg9g3Ao4LcRbpCzwZ";
const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_ENABLED !== "false";

export async function GET() {
  try {
    const res = await fetch(
      `${PLEX_HOST}/library/sections?X-Plex-Token=${PLEX_TOKEN}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Plex returned ${res.status}`);
    const data = await res.json();
    const dirs = data?.MediaContainer?.Directory || [];

    const libraries = dirs.map((d: Record<string, string>) => ({
      key:   d.key,
      title: d.title,
      type:  d.type,
    }));

    // Add demo library if enabled
    if (DEMO_ENABLED) {
      libraries.unshift({
        key: "demo",
        title: "🧪 Demo Library",
        type: "movie",
      });
    }

    return NextResponse.json(libraries);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);

    // If Plex connection fails but demo is enabled, return demo library only
    if (DEMO_ENABLED) {
      return NextResponse.json([
        {
          key: "demo",
          title: "🧪 Demo Library (Plex Offline)",
          type: "movie",
        },
      ]);
    }

    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
