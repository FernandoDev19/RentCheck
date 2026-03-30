import api from "../config/api";

export const rentalService = {
  assignVehicle: async (rentalId: string, vehicleId: string) => {
    const { data } = await api.post(`/rentals/${rentalId}/assign-vehicle`, {
      vehicleId,
    });
    return data;
  },
};
