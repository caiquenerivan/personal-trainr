export type TrainerListing = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  especialidades: string | null;
  avgRating: number | null;
  ratingCount: number;
};

export type LinkedTrainer = {
  connectionId: string;
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  phone: string | null;
  instagram: string | null;
  bio: string | null;
  cref: string | null;
  crefState: string | null;
  website: string | null;
  especialidades: string | null;
  avgRating: number | null;
  ratingCount: number;
  myRating: number | null;
};

export type TrainerRating = { average: number | null; count: number; myRating: number | null };
