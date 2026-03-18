import type { ListResponse } from "../common/interfaces/list-response.interface";
import api from "../config/api";
import type { Branch } from "../models/branch.model";
import type { EditBranchInterface } from "../pages/branches/interfaces/edit-branch.interface";

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

  getAllNames: async (): Promise<{ id: string; name: string }[]> => {
    const response = await api.get("/branches/names");
    return response.data;
  },

  findAllByRenterId: async (
    renterId: string,
    params?: {
      page?: number;
      limit?: number;
      orderBy?: string;
      orderDir?: "asc" | "desc";
      search?: string;
    },
  ): Promise<ListResponse<Branch>> => {
    const response = await api.get(`/branches/renter/${renterId}`, {
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

  findOne: async (id: string) => {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  },

  update: async (id: string, branch: EditBranchInterface) => {
    const response = await api.put(`/branches/${id}`, branch);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/branches/${id}`);
    return response.data;
  },

  createBranch: async (branch: Branch): Promise<Branch> => {
    const response = await api.post("/auth/register/branch", branch);
    return response.data;
  },
};
