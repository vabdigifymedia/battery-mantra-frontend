import { apiFetch } from '@/lib/api/client';

export interface EngineerProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  isActive: boolean;
  partnerId?: string;
  partnerBusinessName?: string;
  createdAt: string;
}

export interface CreateEngineerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  password?: string;
  partnerId?: string;
}

export const engineerService = {
  getAll: () => apiFetch<EngineerProfile[]>('/api/admin/engineers'),
  
  getById: (id: string) => apiFetch<EngineerProfile>(`/api/admin/engineers/${id}`),
  
  create: (data: CreateEngineerRequest) => 
    apiFetch<EngineerProfile>('/api/admin/engineers', {
      method: 'POST',
      body: data,
    }),
    
  update: (id: string, data: CreateEngineerRequest) =>
    apiFetch<EngineerProfile>(`/api/admin/engineers/${id}`, {
      method: 'PUT',
      body: data,
    }),
    
  delete: (id: string) =>
    apiFetch<void>(`/api/admin/engineers/${id}`, {
      method: 'DELETE',
    }),
};
