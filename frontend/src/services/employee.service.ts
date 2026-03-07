import type { ListResponse } from "../common/interfaces/list-response.interface";
import api from "../config/api";
import type { Employee } from "../models/employee.model";
import type { CreateEmployeeInterface } from "../pages/employees/interfaces/create-employee.interface";

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
