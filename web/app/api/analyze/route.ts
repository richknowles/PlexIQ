import { NextRequest, NextResponse } from "next/server";

const PLEX_HOST  = process.env.PLEX_HOST  || "http://10.0.0.10:32400";
const PLEX_TOKEN = process.env.PLEX_TOKEN || "GifXg9g3Ao4LcRbpCzwZ";

function formatSize(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
  if (bytes >= 1e9)  return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6)  return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${bytes} B`;
}

// Higher score = more deletable (0–100).
// Low audience rating + never watched = high score.
// Items rated >= 8.0 show as high score but UI protects them separately.
function calcScore(rating: number, plays: number): number {
  const rFactor = Math.max(0, (8 - rating) / 8);      // 0 at rating 8+, 1 at 0
  const pFactor = Math.exp(-plays * 0.9);              // 1.0 at 0 plays, ~0.41 at 1
  return Math.round((0.55 * rFactor + 0.45 * pFactor) * 10000) / 100; // Scale to 0-100
}

export async function GET(req: NextRequest) {
  const sectionId = req.nextUrl.searchParams.get("sectionId");
  if (!sectionId)
    return NextResponse.json({ error: "Missing sectionId" }, { status: 400 });

  // Handle demo library
  if (sectionId === "demo") {
    const demoRes = await fetch(
      `${req.nextUrl.protocol}//${req.nextUrl.host}/api/demo`,
      { cache: "no-store" }
    );
    return NextResponse.json(await demoRes.json());
  }

  try {
    // Fetch all items (Plex paginates at 50 by default; request a large cap)
    const res = await fetch(
      `${PLEX_HOST}/library/sections/${sectionId}/all?X-Plex-Token=${PLEX_TOKEN}&X-Plex-Container-Size=2000`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Plex returned ${res.status}`);
    const data = await res.json();

    const items: Record<string, unknown>[] = data?.MediaContainer?.Metadata || [];
    const sectionTitle: string = (data?.MediaContainer?.title2 as string) || "Library";

    const movies = items
      .map((item, idx) => {
        const media  = (item.Media  as Record<string, unknown>[])?.[0] || {};
        const part   = (media.Part  as Record<string, unknown>[])?.[0] || {};
        const sizeBytes: number = Number(part.size) || 0;
        const rating  = Number(item.audienceRating || item.rating || 0);
        const plays   = Number(item.viewCount || 0);
        return {
          id:        idx + 1,
          ratingKey: String(item.ratingKey),
          title:     String(item.title),
          year:      item.year ? Number(item.year) : undefined,
          score:     calcScore(rating, plays),
          size:      formatSize(sizeBytes),
          sizeBytes,
          rating:    Math.round(rating * 10) / 10,
          plays,
          thumb:     item.thumb ? String(item.thumb) : undefined, // v5.4.0 - Poster URL
        };
      })
      .sort((a, b) => b.score - a.score);

    const totalSize = movies.reduce((acc, m) => acc + m.sizeBytes, 0);

    return NextResponse.json({
      movies,
      stats: {
        name:               sectionTitle,
        itemCount:          movies.length,
        totalSize,
        avgScore:           movies.length
          ? Math.round(movies.reduce((a, m) => a + m.score, 0) / movies.length)
          : 0,
        deletionCandidates: 0,      // computed client-side based on threshold
        potentialSpaceSaved: 0,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
