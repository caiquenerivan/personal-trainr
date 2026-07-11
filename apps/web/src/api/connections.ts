import { api } from './client';

export async function listAllTrainers() {
  const response = await api.get('/api/trainers');
  return response.data;
}

export async function searchTrainers(q: string) {
  const response = await api.get('/api/trainers/search', { params: { q } });
  return response.data;
}

export async function getMyTrainers() {
  const response = await api.get('/api/connections/my-trainers');
  return response.data;
}

export async function removeConnection(connectionId: string) {
  const response = await api.delete(`/api/connections/${connectionId}`);
  return response.data;
}

export async function listMyRoutines() {
  const response = await api.get('/api/routines');
  return response.data;
}

export async function getMyStudents() {
  const response = await api.get('/api/students');
  return response.data;
}

export async function createConnection(trainerId: string) {
  const response = await api.post('/api/connections', { trainerId });
  return response.data;
}
