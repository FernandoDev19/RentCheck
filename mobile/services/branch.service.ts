import type { ListResponse } from "../shared/types/list-response.type";
import api from "../core/api/api";
import type { Branch } from "../shared/types/branch.type";
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

  getAllNames: async (params?: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    search?: string;
  }): Promise<ListResponse<{ id: string; name: string }>> => {
    const response = await api.get("/branches/names", {
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
    const response = await api.post("/branches", branch);
    return response.data;
  },
};
