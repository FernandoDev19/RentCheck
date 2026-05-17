import api from "../core/api/api";
import type { Plan } from "../shared/types/plan.type";

export interface CreatePlanPayload {
  name: string;
  price: number;
  max_users: number;
  max_branches: number;
  max_vehicles: number;
  advanced_reports_enabled: boolean;
  email_alerts_enabled: boolean;
  priority_support: boolean;
}

export const planService = {
  getPlans: async (): Promise<Plan[]> => {
    const response = await api.get("/plans");
    return response.data;
  },

  findOne: async (id: number): Promise<Plan> => {
    const response = await api.get(`/plans/${id}`);
    return response.data;
  },

  create: async (data: CreatePlanPayload): Promise<Plan> => {
    const response = await api.post("/plans", data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<CreatePlanPayload>,
  ): Promise<Plan> => {
    const response = await api.put(`/plans/${id}`, data);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/plans/${id}`);
  },
};