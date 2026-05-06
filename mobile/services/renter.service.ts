import type { ListResponse } from "../shared/types/list-response.type";
import api from "../core/api/api";
import type { Renter } from "../shared/types/renter.type";
import type { CreateRenterInterface } from "../pages/renters/interfaces/create-renter.interface";
import type { EditRenterInterface } from "../pages/renters/interfaces/edit-renter.interface";

export const renterService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    search?: string;
  }): Promise<ListResponse<Renter>> {
    const response = await api.get("/renters", {
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

  async findOne(id: string) {
    const response = await api.get(`/renters/${id}`);
    return response.data;
  },

  async editRenter(id: string, data: EditRenterInterface) {
    const response = await api.put(`/renters/${id}`, data);
    return response.data;
  },

  async createRenter(data: CreateRenterInterface) {
    const response = await api.post("/renters", data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/renters/${id}`);
    return response.data;
  },
};