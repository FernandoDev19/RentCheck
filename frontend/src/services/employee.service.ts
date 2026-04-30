import type { ListResponse } from "../shared/types/list-response.type";
import api from "../core/api/api";
import type { Employee } from "../shared/types/employee.type";
import type { CreateEmployeeInterface } from "../pages/employees/interfaces/create-employee.interface";
import type { EditEmployeeInterface } from "../pages/employees/interfaces/edit-employee.interface";

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

  update: async (id: string, data: EditEmployeeInterface) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },
  
  createEmployee: async (data: CreateEmployeeInterface) => {
    const response = await api.post("/employees", data);
    return response.data;
  }
};
