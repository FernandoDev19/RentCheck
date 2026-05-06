import type { ListResponse } from "../shared/types/list-response.type";
import api from "../core/api/api";
import type { Customer } from "../shared/types/customer.type";

export const customerService = {
  findByIdentity: async (identity: string) => {
    const response = await api.get(`/customers/identity/${identity}`);
    return response.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    search?: string;
  }): Promise<ListResponse<Customer>> => {
    const response = await api.get("/customers", {
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
    const response = await api.get(`/customers/${id}`);
    return response.data;
  }
};