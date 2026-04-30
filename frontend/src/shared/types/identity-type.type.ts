export const IDENTITY_TYPE = {
  CC: 'CC',
  TI: 'TI',
  CE: 'CE',
  NIT: 'NIT',
  DNI: 'DNI',
  RUC: 'RUC',
  CI: 'CI',
} as const;

export type IdentityType = typeof IDENTITY_TYPE[keyof typeof IDENTITY_TYPE];