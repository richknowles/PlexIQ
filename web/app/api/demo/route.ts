import { NextResponse } from "next/server";

// Demo library data - safe for testing without real Plex connection
const DEMO_MOVIES = [
  {
    id: 1,
    ratingKey: "demo_001",
    title: "The Magnificent Seven",
    year: 1960,
    score: 0.12,
    size: "4.2 GB",
    sizeBytes: 4500000000,
    rating: 8.2,
    plays: 15,
  },
  {
    id: 2,
    ratingKey: "demo_002",
    title: "Forgettable Movie",
    year: 2010,
    score: 0.89,
    size: "8.1 GB",
    sizeBytes: 8700000000,
    rating: 3.2,
    plays: 0,
  },
  {
    id: 3,
    ratingKey: "demo_003",
    title: "Classic Masterpiece",
    year: 1942,
    score: 0.05,
    size: "2.8 GB",
    sizeBytes: 3000000000,
    rating: 9.1,
    plays: 42,
  },
  {
    id: 4,
    ratingKey: "demo_004",
    title: "Unwatched Blockbuster",
    year: 2018,
    score: 0.78,
    size: "12.3 GB",
    sizeBytes: 13200000000,
    rating: 5.5,
    plays: 0,
  },
  {
    id: 5,
    ratingKey: "demo_005",
    title: "Family Favorite",
    year: 1995,
    score: 0.18,
    size: "3.5 GB",
    sizeBytes: 3760000000,
    rating: 7.8,
    plays: 23,
  },
  {
    id: 6,
    ratingKey: "demo_006",
    title: "Critically Panned",
    year: 2015,
    score: 0.92,
    size: "6.8 GB",
    sizeBytes: 7300000000,
    rating: 2.1,
    plays: 1,
  },
  {
    id: 7,
    ratingKey: "demo_007",
    title: "Hidden Gem",
    year: 2005,
    score: 0.35,
    size: "4.7 GB",
    sizeBytes: 5040000000,
    rating: 7.2,
    plays: 8,
  },
  {
    id: 8,
    ratingKey: "demo_008",
    title: "Space Dust Collectors",
    year: 2012,
    score: 0.85,
    size: "9.2 GB",
    sizeBytes: 9870000000,
    rating: 4.1,
    plays: 0,
  },
  {
    id: 9,
    ratingKey: "demo_009",
    title: "The Untouchables",
    year: 1987,
    score: 0.08,
    size: "3.9 GB",
    sizeBytes: 4190000000,
    rating: 8.8,
    plays: 31,
  },
  {
    id: 10,
    ratingKey: "demo_010",
    title: "Questionable Sequel",
    year: 2020,
    score: 0.81,
    size: "10.5 GB",
    sizeBytes: 11270000000,
    rating: 4.8,
    plays: 2,
  },
];

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const totalSize = DEMO_MOVIES.reduce((acc, m) => acc + m.sizeBytes, 0);
  const avgScore =
    Math.round(
      (DEMO_MOVIES.reduce((a, m) => a + m.score, 0) / DEMO_MOVIES.length) * 100
    ) / 100;

  return NextResponse.json({
    movies: DEMO_MOVIES,
    stats: {
      name: "🧪 Demo Library",
      itemCount: DEMO_MOVIES.length,
      totalSize,
      avgScore,
      deletionCandidates: 0, // computed client-side
      potentialSpaceSaved: 0,
    },
    isDemo: true,
  });
}
