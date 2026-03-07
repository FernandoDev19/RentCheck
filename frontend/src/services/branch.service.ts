import type { ListResponse } from "../common/interfaces/list-response.interface";
import api from "../config/api";
import type { Branch } from "../models/branch.model";

export const branchService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    search?: string;
  }): Promise<ListResponse<Branch>> => {
    const response = await api.get("/branches", {
      params: {
        page: params?.page,
        limit: params?.limit,
        orderBy: params?.orderBy,
        orderDir: params?.orderDir,
        search: params?.search,
      },
    });
    return response.data;
  },

  getAllNames: async (): Promise<{id: string, name: string}[]> => {
    const response = await api.get("/branches/names");
    return response.data;
  },

  createBranch: async (branch: Branch): Promise<Branch> => {
    const response = await api.post("/auth/register/branch", branch);
    return response.data;
  },
};
