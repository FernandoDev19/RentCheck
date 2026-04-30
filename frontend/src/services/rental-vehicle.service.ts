import api from "../core/api/api";

export const rentalService = {
  assignVehicle: async (rentalId: string, vehicleId: string) => {
    const { data } = await api.post(`/rentals/${rentalId}/assign-vehicle`, {
      vehicleId,
    });
    return data;
  },
};
