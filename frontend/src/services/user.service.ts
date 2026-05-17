import api from "../core/api/api";
import type { User } from "../shared/types/user.type";
import type { ListResponse } from "../shared/types/list-response.type";

export const userService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<ListResponse<User>> => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  findOne: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    data: { status?: string; name?: string; email?: string },
  ): Promise<void> => {
    await api.put(`/users/${id}`, data);
  },
};