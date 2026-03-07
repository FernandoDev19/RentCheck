import api from "../config/api";

export const biometryRequestService = {
  request: async (customerId: string) => {
    const response = await api.post(`/biometry-requests/request`, {
      customerId,
    });
    return response.data;
  },

  async simulate(token: string, result: "approved" | "rejected") {
    const response = await api.patch(`/biometry-requests/simulate/${token}`, {
      result,
    });
    return response.data;
  },
};
