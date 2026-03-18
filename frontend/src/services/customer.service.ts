import type { ListResponse } from "../common/interfaces/list-response.interface";
import api from "../config/api";
import type { Customer } from "../models/customer.model";

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