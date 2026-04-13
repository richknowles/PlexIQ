/**
 * PlexIQ v4.0 - Type Definitions
 * ProxMenux-inspired architecture with type safety
 */

export interface MediaItem {
  id: string;
  title: string;
  year?: number;
  library: string;
  type: 'movie' | 'show' | 'episode';
  playCount: number;
  lastViewedAt?: string;
  addedAt: string;
  rating?: number;
  imdbRating?: number;
  tmdbRating?: number;
  rtRating?: number;
  fileSize: number;
  resolution?: string;
  codec?: string;
  score?: number;
  rationale?: string;
}

export interface AnalysisResult {
  item: MediaItem;
  score: number;
  rationale: string;
  recommendation: 'delete' | 'keep' | 'review';
  spaceSaved?: number;
}

export interface LibraryStats {
  name: string;
  itemCount: number;
  totalSize: number;
  avgScore?: number;
  deletionCandidates: number;
  potentialSpaceSaved: number;
}

export interface PlexIQConfig {
  plexUrl: string;
  deletionThreshold: number;
  neverDeleteRating: number;
  weights: {
    playCount: number;
    ratings: number;
    size: number;
    age: number;
    quality: number;
  };
}

export interface AnalysisProgress {
  current: number;
  total: number;
  stage: 'collecting' | 'enriching' | 'analyzing' | 'complete';
  message: string;
}
