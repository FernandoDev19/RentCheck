export const VEHICLE_GAMMAS = [
  'Gama Baja',
  'Gama Media',
  'Gama Media-Alta',
  'Gama Alta',
  'Premium',
  'Lujo',
  'Económico',
  'Sedán',
  'Hatchback',
  'SUV',
  'Crossover',
  'Pick-up',
  'Van',
  '4x4 / Todoterreno',
  'Deportivo',
] as const;

export type VehicleGamma = (typeof VEHICLE_GAMMAS)[number];
