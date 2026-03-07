import api from "../config/api";
import type { Plan } from "../models/plan.model";

export const planService = {
  getPlans: async (): Promise<Plan[]> => {
    const response = await api.get("/plans");
    return response.data;
  },
};