import type { ListResponse } from "../common/interfaces/list-response.interface";
import api from "../config/api";
import type { Vehicle } from "../models/Vehicle.model";

interface GetAllParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: string;
  search?: string;
  branchId?: string;
}

export const vehicleService = {
  getAll: async (params: GetAllParams = {}): Promise<ListResponse<Vehicle>> => {
    const { data } = await api.get("/vehicles", { params });
    return data;
  },

  getOne: async (id: string): Promise<Vehicle> => {
    const { data } = await api.get(`/vehicles/${ id }`);
    return data;
  },

  getAllAvailable: async (params: GetAllParams = {}): Promise<ListResponse<Vehicle>> => {
    const { data } = await api.get("/vehicles/available", { params });
    return data;
  },

  getAllAvailableByDate: async (params: GetAllParams & { startDate?: string, endDate?: string } = {}): Promise<ListResponse<Vehicle>> => {
    const { data } = await api.get("/vehicles/available-by-date", { params });
    return data;
  },

  create: async (payload: Partial<Vehicle>): Promise<Vehicle> => {
    const { data } = await api.post("/vehicles", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Vehicle>): Promise<Vehicle> => {
    const { data } = await api.put(`/vehicles/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },
};