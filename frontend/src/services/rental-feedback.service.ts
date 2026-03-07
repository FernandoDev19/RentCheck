import api from "../config/api";

export interface CreateFeedbackScore {
  damageToCar: number;
  unpaidFines: number;
  arrears: number;
  carAbuse: number;
  badAttitude: number;
}

export interface CreateFeedbackCriticalFlags {
  impersonation?: boolean;
  vehicleTheft?: boolean;
}

export interface CreateFeedbackInterface {
  rentalId: string;
  score: CreateFeedbackScore;
  criticalFlags: CreateFeedbackCriticalFlags;
  comments?: string;
}

export const SCORE_FIELDS: { key: keyof CreateFeedbackScore; label: string }[] = [
  { key: "damageToCar", label: "Daño al vehículo" },
  { key: "unpaidFines", label: "Multas impagas" },
  { key: "arrears", label: "Atrasos" },
  { key: "carAbuse", label: "Abuso del vehículo" },
  { key: "badAttitude", label: "Mala actitud" },
];

export const rentalFeedbackService = {
  create: async (data: CreateFeedbackInterface) => {
    const response = await api.post("/rental-feedbacks", data);
    return response.data;
  },
};