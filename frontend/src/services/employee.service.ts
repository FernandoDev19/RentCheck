import type { ListResponse } from "../common/interfaces/list-response.interface";
import type { IdentityType } from "../common/types/identity-type.type";
import api from "../config/api";
import type { Employee } from "../models/employee.model";

export interface CreateEmployeeInterface {
    name: string;
    email: string;
    password: string;
    branchId?: string;
    identityType?: IdentityType;
    identityNumber: string;
}

export const employeeService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    search?: string;
  }): Promise<ListResponse<Employee>> => {
    const respone = await api.get("/employees", {
      params: {
        page: params?.page,
        limit: params?.limit,
        orderBy: params?.orderBy,
        orderDir: params?.orderDir,
        search: params?.search,
      },
    });

    return respone.data;
  },
  
  createEmployee: async (data: CreateEmployeeInterface) => {
    const response = await api.post("/auth/register/employee", data);
    return response.data;
  }
};
