import { exerciseRepository } from "../repositories/exercise.repository";

export const exerciseService = {
  async create(data: {
    name: string;
    videoUrl?: string | null;
    gifUrl?: string | null;
    muscle?: string | null;
    weightTrack?: string | null;
    observations?: string | null;
  }) {
    const exercise = await exerciseRepository.create(data);
    return { exercise };
  },

  async list() {
    const exercises = await exerciseRepository.list();
    return { exercises };
  },
};
