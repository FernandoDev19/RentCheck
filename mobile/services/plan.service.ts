import api from "../core/api/api";
import type { Plan } from "../shared/types/plan.type";

export const planService = {
  getPlans: async (): Promise<Plan[]> => {
    const response = await api.get("/plans");
    return response.data;
  },
};