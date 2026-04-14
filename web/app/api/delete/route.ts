import { NextRequest, NextResponse } from "next/server";

const PLEX_HOST  = process.env.PLEX_HOST  || "http://10.0.0.10:32400";
const PLEX_TOKEN = process.env.PLEX_TOKEN || "GifXg9g3Ao4LcRbpCzwZ";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { ratingKeys } = body as { ratingKeys?: string[] };

  if (!Array.isArray(ratingKeys) || ratingKeys.length === 0)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const results = await Promise.allSettled(
    ratingKeys.map((key) =>
      fetch(`${PLEX_HOST}/library/metadata/${key}?X-Plex-Token=${PLEX_TOKEN}`, {
        method: "DELETE",
      })
    )
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed    = results.length - succeeded;
  return NextResponse.json({ succeeded, failed, total: ratingKeys.length });
}
