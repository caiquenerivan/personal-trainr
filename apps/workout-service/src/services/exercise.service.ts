import { exerciseRepository } from "../repositories/exercise.repository";

export const exerciseService = {
  async create(
    trainerId: string,
    data: {
      name: string;
      videoUrl?: string | null;
      gifUrl?: string | null;
      muscle?: string | null;
      weightTrack?: string | null;
      observations?: string | null;
    },
  ) {
    const exercise = await exerciseRepository.create({ ...data, trainerId });
    return { exercise };
  },

  async list(trainerId: string) {
    const exercises = await exerciseRepository.list(trainerId);
    return { exercises };
  },

  async update(
    id: string,
    trainerId: string,
    data: {
      name?: string;
      videoUrl?: string | null;
      gifUrl?: string | null;
      muscle?: string | null;
      weightTrack?: string | null;
      observations?: string | null;
    },
  ) {
    const existing = await exerciseRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Exercício não encontrado" };
    }
    if (existing.trainerId !== trainerId) {
      throw { status: 403, message: "Você não pode editar este exercício" };
    }

    const exercise = await exerciseRepository.update(id, data);
    return { exercise };
  },

  async remove(id: string, trainerId: string) {
    const existing = await exerciseRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Exercício não encontrado" };
    }
    if (existing.trainerId !== trainerId) {
      throw { status: 403, message: "Você não pode remover este exercício" };
    }

    await exerciseRepository.remove(id);
  },
};
