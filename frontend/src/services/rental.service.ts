import type { ListResponse } from "../shared/types/list-response.type";
import api from "../core/api/api";
import type { Rental } from "../shared/types/rental.type";
import type { CreateRentalManuallyInterface } from "../pages/rentals/interfaces/create-rental-manually.interface";

export const rentalService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    search?: string;
  }): Promise<ListResponse<Rental>> => {
    const response = await api.get("/rentals", {
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

  getAllByCustomer: async (customerId: string, params?: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    search?: string;
  }): Promise<ListResponse<Rental>> => {
    const response = await api.get(`/rentals/customer/${customerId}`, {
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

   getPendingFeedbacks: async (params?: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    search?: string;
  }): Promise<ListResponse<Rental>> => {
    const response = await api.get("/rentals/pending-feedback", {
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
    const response = await api.get(`/rentals/${id}`);
    return response.data;
  },

  createRentalManually: async (rental: CreateRentalManuallyInterface) => {
    const response = await api.post("/rentals/create-manually", rental);
    return response.data;
  },

  returnRental: async (rentalId: string) => {
    const response = await api.post(`/rentals/${rentalId}/return`);
    return response.data;
  },

  cancelRental: async (rentalId: string) => {
    const response = await api.delete(`/rentals/${rentalId}`);
    return response.data;
  }
};
