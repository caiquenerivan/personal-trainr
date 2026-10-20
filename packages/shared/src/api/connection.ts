import type { AxiosInstance } from 'axios';
import type { LinkedTrainer, TrainerListing, TrainerRating } from '../types/connection';

// Lado do aluno: encontrar, vincular, avaliar e desvincular o personal.
export function createConnectionApi(api: AxiosInstance) {
  return {
    async listTrainers() {
      const response = await api.get<{ trainers: TrainerListing[] }>('/api/trainers');
      return response.data.trainers ?? [];
    },

    async getMyTrainers() {
      const response = await api.get<{ trainers: LinkedTrainer[] }>('/api/connections/my-trainers');
      return response.data.trainers ?? [];
    },

    async connect(trainerId: string) {
      const response = await api.post('/api/connections', { trainerId });
      return response.data;
    },

    async removeConnection(connectionId: string) {
      await api.delete(`/api/connections/${connectionId}`);
    },

    async rateTrainer(trainerId: string, rating: number) {
      const response = await api.post<TrainerRating>(`/api/trainers/${trainerId}/rating`, { rating });
      return response.data;
    },
  };
}
